import { Router } from "express";
import pool from "../../db/pool.js";
import { bookingStatuses } from "../../lib/options.js";

const router = Router();

const columns = `id, name, email, shoot_type AS "shootType",
                 to_char(preferred_date, 'YYYY-MM-DD') AS "preferredDate",
                 message, shortlist_titles AS "shortlistTitles",
                 user_id IS NOT NULL AS "hasAccount",
                 status, admin_notes AS "adminNotes",
                 created_at AS "createdAt", updated_at AS "updatedAt"`;

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "id must be a number" });
    return null;
  }
  return id;
}

// GET /api/admin/bookings?status=new -> bookings, newest first.
// Without ?status every booking is returned.
router.get("/", async (req, res, next) => {
  const status = req.query.status;
  if (status && !bookingStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${bookingStatuses.join(", ")}` });
  }
  try {
    const { rows } = await pool.query(
      `SELECT ${columns} FROM bookings
        WHERE $1::text IS NULL OR status = $1
        ORDER BY created_at DESC`,
      [status ?? null]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/bookings/:id { status?, adminNotes? } -> update one booking.
router.patch("/:id", async (req, res, next) => {
  const id = parseId(req, res);
  if (id === null) return;
  const { status, adminNotes } = req.body ?? {};

  if (status !== undefined && !bookingStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${bookingStatuses.join(", ")}` });
  }
  if (adminNotes !== undefined && (typeof adminNotes !== "string" || adminNotes.length > 5000)) {
    return res.status(400).json({ error: "Notes must be text under 5,000 characters" });
  }

  try {
    // COALESCE keeps the old value for anything that wasn't sent.
    const { rows } = await pool.query(
      `UPDATE bookings
          SET status = COALESCE($2, status),
              admin_notes = COALESCE($3, admin_notes),
              updated_at = now()
        WHERE id = $1
        RETURNING ${columns}`,
      [id, status ?? null, adminNotes ?? null]
    );
    if (!rows.length) return res.status(404).json({ error: "No booking with that id" });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/bookings/:id -> remove a booking for good.
router.delete("/:id", async (req, res, next) => {
  const id = parseId(req, res);
  if (id === null) return;
  try {
    const { rowCount } = await pool.query("DELETE FROM bookings WHERE id = $1", [id]);
    if (!rowCount) return res.status(404).json({ error: "No booking with that id" });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
