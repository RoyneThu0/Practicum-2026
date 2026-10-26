import { Router } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";
import pool from "../db/pool.js";
import { checkPreferredDate, findSlot, insertBooking } from "../lib/bookingRecords.js";
import validateBooking from "../lib/validateBooking.js";

const router = Router();

// POST /api/bookings -> save a booking request from the "Book a shoot" form.
// This is the free "Request a date" path; paying goes through POST /api/checkout.
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
    const dateError = await checkPreferredDate(pool, booking.preferredDate);
    if (dateError) {
      return res.status(400).json({ error: "Check the highlighted fields", errors: { preferredDate: dateError } });
    }
    if (booking.slotId && !(await findSlot(pool, booking.slotId))) {
      return res.status(400).json({ error: "Check the highlighted fields", errors: { slotId: "Choose a time of day" } });
    }

    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const id = await insertBooking(pool, booking, session?.user.id ?? null);
    res.status(201).json({ ok: true, id });
  } catch (error) {
    next(error);
  }
});

export default router;
