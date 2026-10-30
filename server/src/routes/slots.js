import { Router } from "express";
import pool from "../db/pool.js";
import { currency, publishableKey, stripeProblem, testMode } from "../lib/stripe.js";

const router = Router();

// GET /api/slots -> the booking form's price list and payment settings:
//   { currency, slots: [...], payments: { enabled, testMode, publishableKey } }
// The publishable key is public by design: it can only show Stripe's payment
// form, never charge or read anything.
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, label, hours, price_cents AS "priceCents", premium
         FROM shoot_slots ORDER BY sort_order`
    );
    res.json({
      currency,
      slots: rows,
      payments: { enabled: !stripeProblem, testMode, publishableKey: stripeProblem ? null : publishableKey },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
