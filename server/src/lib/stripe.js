// The Stripe client, set up from environment variables.
//   STRIPE_SECRET_KEY      sk_test_… from the Stripe dashboard (Developers → API keys)
//   STRIPE_PUBLISHABLE_KEY pk_test_… from the same page; the browser uses it to
//                          show the payment popup (it's public, not a secret)
//   STRIPE_WEBHOOK_SECRET  whsec_… from the webhook endpoint (or `stripe listen`)
//   STRIPE_CURRENCY        three-letter currency for prices, default "usd"
// Payments are test mode only: a live key (sk_live_…) is refused, so a
// misconfigured deploy can never charge a real card.
import Stripe from "stripe";

export const currency = (process.env.STRIPE_CURRENCY || "usd").toLowerCase();

const key = process.env.STRIPE_SECRET_KEY || "";
export const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || "";

export const stripeProblem = !key
  ? "Payments aren't set up yet (STRIPE_SECRET_KEY is missing)."
  : !publishableKey
    ? "Payments aren't set up yet (STRIPE_PUBLISHABLE_KEY is missing)."
    : key.startsWith("sk_live_") || publishableKey.startsWith("pk_live_")
      ? "Live Stripe keys are turned off. Use test keys (sk_test_… and pk_test_…)."
      : null;

// True when payments work and are in test mode, so the payment popup can
// show the test card to use.
export const testMode = !stripeProblem && key.startsWith("sk_test_");

// Optional: point the SDK at a local stripe-mock server for offline testing,
// e.g. STRIPE_API_HOST=localhost STRIPE_API_PORT=12111 STRIPE_API_PROTOCOL=http.
const mock = process.env.STRIPE_API_HOST
  ? {
      host: process.env.STRIPE_API_HOST,
      port: Number(process.env.STRIPE_API_PORT) || 443,
      protocol: process.env.STRIPE_API_PROTOCOL || "https",
    }
  : {};

// null when payments aren't configured; routes check stripeProblem first.
export const stripe = stripeProblem ? null : new Stripe(key, mock);
