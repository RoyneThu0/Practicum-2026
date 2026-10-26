// Prices travel as whole cents (45000) plus a currency code ("usd"), exactly
// as the database and Stripe store them. This turns them into "$450".
export function formatMoney(cents, currency = "usd") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
    // No ".00" on round amounts; show cents when there are some.
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
