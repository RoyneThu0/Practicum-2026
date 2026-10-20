-- One row per photo in the gallery (the Week 2 photos.js array, now in Postgres).
CREATE TABLE IF NOT EXISTS photos (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,          -- stable name used by the seed script, e.g. 'savanna-at-sunset'
  title       TEXT NOT NULL,
  alt         TEXT NOT NULL,                 -- alt text for screen readers
  category    TEXT NOT NULL CHECK (category IN ('plains', 'mountains', 'water')),
  shape       TEXT NOT NULL CHECK (shape IN ('single', 'tall', 'wide', 'feature')),
  unsplash_id TEXT NOT NULL,                 -- the photo-… id used to build image URLs
  credit      TEXT NOT NULL,                 -- photographer's name
  link        TEXT NOT NULL,                 -- the photo's page on Unsplash
  sort_order  INTEGER NOT NULL DEFAULT 0,    -- gallery order (lower first)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
