import { useState } from "react";
import { sessions } from "../data/bookingOptions.js";
import { api } from "../lib/api.js";
import { formatDay, todayInNairobi } from "../lib/dates.js";
import { shareLinkFor } from "../lib/shareLink.js";
import Container from "./Container.jsx";
import Eyebrow from "./Eyebrow.jsx";
import FormField, { inputClass } from "./FormField.jsx";

// Booking requests are saved in the bookings table (POST /api/bookings) and
// show up in the admin panel's Bookings tab.
//
// Props:
//   user               the signed-in user or null; prefills name and email
//   shortlist          shortlisted photo ids, sent with the request
//   shortlistedTitles  their titles, shown above the submit button
//   onClearShortlist() empties the shortlist
//   blockedDates       upcoming days that can't be booked, e.g. ["2026-12-12"]
function BookingForm({ user, shortlist = [], shortlistedTitles = [], onClearShortlist, blockedDates = [] }) {
  // idle | sending | sent | error. status says what to show under the button.
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

    const day = form.get("date");
    if (blockedDates.includes(day)) {
      setErrors({ preferredDate: blockedMessage(day) });
      setState("error");
      setStatus("Please check the highlighted fields.");
      return;
    }

    setState("sending");
    setStatus("");
    setErrors({});

    try {
      await api("/api/bookings", {
        method: "POST",
        body: {
          name: form.get("name"),
          email: form.get("email"),
          shootType: form.get("shoot_type"),
          preferredDate: form.get("date"),
          message: form.get("message"),
          photoIds: shortlist,
          website: form.get("website"), // the hidden honeypot field; people leave it empty
        },
      });
      formElement.reset();
      setState("sent");
      setStatus("Thanks, your request is in. I'll reply within two working days.");
    } catch (err) {
      setState("error");
      setErrors(err.fields ?? {});
      setStatus(
        err.fields
          ? "Please check the highlighted fields."
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
              <input id="name" name="name" type="text" autoComplete="name" required defaultValue={user?.name ?? ""} key={`name-${user?.id ?? "guest"}`} className={inputClass} />
              {fieldError("name")}
            </FormField>
            <FormField id="email" label="Email">
              <input id="email" name="email" type="email" autoComplete="email" required defaultValue={user?.email ?? ""} key={`email-${user?.id ?? "guest"}`} className={inputClass} />
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

          <button
            type="submit"
            disabled={state === "sending"}
            className="self-start rounded-full bg-accent px-6 py-3 font-bold text-accent-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-60"
          >
            {state === "sending" ? "Sending…" : "Request a date"}
          </button>

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
