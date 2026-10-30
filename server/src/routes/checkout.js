import { Router } from "express";
import pool from "../db/pool.js";
import { checkPreferredDate, findSlot, insertBooking } from "../lib/bookingRecords.js";
import { currency, stripe, stripeProblem } from "../lib/stripe.js";
import { formatDay } from "../lib/dates.js";
import validateBooking from "../lib/validateBooking.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

// The address Stripe sends people back to: the public site (the Vercel URL in
// production, the Vite dev server locally), which is also BETTER_AUTH_URL.
const siteUrl = (process.env.BETTER_AUTH_URL || "http://localhost:5173").replace(/\/+$/, "");

// POST /api/checkout -> book a shoot and pay for it.
// Body: the booking form's fields plus { slotId }. Answers { orderId, clientSecret }:
// the browser opens Stripe's embedded checkout in a popup with that secret.
//
// requireAuth runs first: every order belongs to a real, signed-in user.
// The price comes from the shoot_slots table, never from the browser.
router.post("/", requireAuth, async (req, res, next) => {
  if (stripeProblem) return res.status(503).json({ error: stripeProblem });

  const { booking, errors } = validateBooking(req.body);
  if (!booking.slotId) errors.slotId = "Choose a time of day";
  if (!booking.preferredDate) errors.preferredDate = "Choose a date for the shoot";
  if (Object.keys(errors).length) {
    return res.status(400).json({ error: "Check the highlighted fields", errors });
  }

  const client = await pool.connect();
  let order;
  let description;
  try {
    const slot = await findSlot(client, booking.slotId);
    if (!slot) {
      return res.status(400).json({ error: "Check the highlighted fields", errors: { slotId: "Choose a time of day" } });
    }
    const dateError = await checkPreferredDate(client, booking.preferredDate);
    if (dateError) {
      return res.status(400).json({ error: "Check the highlighted fields", errors: { preferredDate: dateError } });
    }

    description = `${slot.label} shoot, ${formatDay(booking.preferredDate)}`;

    // Booking, order and its item are saved together or not at all.
    await client.query("BEGIN");
    const bookingId = await insertBooking(client, booking, req.user.id);
    const { rows } = await client.query(
      `INSERT INTO orders (user_id, booking_id, currency, total_cents)
       VALUES ($1, $2, $3, $4) RETURNING id, total_cents AS "totalCents"`,
      [req.user.id, bookingId, currency, slot.priceCents]
    );
    order = rows[0];
    await client.query(
      `INSERT INTO order_items (order_id, slot_id, description, unit_price_cents, quantity)
       VALUES ($1, $2, $3, $4, 1)`,
      [order.id, slot.id, description, slot.priceCents]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    client.release();
    return next(error);
  }
  client.release();

  // Now ask Stripe for an embedded checkout for exactly that amount. It shows in
  // a popup on our page; after paying, Stripe sends the page to return_url.
  // The order id travels in metadata so the webhook knows which order was paid.
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: order.totalCents,
            product_data: { name: description },
          },
        },
      ],
      customer_email: req.user.email,
      client_reference_id: String(order.id),
      metadata: { orderId: String(order.id) },
      return_url: `${siteUrl}/checkout/success?order=${order.id}`,
    });

    await pool.query("UPDATE orders SET stripe_session_id = $2, updated_at = now() WHERE id = $1", [
      order.id,
      session.id,
    ]);
    res.status(201).json({ orderId: order.id, clientSecret: session.client_secret });
  } catch (error) {
    // Stripe refused (bad key, network…): the order can never be paid, so close it.
    await pool.query("UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = $1", [order.id]);
    console.error("Stripe checkout session failed:", error.message);
    res.status(502).json({ error: "Couldn't reach the payment provider. Please try again in a moment." });
  }
});

// POST /api/checkout/:orderId/cancel -> the payment popup was closed without paying.
// Expires the Stripe session so it can't be paid later, then marks the order
// cancelled. If Stripe says the session is already complete (paid just before
// closing), the order is left alone and the webhook marks it paid.
router.post("/:orderId/cancel", requireAuth, async (req, res, next) => {
  const id = Number(req.params.orderId);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "id must be a number" });
  try {
    const { rows } = await pool.query(
      `SELECT status, stripe_session_id AS "sessionId" FROM orders WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    const order = rows[0];
    if (!order) return res.status(404).json({ error: "No order with that id" });
    if (order.status !== "pending") return res.json({ status: order.status });

    if (order.sessionId && stripe) {
      try {
        await stripe.checkout.sessions.expire(order.sessionId);
      } catch (error) {
        // Already complete or expired: leave the status to the webhook.
        console.warn(`Couldn't expire checkout session for order ${id}:`, error.message);
        return res.json({ status: order.status });
      }
    }
    const updated = await pool.query(
      `UPDATE orders SET status = 'cancelled', updated_at = now()
        WHERE id = $1 AND status = 'pending' RETURNING status`,
      [id]
    );
    res.json({ status: updated.rows[0]?.status ?? order.status });
  } catch (error) {
    next(error);
  }
});

export default router;
