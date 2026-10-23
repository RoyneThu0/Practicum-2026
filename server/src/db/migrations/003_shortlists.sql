-- Which photos each signed-in user has shortlisted.
-- One row = "this user starred this photo". The pair is the primary key, so
-- the same photo can't be shortlisted twice by the same person. Deleting a
-- user or a photo removes their shortlist rows too.
CREATE TABLE IF NOT EXISTS shortlists (
  user_id    TEXT    NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  photo_id   INTEGER NOT NULL REFERENCES photos (id)   ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, photo_id)
);
