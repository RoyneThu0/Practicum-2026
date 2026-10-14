import { useState } from "react";
import Container from "./Container.jsx";
import Eyebrow from "./Eyebrow.jsx";

// Replace YOUR_FORM_ID with a real Formspree form id to start receiving bookings.
const FORM_ACTION = "https://formspree.io/f/YOUR_FORM_ID";

const sessions = [
  { name: "Lodge & property", length: "1–3 days" },
  { name: "Editorial assignment", length: "by brief" },
  { name: "Print commission", length: "2–6 weeks" },
];

const inputClass =
  "w-full rounded border border-line bg-paper px-3 py-2.5 text-base text-ink focus:border-accent focus:outline-2 focus:outline-accent";

function BookingForm() {
  const [status, setStatus] = useState("");

  function handleSubmit(event) {
    // Until a real endpoint is set, stop the submit and say so rather than pretending it was sent.
    if (FORM_ACTION.includes("YOUR_FORM_ID")) {
      event.preventDefault();
      setStatus(
        "This form isn't connected yet, so nothing was sent. Please email hello@example.com instead."
      );
    }
  }

  return (
    <section id="book" aria-labelledby="book-title" className="scroll-mt-16 py-12">
      <Container className="grid grid-cols-1 items-start gap-8">
        <div className="min-w-0">
          <Eyebrow>Book a shoot</Eyebrow>
          <h2 id="book-title" className="font-display text-[2rem] leading-none tracking-tight text-balance">
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
          action={FORM_ACTION}
          method="POST"
          onSubmit={handleSubmit}
          className="flex min-w-0 flex-col gap-4 rounded border border-line bg-paper-raised p-5"
        >
          <div className="flex flex-col gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-bold">Name</label>
              <input id="name" name="name" type="text" autoComplete="name" required className={inputClass} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-bold">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <label htmlFor="shoot-type" className="text-sm font-bold">Type of shoot</label>
              <select id="shoot-type" name="shoot_type" required className={inputClass}>
                <option value="">Choose one</option>
                {sessions.map((session) => (
                  <option key={session.name}>{session.name}</option>
                ))}
                <option>Something else</option>
              </select>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <label htmlFor="date" className="text-sm font-bold">Preferred date</label>
              <input id="date" name="date" type="date" className={inputClass} />
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="message" className="text-sm font-bold">Location and details</label>
            <textarea
              id="message"
              name="message"
              required
              placeholder="Where is it, what do you need the photos for, and any dates that won't work?"
              className={`${inputClass} min-h-32 resize-y`}
            />
          </div>

          <button
            type="submit"
            className="self-start rounded-full bg-accent px-6 py-3 font-bold text-accent-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Request a date
          </button>

          <p role="status" aria-live="polite" className="text-sm text-ink-soft empty:hidden">
            {status}
          </p>
        </form>
      </Container>
    </section>
  );
}

export default BookingForm;
