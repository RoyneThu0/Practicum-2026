// The studio works in Nairobi time, so "today" means today in Nairobi, not
// on the server's clock (Render runs in UTC). Used in SQL as ${today}.
export const today = "(now() AT TIME ZONE 'Africa/Nairobi')::date";

// True for a real calendar date written YYYY-MM-DD (rejects 2026-02-30).
export function isIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// "2026-12-12" -> "Sat 12 Dec 2026", for order descriptions and Stripe's page.
export function formatDay(day) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(`${day}T00:00:00Z`))
    .replace(",", "");
}
