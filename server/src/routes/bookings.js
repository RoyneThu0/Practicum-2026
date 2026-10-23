import { Router } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";
import pool from "../db/pool.js";
import { today } from "../lib/dates.js";
import validateBooking from "../lib/validateBooking.js";

const router = Router();

// POST /api/bookings -> save a booking request from the "Book a shoot" form.
// Open to everyone; if the visitor is signed in, the booking is linked to them.
router.post("/", async (req, res, next) => {
  // Honeypot: a hidden "website" field real people never see or fill in.
  // Bots that fill every field get a normal-looking reply and nothing is saved.
  if (req.body?.website) return res.status(201).json({ ok: true });

  const { booking, errors } = validateBooking(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ error: "Check the highlighted fields", errors });
  }

  try {
    // The preferred date can't be in the past or on a day marked unavailable.
    if (booking.preferredDate) {
      const { rows: check } = await pool.query(
        `SELECT $1::date < ${today} AS past,
                EXISTS (SELECT 1 FROM blocked_dates WHERE day = $1::date) AS blocked`,
        [booking.preferredDate]
      );
      if (check[0].past || check[0].blocked) {
        const preferredDate = check[0].past
          ? "That date has already passed"
          : "I'm not available that day. Please choose another date";
        return res.status(400).json({ error: "Check the highlighted fields", errors: { preferredDate } });
      }
    }

    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

    // Look the titles up here rather than trusting what the browser sends.
    // Ids that don't match a photo are simply dropped.
    const { rows: photos } = await pool.query(
      "SELECT id, title FROM photos WHERE id = ANY($1::int[]) ORDER BY sort_order, id",
      [booking.photoIds]
    );

    const { rows } = await pool.query(
      `INSERT INTO bookings (name, email, shoot_type, preferred_date, message,
                             photo_ids, shortlist_titles, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        booking.name,
        booking.email,
        booking.shootType,
        booking.preferredDate,
        booking.message,
        photos.map((photo) => photo.id),
        photos.map((photo) => photo.title),
        session?.user.id ?? null,
      ]
    );
    res.status(201).json({ ok: true, id: rows[0].id });
  } catch (error) {
    next(error);
  }
});

export default router;
