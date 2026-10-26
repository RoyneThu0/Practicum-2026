import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { formatMoney } from "../../lib/money.js";
import FilterBar from "../FilterBar.jsx";
import { inputClass } from "../FormField.jsx";

const orderChip = {
  paid: "bg-emerald-200 text-emerald-950 dark:bg-emerald-300/20 dark:text-emerald-200",
  pending: "bg-amber-200 text-amber-950 dark:bg-amber-300/20 dark:text-amber-200",
  expired: "bg-line text-ink-soft",
  cancelled: "bg-line text-ink-soft",
};
const placed = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

// One slot's price, edited in whole currency units (e.g. 450) and saved as cents.
function SlotPriceRow({ slot, currency, onSave }) {
  const [value, setValue] = useState(String(slot.priceCents / 100));
  const [message, setMessage] = useState("");
  const changed = Math.round(Number(value) * 100) !== slot.priceCents;

  async function save(event) {
    event.preventDefault();
    try {
      await onSave(slot.id, Math.round(Number(value) * 100));
      setMessage("Saved");
    } catch (err) {
      setMessage(err.fields?.priceCents ?? err.message);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
      <span className="min-w-0 flex-1 basis-40">
        <span className="font-semibold">{slot.label}</span>
        {slot.premium && <span className="ml-2 font-mono text-xs text-accent">golden hour</span>}
        <span className="block text-xs text-ink-soft">{slot.hours}</span>
      </span>
      <label className="flex items-center gap-2 text-sm">
        <span className="sr-only">Price for {slot.label} in {currency.toUpperCase()}</span>
        <span className="font-mono text-ink-soft">{currency.toUpperCase()}</span>
        <input
          type="number"
          min="1"
          step="0.01"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setMessage("");
          }}
          className={`${inputClass} w-28 tabular-nums`}
        />
      </label>
      <button
        type="submit"
        disabled={!changed}
        className="rounded-full border border-line px-3 py-1 text-sm font-semibold transition-colors hover:border-ink disabled:opacity-40 disabled:hover:border-line"
      >
        Save
      </button>
      <span role="status" className="w-full text-xs text-ink-soft empty:hidden sm:w-auto">{message}</span>
    </form>
  );
}

// The Payments tab: every Stripe order (newest first, filterable by status)
// and the price of each shoot slot. Only the webhook changes an order's
// status; this tab just shows it.
function AdminPayments() {
  const [orders, setOrders] = useState([]);
  const [slots, setSlots] = useState([]);
  const [currency, setCurrency] = useState("usd");
  const [status, setStatus] = useState("loading");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    Promise.all([api("/api/admin/payments/orders"), api("/api/slots")])
      .then(([orderRows, slotData]) => {
        setOrders(orderRows);
        setSlots(slotData.slots);
        setCurrency(slotData.currency);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  async function savePrice(id, priceCents) {
    const updated = await api(`/api/admin/payments/slots/${id}`, { method: "PATCH", body: { priceCents } });
    setSlots((prev) => prev.map((slot) => (slot.id === id ? updated : slot)));
  }

  if (status === "loading") return <p className="py-12 text-ink-soft">Loading payments…</p>;
  if (status === "error") return <p role="alert" className="py-12">Payments couldn't be loaded. Refresh to try again.</p>;

  const paid = orders.filter((o) => o.status === "paid");
  const takings = paid.reduce((sum, o) => sum + o.totalCents, 0);
  const count = (id) => (id === "all" ? orders.length : orders.filter((o) => o.status === id).length);
  const filters = ["all", "paid", "pending", "expired", "cancelled"].map((id) => ({
    id,
    label: `${id[0].toUpperCase()}${id.slice(1)} (${count(id)})`,
  }));
  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section aria-labelledby="orders-title" className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="orders-title" className="font-display text-2xl leading-none">Orders</h3>
          <p className="font-mono text-xs text-ink-soft">
            {paid.length} paid · {formatMoney(takings, currency)} received (test mode)
          </p>
        </div>
        <FilterBar categories={filters} active={filter} onChange={setFilter} label="Filter orders by status" />

        {visible.length === 0 ? (
          <p className="rounded border border-dashed border-line px-4 py-10 text-center text-ink-soft">
            {orders.length === 0 ? "No orders yet. They appear when someone uses Book & pay." : "No orders with this status."}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line rounded border border-line bg-paper-raised">
            {visible.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                <span className="w-12 font-mono text-sm text-ink-soft">#{o.id}</span>
                <span className="min-w-0 flex-1 basis-48">
                  <span className="block truncate font-semibold">{o.description}</span>
                  <span className="block truncate text-xs text-ink-soft">
                    {o.customerName} · {o.customerEmail} · {placed.format(new Date(o.createdAt))}
                  </span>
                </span>
                <span className="font-mono text-sm tabular-nums">{formatMoney(o.totalCents, o.currency)}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${orderChip[o.status]}`}>{o.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="prices-title" className="flex flex-col gap-3">
        <h3 id="prices-title" className="font-display text-2xl leading-none">Slot prices</h3>
        <p className="text-sm text-ink-soft">
          New prices apply to new orders. Orders already placed keep the price they were bought at.
        </p>
        <div className="flex flex-col divide-y divide-line rounded border border-line bg-paper-raised">
          {slots.map((slot) => (
            <SlotPriceRow key={slot.id} slot={slot} currency={currency} onSave={savePrice} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminPayments;
