import { useState } from "react";
import { formatDay, todayInNairobi } from "../../lib/dates.js";
import FormField, { inputClass } from "../FormField.jsx";

// The Availability tab: block single days or ranges, and unblock them.
// Blocked days are refused by the booking form and the server.
// The list and the block/unblock actions live in AdminPage, because booking
// cards also use them ("Block this date").
function AdminAvailability({ blockedDates, status, onBlock, onUnblock }) {
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const today = todayInNairobi();

  async function handleSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true);
    setErrors({});
    setNotice("");
    try {
      const from = form.get("from");
      const to = form.get("to") || from;
      await onBlock({ from, to, note: form.get("note") });
      formElement.reset();
      setNotice(from === to ? `Blocked ${formatDay(from)}.` : `Blocked ${formatDay(from)} to ${formatDay(to)}.`);
    } catch (err) {
      setErrors(err.fields ?? {});
      setNotice(err.fields ? "" : `Couldn't block those dates: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function unblock(day) {
    try {
      await onUnblock(day);
      setNotice(`${formatDay(day)} is available again.`);
    } catch (err) {
      setNotice(`Couldn't unblock ${formatDay(day)}: ${err.message}`);
    }
  }

  const fieldError = (name) =>
    errors[name] && <p className="text-sm font-semibold text-red-700 dark:text-red-300">{errors[name]}</p>;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded border border-line bg-paper-raised p-5">
        <h3 className="font-display text-2xl leading-none">Block dates</h3>
        <p className="text-sm text-ink-soft">
          Visitors can't request these days. Leave “To” empty to block a single day.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
          <FormField id="block-from" label="From">
            <input id="block-from" name="from" type="date" min={today} required className={inputClass} />
            {fieldError("from")}
          </FormField>
          <FormField id="block-to" label="To (optional)">
            <input id="block-to" name="to" type="date" min={today} className={inputClass} />
            {fieldError("to")}
          </FormField>
        </div>
        <FormField id="block-note" label="Private note (optional)">
          <input id="block-note" name="note" maxLength={200} placeholder="e.g. Booked: Laikipia lodge" className={inputClass} />
          {fieldError("note")}
        </FormField>
        <button
          type="submit"
          disabled={busy}
          className="self-start rounded-full bg-accent px-5 py-2.5 font-bold text-accent-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-60"
        >
          {busy ? "Blocking…" : "Block dates"}
        </button>
      </form>

      <div className="flex min-w-0 flex-col gap-3">
        <p role="status" aria-live="polite" className="rounded border border-line bg-paper-raised px-3 py-2 text-sm empty:hidden">
          {notice}
        </p>

        {status === "loading" && <p className="text-ink-soft">Loading blocked dates…</p>}
        {status === "error" && <p role="alert">The blocked dates couldn't be loaded. Refresh to try again.</p>}

        {status === "ready" &&
          (blockedDates.length === 0 ? (
            <p className="rounded border border-dashed border-line px-4 py-10 text-center text-ink-soft">
              No upcoming dates are blocked. Every day from today can be requested.
            </p>
          ) : (
            <>
              <h3 className="font-display text-2xl leading-none">Upcoming blocked days ({blockedDates.length})</h3>
              <ul className="flex flex-col divide-y divide-line rounded border border-line bg-paper-raised">
                {blockedDates.map(({ day, note }) => (
                  <li key={day} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5">
                    <span className="min-w-0">
                      <span className="font-semibold tabular-nums">{formatDay(day)}</span>
                      {note && <span className="ml-3 text-sm text-ink-soft">{note}</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => unblock(day)}
                      aria-label={`Unblock ${formatDay(day)}`}
                      className="rounded-full border border-line px-3 py-1 text-sm font-semibold transition-colors hover:border-ink"
                    >
                      Unblock
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ))}
      </div>
    </div>
  );
}

export default AdminAvailability;
