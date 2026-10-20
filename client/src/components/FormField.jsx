// A label + control pair for the booking form. The control is passed in as children,
// so the same wrapper works for input, select and textarea.

export const inputClass =
  "w-full rounded border border-line bg-paper px-3 py-2.5 text-base text-ink focus:border-accent focus:outline-2 focus:outline-accent";

function FormField({ id, label, children }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      {children}
    </div>
  );
}

export default FormField;
