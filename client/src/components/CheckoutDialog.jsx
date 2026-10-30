import { useEffect, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

// Stripe.js is loaded once (from js.stripe.com, as Stripe requires) and reused.
let stripePromise = null;
let stripeKey = "";
function getStripe(publishableKey) {
  if (!stripePromise || stripeKey !== publishableKey) {
    stripeKey = publishableKey;
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

const testCard = "4242 4242 4242 4242";

// The payment popup: Stripe's embedded checkout inside our own <dialog>.
// Card details are typed into Stripe's iframe and go straight to Stripe; this
// page never sees them. After paying, Stripe sends the whole page to
// /checkout/success?order=ID (the return_url), which shows the order status.
//
// Props:
//   checkout        { orderId, clientSecret, title } while open, null when closed
//   publishableKey  pk_test_… from GET /api/slots
//   testMode        show the test card to use
//   onClose()       the popup was closed without paying
function CheckoutDialog({ checkout, publishableKey, testMode, onClose }) {
  const dialogRef = useRef(null);
  const mountRef = useRef(null);
  // { clientSecret, message } when the form for that checkout couldn't load.
  const [failure, setFailure] = useState(null);
  const [copied, setCopied] = useState(false);
  const open = Boolean(checkout);
  const problem = failure && failure.clientSecret === checkout?.clientSecret ? failure.message : "";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Mount Stripe's form when the popup opens, and take it down when it closes.
  // Only one embedded checkout can exist at a time, so destroy() matters.
  useEffect(() => {
    if (!checkout) return;
    let embedded = null;
    let cancelled = false;

    getStripe(publishableKey)
      .then((stripe) => {
        if (cancelled) return null;
        return stripe.createEmbeddedCheckoutPage({ clientSecret: checkout.clientSecret });
      })
      .then((instance) => {
        if (!instance) return;
        if (cancelled) return instance.destroy();
        embedded = instance;
        embedded.mount(mountRef.current);
      })
      .catch(() => {
        if (!cancelled) {
          setFailure({
            clientSecret: checkout.clientSecret,
            message: "The payment form couldn't load. Check your connection and try again.",
          });
        }
      });

    return () => {
      cancelled = true;
      embedded?.destroy();
    };
  }, [checkout, publishableKey]);

  async function copyCard() {
    try {
      await navigator.clipboard.writeText(testCard.replaceAll(" ", ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copying isn't allowed here; the number is on screen to type.
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={() => open && onClose()}
      aria-labelledby="checkout-title"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded border border-line bg-paper-raised p-0 text-ink backdrop:bg-scrim"
    >
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="checkout-title" className="font-display text-3xl leading-none sm:text-4xl">
              Pay for your shoot
            </h2>
            {checkout?.title && <p className="mt-2 text-sm text-ink-soft">{checkout.title}</p>}
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current.close()}
            aria-label="Close without paying"
            className="-mr-2 -mt-1 rounded px-2 text-2xl leading-none text-ink-soft hover:text-ink"
          >
            ×
          </button>
        </div>

        {testMode && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded border border-line bg-paper px-3 py-2.5 text-sm">
            <p className="min-w-0">
              <span className="font-bold">Test mode.</span> Card{" "}
              <span className="font-mono whitespace-nowrap">{testCard}</span>, any future date, any CVC.
            </p>
            <button
              type="button"
              onClick={copyCard}
              className="font-semibold text-accent underline underline-offset-2 hover:text-ink"
            >
              {copied ? "Copied" : "Copy card number"}
            </button>
          </div>
        )}

        {problem ? (
          <p role="alert" className="text-sm font-semibold text-red-700 dark:text-red-300">
            {problem}
          </p>
        ) : (
          // Stripe draws its form (an iframe) in here. White behind it, as Stripe's form is light.
          <div ref={mountRef} className="min-h-96 overflow-hidden rounded bg-white" />
        )}
      </div>
    </dialog>
  );
}

export default CheckoutDialog;
