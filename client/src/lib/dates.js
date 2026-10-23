// Date helpers for the booking form and admin panel.
// Dates travel as "YYYY-MM-DD" strings, which sort and compare correctly as text.

// Today's date as YYYY-MM-DD in Nairobi, where the studio is, so the form and
// the server agree on what "today" is wherever the visitor happens to be.
export function todayInNairobi() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(new Date());
}

const longFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const shortFormat = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", timeZone: "UTC" });

// "2026-12-12" -> "Sat, 12 Dec 2026" (long) or "12 Dec" (short).
// Read as UTC midnight so the day never shifts with the viewer's time zone.
export function formatDay(day, style = "long") {
  return (style === "short" ? shortFormat : longFormat).format(new Date(`${day}T00:00:00Z`));
}
