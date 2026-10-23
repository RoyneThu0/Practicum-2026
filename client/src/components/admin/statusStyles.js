// Colours for each booking status, shared by the booking cards and the calendar
// so a status looks the same everywhere.
export const statusChipClasses = {
  new: "bg-accent text-accent-ink",
  contacted: "bg-amber-200 text-amber-950 dark:bg-amber-300/20 dark:text-amber-200",
  booked: "bg-emerald-200 text-emerald-950 dark:bg-emerald-300/20 dark:text-emerald-200",
  declined: "bg-line text-ink-soft",
};

export const statusDotClasses = {
  new: "bg-accent",
  contacted: "bg-amber-500 dark:bg-amber-300",
  booked: "bg-emerald-600 dark:bg-emerald-400",
  declined: "bg-ink-soft/50",
};
