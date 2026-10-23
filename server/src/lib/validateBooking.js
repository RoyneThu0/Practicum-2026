import { isIsoDate } from "./dates.js";
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

  // Whether the date is in the past or blocked is checked in routes/bookings.js,
  // because that needs the database.
  if (booking.preferredDate && !isIsoDate(booking.preferredDate)) {
    errors.preferredDate = "Use a real date";
  }

  if (!booking.message) errors.message = "Tell me where it is and what you need";
  else if (booking.message.length > 5000) errors.message = "Keep the details under 5,000 characters";

  return { booking, errors };
}
