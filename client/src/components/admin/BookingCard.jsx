import { useState } from "react";
import { bookingStatuses } from "../../data/bookingOptions.js";
import { formatDay, todayInNairobi } from "../../lib/dates.js";
import FormField, { inputClass } from "../FormField.jsx";
import ConfirmButton from "./ConfirmButton.jsx";
import { statusChipClasses } from "./statusStyles.js";

const received = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

// One booking request. The status dropdown saves as soon as it changes;
// private notes save with their own button.
// onChange(id, changes) and onDelete(id) come from AdminBookings and return promises.
// isDateBlocked / onBlockDate let you block the requested day once it's booked.
function BookingCard({ booking, onChange, onDelete, isDateBlocked, onBlockDate }) {
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
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusChipClasses[booking.status]}`}>
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
          <dd className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {booking.preferredDate ? formatDay(booking.preferredDate) : "Not given"}
            {booking.preferredDate && booking.preferredDate >= todayInNairobi() &&
              (isDateBlocked ? (
                <span className="font-mono text-xs text-ink-soft">blocked</span>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    onBlockDate({ from: booking.preferredDate, note: `Booking: ${booking.name}` }).catch((err) =>
                      setError(err.message)
                    )
                  }
                  className="rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold transition-colors hover:border-ink"
                >
                  Block this date
                </button>
              ))}
          </dd>
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
