// The row of category buttons above the gallery.
// FilterBar is itself a controlled component: it has no state of its own.
// It shows whichever category it is given as `active`, and when a button is
// clicked it reports the choice with onChange(id). Gallery owns the state.

const pillClass = "rounded-full border px-3.5 py-1.5 text-sm font-semibold";
const activePillClass = "border-ink bg-ink text-paper";
const inactivePillClass = "border-line";

function FilterBar({ categories, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter photos by landscape">
      {categories.map((category) => {
        const isActive = active === category.id;
        return (
          <button
            key={category.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(category.id)}
            className={`${pillClass} ${isActive ? activePillClass : inactivePillClass}`}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}

export default FilterBar;
