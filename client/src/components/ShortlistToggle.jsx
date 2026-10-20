// A controlled toggle: it owns no state. The parent passes the current `value`
// (shortlisted or not) and the toggle only displays it. When clicked it asks for
// the opposite with onChange(!value); the parent decides and passes the new value back.
// Same pattern as QuantityStepper in the BrewHaus lesson.

const baseClass =
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur transition-colors";
const offClass = "bg-paper/85 text-ink";
const onClass = "bg-accent text-accent-ink";

function ShortlistToggle({ value, onChange, label }) {
  return (
    <button
      type="button"
      aria-pressed={value}
      aria-label={value ? `Remove ${label} from shortlist` : `Add ${label} to shortlist`}
      onClick={() => onChange(!value)}
      className={`${baseClass} ${value ? onClass : offClass}`}
    >
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        aria-hidden="true"
        fill={value ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      >
        <path d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95L12 2.5z" />
      </svg>
      {value ? "Shortlisted" : "Shortlist"}
    </button>
  );
}

export default ShortlistToggle;
