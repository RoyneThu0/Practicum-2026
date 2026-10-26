import { useEffect, useRef, useState } from "react";
import { sessions } from "../data/bookingOptions.js";
import { api } from "../lib/api.js";
import { formatDay, todayInNairobi } from "../lib/dates.js";
import { formatMoney } from "../lib/money.js";
import { shareLinkFor } from "../lib/shareLink.js";
import Container from "./Container.jsx";
import Eyebrow from "./Eyebrow.jsx";
import FormField, { inputClass } from "./FormField.jsx";
import SlotPicker from "./SlotPicker.jsx";

// Two ways to send the form:
//   "Book & pay"            POST /api/checkout (signed in only): saves the booking and
//                           an order, then sends the browser to Stripe's checkout page.
//   "Request a date"        POST /api/bookings: a free enquiry, no payment.
// Either way the booking shows up in the admin panel.
//
// Props:
//   user               the signed-in user or null; prefills name and email
//   shortlist          shortlisted photo ids, sent with the request
//   shortlistedTitles  their titles, shown above the submit button
//   onClearShortlist() empties the shortlist
//   blockedDates       upcoming days that can't be booked, e.g. ["2026-12-12"]
//   slots, currency    the time slots and their prices (GET /api/slots)
//   onSignInClick()    opens the sign-in dialog (paying needs an account)
function BookingForm({
  user,
  shortlist = [],
  shortlistedTitles = [],
  onClearShortlist,
  blockedDates = [],
  slots = [],
  currency = "usd",
  onSignInClick,
}) {
  const [slotId, setSlotId] = useState("");
  const nameRef = useRef(null);
  const emailRef = useRef(null);

  // When someone signs in (often halfway through, to pay), fill in their name
  // and email, but only into empty fields, so nothing they typed is replaced.
  useEffect(() => {
    if (!user) return;
    if (nameRef.current && !nameRef.current.value) nameRef.current.value = user.name ?? "";
    if (emailRef.current && !emailRef.current.value) emailRef.current.value = user.email ?? "";
  }, [user]);
  const chosenSlot = slots.find((slot) => slot.id === slotId);
  // idle | sending | redirecting | sent | error. status says what to show under the buttons.
  const [state, setState] = useState("idle");
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState({});
  // After "Copy share link": "copied", or the link itself if copying wasn't allowed.
  const [shared, setShared] = useState("");

  const blockedMessage = (day) => `I'm not available on ${formatDay(day)}. Please choose another date.`;

  // Warn as soon as a blocked day is picked, rather than after sending.
  function handleDateChange(event) {
    const day = event.target.value;
    setErrors((prev) => ({ ...prev, preferredDate: blockedDates.includes(day) ? blockedMessage(day) : undefined }));
  }

  async function copyShareLink() {
    const link = shareLinkFor(shortlist);
    try {
      await navigator.clipboard.writeText(link);
      setShared("copied");
    } catch {
      setShared(link); // show it so it can be copied by hand
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    // Which button sent the form: "pay" or "enquire".
    const intent = event.nativeEvent.submitter?.value ?? "enquire";

    const day = form.get("date");
    const problems = {};
    if (blockedDates.includes(day)) problems.preferredDate = blockedMessage(day);
    if (intent === "pay" && !day) problems.preferredDate = "Choose a date for the shoot";
    if (intent === "pay" && !slotId) problems.slotId = "Choose a time of day";
    if (Object.keys(problems).length) {
      setErrors(problems);
      setState("error");
      setStatus("Please check the highlighted fields.");
      return;
    }

    // Paying needs an account, so every order belongs to a real user.
    // Signing in keeps everything typed into the form.
    if (intent === "pay" && !user) {
      setState("error");
      setStatus("Sign in or create an account to pay. Everything you've typed stays in the form.");
      onSignInClick();
      return;
    }

    setState("sending");
    setStatus("");
    setErrors({});

    const details = {
      name: form.get("name"),
      email: form.get("email"),
      shootType: form.get("shoot_type"),
      preferredDate: form.get("date"),
      message: form.get("message"),
      slotId: slotId || undefined,
      photoIds: shortlist,
      website: form.get("website"), // the hidden honeypot field; people leave it empty
    };

    try {
      if (intent === "pay") {
        // The server works out the price itself and answers with Stripe's page.
        const { url } = await api("/api/checkout", { method: "POST", body: details });
        setState("redirecting");
        setStatus("Taking you to the secure payment page…");
        window.location.assign(url);
        return;
      }

      await api("/api/bookings", { method: "POST", body: details });
      formElement.reset();
      setSlotId("");
      setState("sent");
      setStatus("Thanks, your request is in. I'll reply within two working days.");
    } catch (err) {
      setState("error");
      setErrors(err.fields ?? {});
      setStatus(
        err.fields
          ? "Please check the highlighted fields."
          : err.status === 503
            ? "Online payment isn't available right now. Please use Request a date instead."
            : "Your request couldn't be sent just now. Please try again, or email hello@example.com."
      );
    }
  }

  const fieldError = (name) =>
    errors[name] && <p className="text-sm font-semibold text-red-700 dark:text-red-300">{errors[name]}</p>;

  return (
    <section id="book" aria-labelledby="book-title" className="scroll-mt-16 py-12 sm:py-16 lg:py-24">
      <Container className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-16">
        <div className="min-w-0">
          <Eyebrow>Book a shoot</Eyebrow>
          <h2 id="book-title" className="font-display text-[2rem] leading-none tracking-tight text-balance sm:text-5xl lg:text-[3.25rem]">
            Tell me where and when
          </h2>
          <p className="mt-4 max-w-lg text-ink-soft">
            Send a few details and I'll reply within two working days with
            availability and a quote. Dawn and dusk dates book up first, so give
            me a couple of options if you can.
          </p>

          <ul className="mt-7 border-t border-line">
            {sessions.map((session) => (
              <li
                key={session.name}
                className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-line py-3"
              >
                <span>{session.name}</span>
                <span className="font-mono text-sm text-ink-soft">{session.length}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-[0.95rem]">
            Prefer email? Write to{" "}
            <a href="mailto:hello@example.com" className="font-semibold text-accent">
              hello@example.com
            </a>
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative flex min-w-0 flex-col gap-4 rounded border border-line bg-paper-raised p-5 sm:p-8"
        >
          {/* Honeypot: hidden from people and screen readers; bots tend to fill it in. */}
          <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
            <label htmlFor="website">Leave this empty</label>
            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <FormField id="name" label="Name">
              <input id="name" name="name" type="text" autoComplete="name" required ref={nameRef} className={inputClass} />
              {fieldError("name")}
            </FormField>
            <FormField id="email" label="Email">
              <input id="email" name="email" type="email" autoComplete="email" required ref={emailRef} className={inputClass} />
              {fieldError("email")}
            </FormField>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <FormField id="shoot-type" label="Type of shoot">
              <select id="shoot-type" name="shoot_type" required className={inputClass}>
                <option value="">Choose one</option>
                {sessions.map((session) => (
                  <option key={session.name}>{session.name}</option>
                ))}
                <option>Something else</option>
              </select>
              {fieldError("shootType")}
            </FormField>
            <FormField id="date" label="Preferred date">
              <input
                id="date"
                name="date"
                type="date"
                min={todayInNairobi()}
                onChange={handleDateChange}
                aria-describedby={blockedDates.length > 0 ? "date-unavailable" : undefined}
                className={inputClass}
              />
              {fieldError("preferredDate")}
              {blockedDates.length > 0 && (
                <p id="date-unavailable" className="text-xs text-ink-soft">
                  Unavailable: {blockedDates.slice(0, 6).map((d) => formatDay(d, "short")).join(", ")}
                  {blockedDates.length > 6 && ` and ${blockedDates.length - 6} more`}
                </p>
              )}
            </FormField>
          </div>

          {slots.length > 0 && (
            <SlotPicker
              slots={slots}
              currency={currency}
              value={slotId}
              onChange={(id) => {
                setSlotId(id);
                setErrors((prev) => ({ ...prev, slotId: undefined }));
              }}
              error={errors.slotId}
            />
          )}

          <FormField id="message" label="Location and details">
            <textarea
              id="message"
              name="message"
              required
              placeholder="Where is it, what do you need the photos for, and any dates that won't work?"
              className={`${inputClass} min-h-32 resize-y`}
            />
            {fieldError("message")}
          </FormField>

          {shortlistedTitles.length > 0 && (
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded border border-line bg-paper px-3 py-2.5 text-sm">
              <p className="min-w-0">
                <span className="font-bold">Shortlisted:</span> {shortlistedTitles.join(", ")}
              </p>
              <span className="flex flex-wrap gap-x-4 gap-y-1">
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="font-semibold text-accent underline underline-offset-2 hover:text-ink"
                >
                  {shared === "copied" ? "Link copied" : "Copy share link"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShared("");
                    onClearShortlist();
                  }}
                  className="font-semibold text-accent underline underline-offset-2 hover:text-ink"
                >
                  Clear shortlist
                </button>
              </span>
              {shared && shared !== "copied" && (
                <label className="flex w-full flex-col gap-1 text-xs text-ink-soft">
                  Copy this link to share your shortlist:
                  <input
                    readOnly
                    value={shared}
                    onFocus={(event) => event.target.select()}
                    className={`${inputClass} font-mono text-xs`}
                  />
                </label>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              name="intent"
              value="pay"
              disabled={state === "sending" || state === "redirecting" || slots.length === 0}
              className="rounded-full bg-accent px-6 py-3 font-bold text-accent-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-60"
            >
              {state === "redirecting"
                ? "Opening checkout…"
                : chosenSlot
                  ? `Book & pay ${formatMoney(chosenSlot.priceCents, currency)}`
                  : "Book & pay"}
            </button>
            <button
              type="submit"
              name="intent"
              value="enquire"
              disabled={state === "sending" || state === "redirecting"}
              className="rounded-full border border-line px-5 py-2.5 font-semibold transition-colors hover:border-ink disabled:opacity-60"
            >
              {state === "sending" ? "Sending…" : "Request a date without paying"}
            </button>
          </div>
          <p className="text-xs text-ink-soft">
            {user ? "Paying takes you to Stripe's secure checkout." : "Paying needs an account; you'll be asked to sign in."}{" "}
            Payments are in <strong>test mode</strong>: use card 4242 4242 4242 4242, any future date and any CVC.
          </p>

          <p
            role="status"
            aria-live="polite"
            className={`text-sm empty:hidden ${state === "error" ? "font-semibold text-red-700 dark:text-red-300" : "text-ink-soft"}`}
          >
            {status}
          </p>
        </form>
      </Container>
    </section>
  );
}

export default BookingForm;
