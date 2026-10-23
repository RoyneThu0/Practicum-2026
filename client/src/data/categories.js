// The gallery's filter buttons, in order. "all" is not a real category; it means "no filter".
// The ids match the category column in the photos table (server/src/db/migrations/001_photos.sql).
export const categories = [
  { id: "all", label: "All" },
  { id: "plains", label: "Plains & dunes" },
  { id: "mountains", label: "Mountains" },
  { id: "water", label: "Water" },
];
