import { shootTypes } from "./options.js";

// Checks a booking request from the public form and returns { booking, errors }.
export default function validateBooking(input = {}) {
  const errors = {};
  const text = (value) => (typeof value === "string" ? value.trim() : "");

  const booking = {
    name: text(input.name),
    email: text(input.email),
    shootType: text(input.shootType),
    preferredDate: text(input.preferredDate) || null,
    message: text(input.message),
    // Only whole numbers survive; anything else is dropped. Duplicates removed.
    photoIds: Array.isArray(input.photoIds)
      ? [...new Set(input.photoIds.map(Number).filter(Number.isInteger))].slice(0, 50)
      : [],
  };

  if (!booking.name) errors.name = "Tell me your name";
  else if (booking.name.length > 120) errors.name = "Keep your name under 120 characters";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email) || booking.email.length > 254) {
    errors.email = "Enter a valid email address";
  }

  if (!shootTypes.includes(booking.shootType)) errors.shootType = "Choose a type of shoot";

  if (booking.preferredDate) {
    // Round-trip through Date so impossible days like 2026-02-30 are caught too.
    const date = new Date(`${booking.preferredDate}T00:00:00Z`);
    const isRealDate = !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === booking.preferredDate;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(booking.preferredDate) || !isRealDate) {
      errors.preferredDate = "Use a real date";
    }
  }

  if (!booking.message) errors.message = "Tell me where it is and what you need";
  else if (booking.message.length > 5000) errors.message = "Keep the details under 5,000 characters";

  return { booking, errors };
}
