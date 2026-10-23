// Allowed values shared by the validators. They match the CHECK constraints in
// the migrations, so bad input gets a clear 400 instead of a database error.
export const categories = ["plains", "mountains", "water"];
export const shapes = ["single", "tall", "wide", "feature"];
export const shootTypes = [
  "Lodge & property",
  "Editorial assignment",
  "Print commission",
  "Something else",
];
export const bookingStatuses = ["new", "contacted", "booked", "declined"];
