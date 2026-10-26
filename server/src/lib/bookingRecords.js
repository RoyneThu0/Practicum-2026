// Database steps shared by the two ways of booking a shoot:
// POST /api/bookings (a free enquiry) and POST /api/checkout (book and pay).
// `db` is either the pool or a client inside a transaction.
import { today } from "./dates.js";

// The preferred date can't be in the past or on a blocked day.
// Returns an error message for the date field, or null if it's fine.
export async function checkPreferredDate(db, preferredDate) {
  if (!preferredDate) return null;
  const { rows } = await db.query(
    `SELECT $1::date < ${today} AS past,
            EXISTS (SELECT 1 FROM blocked_dates WHERE day = $1::date) AS blocked`,
    [preferredDate]
  );
  if (rows[0].past) return "That date has already passed";
  if (rows[0].blocked) return "I'm not available that day. Please choose another date";
  return null;
}

// The slot row with its real price, or null if there's no such slot.
export async function findSlot(db, slotId) {
  if (!slotId) return null;
  const { rows } = await db.query(
    `SELECT id, label, hours, price_cents AS "priceCents", premium FROM shoot_slots WHERE id = $1`,
    [slotId]
  );
  return rows[0] ?? null;
}

// Saves a booking and returns its id. Shortlisted photo titles are looked up
// here rather than trusted from the browser; unknown ids are dropped.
export async function insertBooking(db, booking, userId) {
  const { rows: photos } = await db.query(
    "SELECT id, title FROM photos WHERE id = ANY($1::int[]) ORDER BY sort_order, id",
    [booking.photoIds]
  );
  const { rows } = await db.query(
    `INSERT INTO bookings (name, email, shoot_type, preferred_date, message,
                           photo_ids, shortlist_titles, user_id, slot_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      booking.name,
      booking.email,
      booking.shootType,
      booking.preferredDate,
      booking.message,
      photos.map((photo) => photo.id),
      photos.map((photo) => photo.title),
      userId,
      booking.slotId,
    ]
  );
  return rows[0].id;
}
