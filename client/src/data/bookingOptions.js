// Shoot types offered on the booking form. The server accepts exactly these
// names plus "Something else" (server/src/lib/options.js).
export const sessions = [
  { name: "Lodge & property", length: "1–3 days" },
  { name: "Editorial assignment", length: "by brief" },
  { name: "Print commission", length: "2–6 weeks" },
];

// Where a booking request is up to, in the order they usually happen.
export const bookingStatuses = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "booked", label: "Booked" },
  { id: "declined", label: "Declined" },
];
