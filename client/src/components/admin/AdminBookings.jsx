import { useState } from "react";
import { bookingStatuses } from "../../data/bookingOptions.js";
import FilterBar from "../FilterBar.jsx";
import BookingCard from "./BookingCard.jsx";

// The Bookings tab: every request sent from the "Book a shoot" form, newest
// first, filterable by status. The bookings themselves live in AdminPage,
// because the Availability tab's calendar shows them too; this tab only
// filters and displays them, and passes changes back up.
function AdminBookings({ bookings, status, onUpdate, onDelete, blockedDates, onBlockDate }) {
  const [filter, setFilter] = useState("new");
  const [notice, setNotice] = useState("");

  async function deleteBooking(id) {
    try {
      await onDelete(id);
      setNotice("Booking deleted.");
    } catch (err) {
      setNotice(`Couldn't delete the booking: ${err.message}`);
    }
  }

  if (status === "loading") return <p className="py-12 text-ink-soft">Loading bookings…</p>;
  if (status === "error") {
    return <p role="alert" className="py-12">The bookings couldn't be loaded. Refresh to try again.</p>;
  }

  const countFor = (id) => (id === "all" ? bookings.length : bookings.filter((b) => b.status === id).length);
  const filters = [{ id: "all", label: "All" }, ...bookingStatuses].map((s) => ({
    id: s.id,
    label: `${s.label} (${countFor(s.id)})`,
  }));
  const visible = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div className="flex flex-col gap-5">
      <FilterBar categories={filters} active={filter} onChange={setFilter} label="Filter bookings by status" />

      <p role="status" aria-live="polite" className="rounded border border-line bg-paper-raised px-3 py-2 text-sm empty:hidden">
        {notice}
      </p>

      {visible.length === 0 ? (
        <p className="rounded border border-dashed border-line px-4 py-10 text-center text-ink-soft">
          {bookings.length === 0
            ? "No booking requests yet. They'll appear here when someone sends the “Book a shoot” form."
            : "No bookings with this status."}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onChange={onUpdate}
              onDelete={deleteBooking}
              isDateBlocked={blockedDates.some((blocked) => blocked.day === booking.preferredDate)}
              onBlockDate={onBlockDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminBookings;
