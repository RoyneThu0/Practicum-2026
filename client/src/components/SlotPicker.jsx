import { formatMoney } from "../lib/money.js";

// The time-of-day choice on the booking form, with each slot's price.
// Sunrise and sunset are marked as golden hour; they cost more.
// A controlled radio group: `value` is the chosen slot id, onChange(id) reports a pick.
// Prices come from the server (GET /api/slots); the server prices the order
// again itself at checkout, so what's shown here is only for display.
function SlotPicker({ slots, currency, value, onChange, error }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-1.5 text-sm font-bold">Time of day</legend>
      <div className="grid grid-cols-1 gap-2 min-[26rem]:grid-cols-2 sm:grid-cols-3">
        {slots.map((slot) => (
          <label
            key={slot.id}
            className={`flex cursor-pointer flex-col gap-0.5 rounded border px-3 py-2.5 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-accent ${
              value === slot.id ? "border-accent bg-paper ring-1 ring-accent" : "border-line bg-paper hover:border-ink"
            }`}
          >
            <input
              type="radio"
              name="slot"
              value={slot.id}
              checked={value === slot.id}
              onChange={() => onChange(slot.id)}
              className="sr-only"
            />
            <span className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{slot.label}</span>
              <span className="font-mono text-sm tabular-nums">{formatMoney(slot.priceCents, currency)}</span>
            </span>
            <span className="text-xs text-ink-soft">{slot.hours}</span>
            {slot.premium && (
              <span className="mt-0.5 self-start rounded-full bg-accent px-2 py-0.5 text-[0.65rem] font-bold tracking-wide text-accent-ink uppercase">
                Golden hour
              </span>
            )}
          </label>
        ))}
      </div>
      {error && <p className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>}
    </fieldset>
  );
}

export default SlotPicker;
