import { useState } from "react";
import { bookingStatuses } from "../../data/bookingOptions.js";
import FormField, { inputClass } from "../FormField.jsx";
import ConfirmButton from "./ConfirmButton.jsx";

// Status colours: each status gets its own chip so the list can be scanned at a glance.
const statusClasses = {
  new: "bg-accent text-accent-ink",
  contacted: "bg-amber-200 text-amber-950 dark:bg-amber-300/20 dark:text-amber-200",
  booked: "bg-emerald-200 text-emerald-950 dark:bg-emerald-300/20 dark:text-emerald-200",
  declined: "bg-line text-ink-soft",
};

const received = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
const shootDate = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" });

// One booking request. The status dropdown saves as soon as it changes;
// private notes save with their own button.
// onChange(id, changes) and onDelete(id) come from AdminBookings and return promises.
function BookingCard({ booking, onChange, onDelete }) {
  const [notes, setNotes] = useState(booking.adminNotes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const notesChanged = notes !== booking.adminNotes;

  async function save(changes) {
    setSaving(true);
    setError("");
    try {
      await onChange(booking.id, changes);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const statusId = `booking-${booking.id}-status`;
  const notesId = `booking-${booking.id}-notes`;

  return (
    <article className="grid gap-5 rounded border border-line bg-paper-raised p-4 sm:p-5 lg:grid-cols-[1fr_18rem]">
      <div className="min-w-0">
        <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="font-display text-2xl leading-tight">{booking.name}</h3>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusClasses[booking.status]}`}>
            {bookingStatuses.find((s) => s.id === booking.status)?.label}
          </span>
          {booking.hasAccount && <span className="font-mono text-xs text-ink-soft">has an account</span>}
        </header>

        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-ink-soft">Email</dt>
          <dd className="min-w-0 break-all">
            <a href={`mailto:${booking.email}`} className="font-semibold text-accent underline underline-offset-2">
              {booking.email}
            </a>
          </dd>
          <dt className="text-ink-soft">Shoot</dt>
          <dd>{booking.shootType}</dd>
          <dt className="text-ink-soft">Preferred date</dt>
          <dd>{booking.preferredDate ? shootDate.format(new Date(booking.preferredDate)) : "Not given"}</dd>
          <dt className="text-ink-soft">Received</dt>
          <dd>{received.format(new Date(booking.createdAt))}</dd>
          {booking.shortlistTitles.length > 0 && (
            <>
              <dt className="text-ink-soft">Shortlisted</dt>
              <dd>{booking.shortlistTitles.join(", ")}</dd>
            </>
          )}
        </dl>

        <p className="mt-3 rounded border border-line bg-paper px-3 py-2.5 whitespace-pre-line">{booking.message}</p>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <FormField id={statusId} label="Status">
          <select
            id={statusId}
            value={booking.status}
            disabled={saving}
            onChange={(event) => save({ status: event.target.value })}
            className={inputClass}
          >
            {bookingStatuses.map((status) => (
              <option key={status.id} value={status.id}>{status.label}</option>
            ))}
          </select>
        </FormField>

        <FormField id={notesId} label="Private notes">
          <textarea
            id={notesId}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={5000}
            placeholder="Only you can see these"
            className={`${inputClass} min-h-20 resize-y text-sm`}
          />
        </FormField>

        <p role="alert" className="text-sm font-semibold text-red-700 empty:hidden dark:text-red-300">{error}</p>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            disabled={!notesChanged || saving}
            onClick={() => save({ adminNotes: notes })}
            className="rounded-full border border-line px-3 py-1 text-sm font-semibold transition-colors hover:border-ink disabled:opacity-40 disabled:hover:border-line"
          >
            {saving ? "Saving…" : notesChanged ? "Save notes" : "Notes saved"}
          </button>
          <ConfirmButton onConfirm={() => onDelete(booking.id)} />
        </div>
      </div>
    </article>
  );
}

export default BookingCard;
