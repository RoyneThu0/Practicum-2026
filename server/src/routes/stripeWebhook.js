import pool from "../db/pool.js";
import { stripe } from "../lib/stripe.js";

// POST /api/stripe/webhook -> Stripe calls this when something happens to a
// Checkout Session. It is the ONLY code that marks an order as paid: the
// success page the customer lands on just reads the order, because anyone
// could open that address without paying.
//
// Mounted in index.js with express.raw(), BEFORE express.json(): the signature
// check needs the exact bytes Stripe sent, not a re-parsed copy.
export default async function stripeWebhook(req, res) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return res.status(503).json({ error: "Webhook not configured" });

  // 1. Prove the request really came from Stripe. constructEvent recomputes
  //    the signature from the raw body and our secret, and throws on a mismatch
  //    or a stale timestamp (replay protection).
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], secret);
  } catch (error) {
    console.warn("Rejected a Stripe webhook:", error.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  // 2. Act on the events we care about. Stripe may send the same event more
  //    than once, so every update below is safe to repeat.
  try {
    const session = event.data.object;
    const orderId = Number(session.metadata?.orderId);

    if (
      (event.type === "checkout.session.completed" && session.payment_status === "paid") ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      // Only a pending order whose session and amount match what we created
      // can become paid. "status <> 'paid'" makes a repeat delivery a no-op.
      const { rows } = await pool.query(
        `UPDATE orders
            SET status = 'paid', paid_at = now(), updated_at = now(),
                stripe_payment_intent_id = $3
          WHERE id = $1 AND stripe_session_id = $2 AND total_cents = $4 AND status <> 'paid'
          RETURNING booking_id`,
        [orderId, session.id, session.payment_intent, session.amount_total]
      );
      // A paid shoot is a confirmed booking.
      if (rows[0]?.booking_id) {
        await pool.query(
          `UPDATE bookings SET status = 'booked', updated_at = now()
            WHERE id = $1 AND status IN ('new', 'contacted')`,
          [rows[0].booking_id]
        );
      }
    } else if (event.type === "checkout.session.expired") {
      // The customer never paid and the checkout page timed out (after 24 hours).
      await pool.query(
        `UPDATE orders SET status = 'expired', updated_at = now()
          WHERE id = $1 AND stripe_session_id = $2 AND status = 'pending'`,
        [orderId, session.id]
      );
    }

    // 3. Always answer 2xx quickly for events we accept, or Stripe retries.
    res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handling failed:", error);
    // 500 tells Stripe to try again later, which is what we want if the
    // database was briefly unreachable.
    res.status(500).json({ error: "Webhook handling failed" });
  }
}
