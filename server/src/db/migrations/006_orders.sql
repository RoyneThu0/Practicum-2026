-- Payments (Stripe Checkout, test mode).
--
-- shoot_slots   what can be bought: one row per time of day, with its price.
--               Sunrise and sunset cost more (golden light). Prices live here,
--               and only here: the checkout route reads them, never the browser.
-- orders        one row per purchase, always tied to a signed-in user.
-- order_items   what each order bought, and the price at the moment of purchase
--               (so later price changes don't rewrite old orders).
--
-- Amounts are whole cents (integers), the way Stripe expects them, so there's
-- no floating-point rounding: $450.00 is stored as 45000.

CREATE TABLE IF NOT EXISTS shoot_slots (
  id          TEXT PRIMARY KEY,             -- 'sunrise', 'morning', ...
  label       TEXT NOT NULL,                -- 'Sunrise'
  hours       TEXT NOT NULL,                -- rough time window shown to visitors
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  premium     BOOLEAN NOT NULL DEFAULT false,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- Starting prices (placeholders; change them in the admin panel).
-- DO NOTHING keeps any price already edited when this runs again on deploy.
INSERT INTO shoot_slots (id, label, hours, price_cents, premium, sort_order) VALUES
  ('sunrise',   'Sunrise',   '5:45–8:00am',     45000, true,  0),
  ('morning',   'Morning',   '8:00–11:00am',    30000, false, 1),
  ('midday',    'Midday',    '11:00am–2:00pm',  25000, false, 2),
  ('afternoon', 'Afternoon', '2:00–5:00pm',     30000, false, 3),
  ('sunset',    'Sunset',    '5:00–7:15pm',     45000, true,  4)
ON CONFLICT (id) DO NOTHING;

-- Which slot a booking request is for (optional for a plain enquiry).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS slot_id TEXT REFERENCES shoot_slots (id);

CREATE TABLE IF NOT EXISTS orders (
  id                       SERIAL PRIMARY KEY,
  user_id                  TEXT NOT NULL REFERENCES "user" ("id"),   -- who is paying
  booking_id               INTEGER REFERENCES bookings (id) ON DELETE SET NULL,
  status                   TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'paid', 'cancelled', 'expired')),
  currency                 TEXT NOT NULL,                             -- e.g. 'usd'
  total_cents              INTEGER NOT NULL CHECK (total_cents > 0),
  stripe_session_id        TEXT UNIQUE,                               -- the Checkout Session
  stripe_payment_intent_id TEXT,                                      -- set by the webhook
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at                  TIMESTAMPTZ,                               -- set by the webhook only
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id               SERIAL PRIMARY KEY,
  order_id         INTEGER NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  slot_id          TEXT REFERENCES shoot_slots (id),
  description      TEXT NOT NULL,                  -- e.g. 'Sunset shoot, Sat 12 Dec 2026'
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents > 0),
  quantity         INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS orders_user_idx ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);
