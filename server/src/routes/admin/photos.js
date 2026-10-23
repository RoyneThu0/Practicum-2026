import { Router } from "express";
import pool from "../../db/pool.js";
import validatePhoto from "../../lib/validatePhoto.js";

const router = Router();

// Every column the admin panel needs, with camelCase names for the client.
const columns = `id, slug, title, alt, category, shape,
                 unsplash_id AS "unsplashId", credit, link,
                 sort_order AS "sortOrder"`;

// Turns "Savanna at sunset!" into "savanna-at-sunset". The slug only has to be
// unique; it's how the seed script recognises its own rows.
function slugify(title) {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "photo"
  );
}

async function uniqueSlug(title) {
  const base = slugify(title);
  const { rows } = await pool.query("SELECT slug FROM photos WHERE slug = $1 OR slug LIKE $2", [
    base,
    `${base}-%`,
  ]);
  const taken = new Set(rows.map((row) => row.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "id must be a number" });
    return null;
  }
  return id;
}

// Every photo in gallery order, plus how popular it is:
//   shortlistCount  how many signed-in visitors have it in their saved shortlist
//   bookingCount    how many booking requests included it
// (Guests' shortlists only live in their browser, so they can't be counted
// until they sign in or send a booking.)
async function listPhotos() {
  const { rows } = await pool.query(
    `SELECT p.id, p.slug, p.title, p.alt, p.category, p.shape,
            p.unsplash_id AS "unsplashId", p.credit, p.link,
            p.sort_order AS "sortOrder",
            COALESCE(s.count, 0)::int AS "shortlistCount",
            COALESCE(b.count, 0)::int AS "bookingCount"
       FROM photos p
       LEFT JOIN (SELECT photo_id, COUNT(*) AS count FROM shortlists GROUP BY photo_id) s
              ON s.photo_id = p.id
       LEFT JOIN (SELECT photo_id, COUNT(*) AS count
                    FROM bookings, unnest(photo_ids) AS photo_id
                   GROUP BY photo_id) b
              ON b.photo_id = p.id
      ORDER BY p.sort_order, p.id`
  );
  return rows;
}

// GET /api/admin/photos -> every photo in gallery order, with slug, sortOrder and counts.
router.get("/", async (req, res, next) => {
  try {
    res.json(await listPhotos());
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/photos -> add a photo at the end of the gallery.
router.post("/", async (req, res, next) => {
  const { photo, errors } = validatePhoto(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ error: "Check the highlighted fields", errors });

  try {
    const slug = await uniqueSlug(photo.title);
    const { rows } = await pool.query(
      `INSERT INTO photos (slug, title, alt, category, shape, unsplash_id, credit, link, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
               (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM photos))
       RETURNING ${columns}`,
      [slug, photo.title, photo.alt, photo.category, photo.shape, photo.unsplashId, photo.credit, photo.link]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/photos/:id -> replace a photo's details (the slug stays the same).
router.patch("/:id", async (req, res, next) => {
  const id = parseId(req, res);
  if (id === null) return;
  const { photo, errors } = validatePhoto(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ error: "Check the highlighted fields", errors });

  try {
    const { rows } = await pool.query(
      `UPDATE photos
          SET title = $2, alt = $3, category = $4, shape = $5,
              unsplash_id = $6, credit = $7, link = $8
        WHERE id = $1
        RETURNING ${columns}`,
      [id, photo.title, photo.alt, photo.category, photo.shape, photo.unsplashId, photo.credit, photo.link]
    );
    if (!rows.length) return res.status(404).json({ error: "No photo with that id" });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/photos/:id/move { direction: "up" | "down" }
// Swaps the photo's place with its neighbour in the gallery order.
// Runs in a transaction so the two updates happen together or not at all.
router.post("/:id/move", async (req, res, next) => {
  const id = parseId(req, res);
  if (id === null) return;
  const direction = req.body?.direction;
  if (!["up", "down"].includes(direction)) {
    return res.status(400).json({ error: 'direction must be "up" or "down"' });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Renumber 0, 1, 2… first, so every photo has its own position to swap.
    await client.query(
      `UPDATE photos p SET sort_order = o.position
         FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, id) - 1 AS position FROM photos) o
        WHERE p.id = o.id`
    );
    const { rows: current } = await client.query("SELECT sort_order FROM photos WHERE id = $1", [id]);
    if (!current.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "No photo with that id" });
    }
    const position = current[0].sort_order;
    const target = direction === "up" ? position - 1 : position + 1;
    const { rowCount } = await client.query("UPDATE photos SET sort_order = $1 WHERE sort_order = $2", [
      position,
      target,
    ]);
    if (rowCount) await client.query("UPDATE photos SET sort_order = $1 WHERE id = $2", [target, id]);
    await client.query("COMMIT");

    res.json(await listPhotos());
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally {
    client.release();
  }
});

// DELETE /api/admin/photos/:id -> remove a photo. Its shortlist rows go too
// (ON DELETE CASCADE); bookings keep the title in shortlist_titles.
router.delete("/:id", async (req, res, next) => {
  const id = parseId(req, res);
  if (id === null) return;
  try {
    const { rowCount } = await pool.query("DELETE FROM photos WHERE id = $1", [id]);
    if (!rowCount) return res.status(404).json({ error: "No photo with that id" });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
