-- Booking requests sent from the "Book a shoot" form (replaces Formspree).
-- Anyone can send one; signed-in visitors are linked through user_id.
-- The shortlist is kept twice: photo_ids for the link to the photos table,
-- and shortlist_titles as a snapshot, so a booking still says which photos
-- were liked even if a photo is later renamed or deleted.
CREATE TABLE IF NOT EXISTS bookings (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  shoot_type       TEXT NOT NULL,
  preferred_date   DATE,                          -- optional
  message          TEXT NOT NULL,
  photo_ids        INTEGER[] NOT NULL DEFAULT '{}',
  shortlist_titles TEXT[]    NOT NULL DEFAULT '{}',
  user_id          TEXT REFERENCES "user" ("id") ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new', 'contacted', 'booked', 'declined')),
  admin_notes      TEXT NOT NULL DEFAULT '',      -- private notes, only seen in the admin panel
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_status_created_idx ON bookings (status, created_at DESC);
