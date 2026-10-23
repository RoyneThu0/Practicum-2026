import { useEffect, useRef, useState } from "react";
import { bookingStatuses } from "../../data/bookingOptions.js";
import { addDays, formatDay, todayInNairobi } from "../../lib/dates.js";
import { statusChipClasses, statusDotClasses } from "./statusStyles.js";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthFormat = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric", timeZone: "UTC" });

// The 42 days (6 weeks, Monday first) shown for the month that `day` is in,
// including the end of the month before and the start of the month after.
function calendarDays(day) {
  const first = `${day.slice(0, 7)}-01`;
  const weekday = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
  const start = addDays(first, -weekday);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

// A month calendar for the Availability tab.
// - Each booking request is a dot on its preferred date, coloured by status.
// - Blocked days are shaded and struck through.
// - Pick a day to see its bookings and block or unblock it.
// Arrow keys move between days (and months), like other date pickers.
function AdminCalendar({ bookings, blockedDates, onBlock, onUnblock, onOpenBookings }) {
  const today = todayInNairobi();
  const [selected, setSelected] = useState(today);
  const [error, setError] = useState("");
  const gridRef = useRef(null);
  const moveFocus = useRef(false);

  // After an arrow key, put keyboard focus on the newly selected day.
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current?.querySelector(`[data-day="${selected}"]`)?.focus();
  }, [selected]);

  // Group bookings by day once per render: { "2026-12-12": [booking, …] }.
  const bookingsByDay = {};
  for (const booking of bookings) {
    if (!booking.preferredDate) continue;
    (bookingsByDay[booking.preferredDate] ??= []).push(booking);
  }
  const blockedByDay = Object.fromEntries(blockedDates.map((b) => [b.day, b]));

  const month = selected.slice(0, 7);
  const days = calendarDays(selected);
  const monthBookings = bookings.filter((b) => b.preferredDate?.startsWith(month));
  const undated = bookings.filter((b) => !b.preferredDate && b.status !== "declined").length;

  function goToMonth(step) {
    const first = `${month}-01`;
    const target = new Date(`${first}T00:00:00Z`);
    target.setUTCMonth(target.getUTCMonth() + step);
    setSelected(target.toISOString().slice(0, 10));
    setError("");
  }

  function handleKeyDown(event) {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    if (!step) return;
    event.preventDefault();
    moveFocus.current = true;
    setSelected((day) => addDays(day, step));
    setError("");
  }

  async function toggleBlocked() {
    setError("");
    try {
      if (blockedByDay[selected]) await onUnblock(selected);
      else {
        const names = (bookingsByDay[selected] ?? []).filter((b) => b.status === "booked").map((b) => b.name);
        await onBlock({ from: selected, note: names.length ? `Booking: ${names.join(", ")}` : "" });
      }
    } catch (err) {
      setError(err.message);
    }
  }

  const selectedBookings = bookingsByDay[selected] ?? [];
  const selectedBlock = blockedByDay[selected];

  return (
    <section aria-labelledby="calendar-title" className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 rounded border border-line bg-paper-raised p-3 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            aria-label="Previous month"
            className="rounded-full border border-line px-3 py-1 font-semibold transition-colors hover:border-ink"
          >
            ←
          </button>
          <div className="text-center">
            <h3 id="calendar-title" className="font-display text-2xl leading-none sm:text-3xl" aria-live="polite">
              {monthFormat.format(new Date(`${month}-01T00:00:00Z`))}
            </h3>
            <p className="mt-1 font-mono text-xs text-ink-soft">
              {monthBookings.length} {monthBookings.length === 1 ? "request" : "requests"} this month
            </p>
          </div>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            aria-label="Next month"
            className="rounded-full border border-line px-3 py-1 font-semibold transition-colors hover:border-ink"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center font-mono text-[0.7rem] tracking-wider text-ink-soft uppercase" aria-hidden="true">
          {weekdays.map((weekday) => (
            <span key={weekday} className="py-1">
              {weekday.slice(0, 2)}
              <span className="hidden sm:inline">{weekday.slice(2)}</span>
            </span>
          ))}
        </div>

        <div ref={gridRef} role="group" aria-label="Days" onKeyDown={handleKeyDown} className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayBookings = bookingsByDay[day] ?? [];
            const blocked = blockedByDay[day];
            const inMonth = day.startsWith(month);
            const isSelected = day === selected;
            const label = [
              formatDay(day),
              dayBookings.length > 0 && `${dayBookings.length} booking ${dayBookings.length === 1 ? "request" : "requests"}`,
              blocked && "blocked",
              day === today && "today",
            ]
              .filter(Boolean)
              .join(", ");

            return (
              <button
                key={day}
                type="button"
                data-day={day}
                tabIndex={isSelected ? 0 : -1}
                aria-pressed={isSelected}
                aria-label={label}
                onClick={() => {
                  setSelected(day);
                  setError("");
                }}
                className={`relative flex aspect-square min-w-0 flex-col items-center justify-start gap-1 rounded p-1 pt-1.5 text-sm transition-colors sm:aspect-[4/3] sm:pt-2 ${
                  isSelected ? "bg-ink text-paper" : blocked ? "bg-line/60 hover:bg-line" : "hover:bg-paper"
                } ${inMonth ? "" : "opacity-40"} ${day < today && !isSelected ? "text-ink-soft" : ""}`}
              >
                <span
                  className={`grid size-6 place-items-center rounded-full tabular-nums ${
                    day === today && !isSelected ? "ring-2 ring-accent" : ""
                  } ${blocked ? "line-through decoration-2" : ""}`}
                >
                  {Number(day.slice(8))}
                </span>
                {dayBookings.length > 0 && (
                  <span className="flex flex-wrap items-center justify-center gap-0.5" aria-hidden="true">
                    {dayBookings.slice(0, 3).map((b) => (
                      <span
                        key={b.id}
                        className={`size-1.5 rounded-full sm:size-2 ${statusDotClasses[b.status]} ${
                          isSelected ? "ring-1 ring-paper" : ""
                        }`}
                      />
                    ))}
                    {dayBookings.length > 3 && (
                      <span className="font-mono text-[0.6rem] leading-none">+{dayBookings.length - 3}</span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-soft" aria-label="Key">
          {bookingStatuses.map((status) => (
            <li key={status.id} className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${statusDotClasses[status.id]}`} aria-hidden="true" />
              {status.label}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-4 rounded-sm bg-line/60" aria-hidden="true" />
            Blocked
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-3 rounded-full ring-2 ring-accent" aria-hidden="true" />
            Today
          </li>
        </ul>
        {undated > 0 && (
          <p className="mt-2 text-xs text-ink-soft">
            {undated} open {undated === 1 ? "request has" : "requests have"} no preferred date, so {undated === 1 ? "it isn't" : "they aren't"} on the calendar.
          </p>
        )}
      </div>

      <aside aria-labelledby="day-title" className="flex flex-col gap-3 rounded border border-line bg-paper-raised p-4 sm:p-5">
        <h3 id="day-title" className="font-display text-2xl leading-tight">{formatDay(selected)}</h3>

        {selectedBlock && (
          <p className="rounded bg-line/60 px-3 py-2 text-sm">
            <strong>Blocked.</strong> {selectedBlock.note || "No note."}
          </p>
        )}

        {selectedBookings.length === 0 ? (
          <p className="text-sm text-ink-soft">No booking requests for this day.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {selectedBookings.map((b) => (
              <li key={b.id} className="rounded border border-line bg-paper px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{b.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusChipClasses[b.status]}`}>
                    {bookingStatuses.find((s) => s.id === b.status)?.label}
                  </span>
                </div>
                <p className="text-sm text-ink-soft">{b.shootType}</p>
              </li>
            ))}
          </ul>
        )}

        {selected >= today && (
          <button
            type="button"
            onClick={toggleBlocked}
            className="self-start rounded-full border border-line px-4 py-1.5 text-sm font-semibold transition-colors hover:border-ink"
          >
            {selectedBlock ? "Unblock this day" : "Block this day"}
          </button>
        )}
        {selectedBookings.length > 0 && (
          <button
            type="button"
            onClick={onOpenBookings}
            className="self-start text-sm font-semibold text-accent underline underline-offset-2 hover:text-ink"
          >
            Manage these in Bookings
          </button>
        )}
        <p role="alert" className="text-sm font-semibold text-red-700 empty:hidden dark:text-red-300">{error}</p>
      </aside>
    </section>
  );
}

export default AdminCalendar;
