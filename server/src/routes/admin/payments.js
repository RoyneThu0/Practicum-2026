import { Router } from "express";
import pool from "../../db/pool.js";

const router = Router();

// GET /api/admin/payments/orders -> every order, newest first, with who placed it.
router.get("/orders", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.status, o.currency, o.total_cents AS "totalCents",
              o.created_at AS "createdAt", o.paid_at AS "paidAt",
              o.booking_id AS "bookingId",
              u.name AS "customerName", u.email AS "customerEmail",
              (SELECT string_agg(description, ', ') FROM order_items WHERE order_id = o.id) AS description
         FROM orders o JOIN "user" u ON u.id = o.user_id
        ORDER BY o.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/payments/slots/:id { priceCents } -> change a slot's price.
// Existing orders keep the price they were bought at (order_items.unit_price_cents).
router.patch("/slots/:id", async (req, res, next) => {
  const priceCents = Number(req.body?.priceCents);
  if (!Number.isInteger(priceCents) || priceCents < 100 || priceCents > 10_000_000) {
    return res.status(400).json({ error: "Check the highlighted fields", errors: { priceCents: "Enter a price between 1 and 100,000" } });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE shoot_slots SET price_cents = $2 WHERE id = $1
       RETURNING id, label, hours, price_cents AS "priceCents", premium`,
      [req.params.id, priceCents]
    );
    if (!rows.length) return res.status(404).json({ error: "No slot with that id" });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
