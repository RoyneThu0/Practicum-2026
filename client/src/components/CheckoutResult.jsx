import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { formatDay } from "../lib/dates.js";
import { formatMoney } from "../lib/money.js";
import Container from "./Container.jsx";
import Eyebrow from "./Eyebrow.jsx";

// How many times to ask, and how long to wait between asks, while the order is
// still pending. Stripe redirects here straight after payment, and its webhook
// (the only thing allowed to mark the order paid) can arrive a moment later.
const maxChecks = 10;
const checkEveryMs = 1500;

const paidTime = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

// The pages Stripe sends people back to:
//   /checkout/success?order=12    after paying
//   /checkout/cancelled?order=12  after pressing back on Stripe's page
// Both just READ the order (GET /api/orders/:id). Opening the success address
// doesn't mark anything paid; only the webhook does.
//
// Props: outcome ("success" | "cancelled"), me ({ user } or null while loading), onSignInClick().
function CheckoutResult({ outcome, me, onSignInClick }) {
  const orderId = new URLSearchParams(window.location.search).get("order");
  const [order, setOrder] = useState(null);
  const [problem, setProblem] = useState("");
  const [checks, setChecks] = useState(0);
  const [checkRound, setCheckRound] = useState(0); // bump to start checking again
  const signedIn = Boolean(me?.user);

  useEffect(() => {
    if (!orderId || !signedIn) return;
    let cancelled = false;
    let timer;

    async function check(attempt) {
      try {
        const latest = await api(`/api/orders/${orderId}`);
        if (cancelled) return;
        setOrder(latest);
        setChecks(attempt);
        // Keep asking while a just-paid order is still pending.
        if (outcome === "success" && latest.status === "pending" && attempt < maxChecks) {
          timer = setTimeout(() => check(attempt + 1), checkEveryMs);
        }
      } catch (err) {
        if (!cancelled) setProblem(err.status === 404 ? "There's no order with that number on your account." : err.message);
      }
    }

    check(1);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId, signedIn, outcome, checkRound]);

  const stillChecking = outcome === "success" && order?.status === "pending" && checks < maxChecks;

  let heading = "Checking your order…";
  if (order?.status === "paid") heading = "Payment received, you're booked";
  else if (order?.status === "pending" && outcome === "cancelled") heading = "Payment cancelled";
  else if (order?.status === "pending" && !stillChecking) heading = "Waiting for the payment to be confirmed";
  else if (order?.status === "expired") heading = "This checkout expired";
  else if (order?.status === "cancelled") heading = "This order was cancelled";

  return (
    <>
      <header className="border-b border-line">
        <Container className="flex min-h-16 items-center justify-between gap-4 py-2.5">
          <a href="/" className="font-display text-[1.3rem] leading-none no-underline sm:text-2xl">
            Practicum Photography
          </a>
          <a href="/#book" className="text-sm font-semibold underline-offset-2 hover:underline">
            ← Back to the site
          </a>
        </Container>
      </header>

      <main id="main" className="py-12 sm:py-16">
        <Container className="max-w-2xl">
          <Eyebrow>Order {orderId ? `#${orderId}` : ""}</Eyebrow>
          <h1 className="font-display text-4xl leading-none tracking-tight text-balance sm:text-6xl">{heading}</h1>

          <div role="status" aria-live="polite" className="mt-6 flex flex-col gap-4">
            {!orderId && <p>This page needs an order number. Please use the link from your checkout.</p>}

            {orderId && me === null && <p className="text-ink-soft">Checking your account…</p>}

            {orderId && me && !signedIn && (
              <div className="flex flex-col items-start gap-3">
                <p>Sign in with the account you paid with to see this order.</p>
                <button
                  type="button"
                  onClick={onSignInClick}
                  className="rounded-full bg-accent px-5 py-2.5 font-bold text-accent-ink hover:bg-ink hover:text-paper"
                >
                  Sign in
                </button>
              </div>
            )}

            {problem && <p className="font-semibold text-red-700 dark:text-red-300">{problem}</p>}

            {stillChecking && (
              <p className="text-ink-soft">
                Confirming with Stripe… (check {checks} of {maxChecks})
              </p>
            )}

            {order && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded border border-line bg-paper-raised p-5">
                <dt className="text-ink-soft">Status</dt>
                <dd>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${
                      order.status === "paid"
                        ? "bg-emerald-200 text-emerald-950 dark:bg-emerald-300/20 dark:text-emerald-200"
                        : order.status === "pending"
                          ? "bg-amber-200 text-amber-950 dark:bg-amber-300/20 dark:text-amber-200"
                          : "bg-line text-ink-soft"
                    }`}
                  >
                    {order.status === "paid" ? "Paid" : order.status[0].toUpperCase() + order.status.slice(1)}
                  </span>
                </dd>
                {order.items.map((item, index) => (
                  <div key={index} className="contents">
                    <dt className="text-ink-soft">{index === 0 ? "Shoot" : ""}</dt>
                    <dd>{item.description}</dd>
                  </div>
                ))}
                {order.shootType && (
                  <>
                    <dt className="text-ink-soft">Type</dt>
                    <dd>{order.shootType}</dd>
                  </>
                )}
                <dt className="text-ink-soft">Total</dt>
                <dd className="font-semibold tabular-nums">{formatMoney(order.totalCents, order.currency)}</dd>
                {order.paidAt && (
                  <>
                    <dt className="text-ink-soft">Paid</dt>
                    <dd>{paidTime.format(new Date(order.paidAt))}</dd>
                  </>
                )}
              </dl>
            )}

            {order?.status === "paid" && (
              <p>
                Thanks! Your {order.preferredDate ? formatDay(order.preferredDate) : ""} shoot is confirmed. I'll email
                you within two working days to plan the location and timing.
              </p>
            )}

            {order?.status === "pending" && outcome === "success" && !stillChecking && (
              <div className="flex flex-col items-start gap-3">
                <p>
                  Stripe hasn't confirmed the payment yet. That usually takes a few seconds, so check again shortly.
                  You won't be charged twice.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setChecks(0);
                    setCheckRound((n) => n + 1);
                  }}
                  className="rounded-full border border-line px-4 py-2 font-semibold hover:border-ink"
                >
                  Check again
                </button>
              </div>
            )}

            {order?.status === "pending" && outcome === "cancelled" && (
              <p>
                Nothing was charged. Your booking request is saved, so I'll still see it, but the date isn't held
                until it's paid. You can <a href="/#book" className="font-semibold text-accent underline">book and pay again</a>.
              </p>
            )}

            {(order?.status === "expired" || order?.status === "cancelled") && (
              <p>
                Nothing was charged. <a href="/#book" className="font-semibold text-accent underline">Start a new booking</a>.
              </p>
            )}
          </div>
        </Container>
      </main>
    </>
  );
}

export default CheckoutResult;
