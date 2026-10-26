import { Router } from "express";
import pool from "../db/pool.js";
import { isAdmin } from "../lib/admins.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

// One order with its items and booking, in the shape the client uses.
export async function loadOrder(id) {
  const { rows } = await pool.query(
    `SELECT o.id, o.user_id AS "userId", o.status, o.currency,
            o.total_cents AS "totalCents", o.created_at AS "createdAt", o.paid_at AS "paidAt",
            b.id AS "bookingId", to_char(b.preferred_date, 'YYYY-MM-DD') AS "preferredDate",
            b.shoot_type AS "shootType",
            COALESCE(json_agg(json_build_object(
              'description', i.description,
              'unitPriceCents', i.unit_price_cents,
              'quantity', i.quantity
            ) ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL), '[]') AS items
       FROM orders o
       LEFT JOIN bookings b ON b.id = o.booking_id
       LEFT JOIN order_items i ON i.order_id = o.id
      WHERE o.id = $1
      GROUP BY o.id, b.id`,
    [id]
  );
  return rows[0] ?? null;
}

// GET /api/orders/:id -> one of your orders. The success page asks for this
// a few times after Stripe sends the customer back, until the webhook has
// marked it paid. You can only see your own orders (admins can see any).
router.get("/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "id must be a number" });
  try {
    const order = await loadOrder(id);
    // 404 rather than 403 for someone else's order, so ids can't be probed.
    if (!order || (order.userId !== req.user.id && !isAdmin(req.user))) {
      return res.status(404).json({ error: "No order with that id" });
    }
    delete order.userId;
    res.json(order);
  } catch (error) {
    next(error);
  }
});

// GET /api/orders -> your orders, newest first.
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.status, o.currency, o.total_cents AS "totalCents",
              o.created_at AS "createdAt", o.paid_at AS "paidAt",
              (SELECT string_agg(description, ', ') FROM order_items WHERE order_id = o.id) AS description
         FROM orders o WHERE o.user_id = $1 ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

export default router;
