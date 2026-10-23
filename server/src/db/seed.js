// Loads the starting gallery photos into the photos table, but only when the
// table is empty (a brand-new database). Once photos exist they are managed
// from the admin panel, and the deploy's db:setup must not overwrite those
// edits or bring back photos that were deleted on purpose.
import "dotenv/config";
import pool from "./pool.js";
import photos from "./seed-data.js";

const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM photos");
if (rows[0].count > 0) {
  console.log(`photos table already has ${rows[0].count} rows; skipping the seed`);
  await pool.end();
  process.exit(0);
}

for (const [index, photo] of photos.entries()) {
  await pool.query(
    `INSERT INTO photos (slug, title, alt, category, shape, unsplash_id, credit, link, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (slug) DO UPDATE SET
       title = EXCLUDED.title,
       alt = EXCLUDED.alt,
       category = EXCLUDED.category,
       shape = EXCLUDED.shape,
       unsplash_id = EXCLUDED.unsplash_id,
       credit = EXCLUDED.credit,
       link = EXCLUDED.link,
       sort_order = EXCLUDED.sort_order`,
    [
      photo.slug,
      photo.title,
      photo.alt,
      photo.category,
      photo.shape,
      photo.unsplashId,
      photo.credit,
      photo.link,
      index,
    ]
  );
}

console.log(`seeded ${photos.length} photos`);
await pool.end();
