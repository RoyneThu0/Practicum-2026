-- Days the photographer isn't available. One row per day; the booking form
-- refuses these dates, and the admin panel's Availability tab manages them.
-- The note is private (e.g. "Booked: Laikipia lodge") and is never sent to
-- the public site.
CREATE TABLE IF NOT EXISTS blocked_dates (
  day        DATE PRIMARY KEY,
  note       TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
