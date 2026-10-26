import { Router } from "express";
import pool from "../db/pool.js";
import { currency } from "../lib/stripe.js";

const router = Router();

// GET /api/slots -> { currency, slots: [...] } for the booking form's price list.
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, label, hours, price_cents AS "priceCents", premium
         FROM shoot_slots ORDER BY sort_order`
    );
    res.json({ currency, slots: rows });
  } catch (error) {
    next(error);
  }
});

export default router;
