// Loads the gallery photos into the photos table.
// Upserts on slug, so running it twice updates rows instead of duplicating them.
import "dotenv/config";
import pool from "./pool.js";
import photos from "./seed-data.js";

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
