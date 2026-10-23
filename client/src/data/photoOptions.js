// Choices for the admin panel's photo form. The ids match the CHECK
// constraints on the photos table (server/src/db/migrations/001_photos.sql).
import { categories as filterCategories } from "./categories.js";

// The filter buttons minus "all", which isn't a real category.
export const photoCategories = filterCategories.filter((category) => category.id !== "all");

export const photoShapes = [
  { id: "single", label: "Single (1 × 1)" },
  { id: "tall", label: "Tall (1 × 2)" },
  { id: "wide", label: "Wide (2 × 1)" },
  { id: "feature", label: "Feature (2 × 2)" },
];
