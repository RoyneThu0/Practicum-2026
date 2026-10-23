import { useState } from "react";
import { categories } from "../data/categories.js";
import Container from "./Container.jsx";
import FilterBar from "./FilterBar.jsx";
import PhotoTile from "./PhotoTile.jsx";

// startOnShortlist: true when the page was opened from a shared shortlist link.
// sharedCount: how many of those shared photos exist (0 until photos load).
function Gallery({ photos, status, shortlist, onShortlistChange, startOnShortlist = false, sharedCount = 0 }) {
  // State holds only the chosen category. The filtered list is not stored:
  // it is recalculated from photos + activeCategory on every render,
  // so it can never get out of step with the buttons.
  // Opened from a shared link, the gallery starts on the shortlisted photos.
  const [activeCategory, setActiveCategory] = useState(startOnShortlist ? "shortlisted" : "all");
  const [showSharedNote, setShowSharedNote] = useState(true);

  // "Shortlisted" is an extra filter that only appears once something is starred.
  // If the shortlist empties while it's selected, fall back to showing everything.
  const filter = activeCategory === "shortlisted" && shortlist.length === 0 ? "all" : activeCategory;
  const filterButtons =
    shortlist.length > 0 ? [...categories, { id: "shortlisted", label: `★ Shortlisted (${shortlist.length})` }] : categories;

  const visiblePhotos =
    filter === "all"
      ? photos
      : filter === "shortlisted"
        ? photos.filter((photo) => shortlist.includes(photo.id))
        : photos.filter((photo) => photo.category === filter);

  return (
    <section id="work" aria-labelledby="work-title" className="scroll-mt-16 pb-12 sm:pb-16 lg:pb-24">
      <Container>
        <h2 id="work-title" className="sr-only">
          Selected work
        </h2>

        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-t border-line pt-5">
          <FilterBar
            categories={filterButtons}
            active={filter}
            onChange={setActiveCategory}
          />

          <p aria-live="polite" className="font-mono text-xs text-ink-soft">
            {status === "ready" && `Showing ${visiblePhotos.length} of ${photos.length}`}
          </p>
        </div>

        {sharedCount > 0 && showSharedNote && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded border border-accent bg-paper-raised px-4 py-3">
            <p className="min-w-0">
              Someone shared a shortlist of {sharedCount} {sharedCount === 1 ? "photo" : "photos"} with you. They're starred
              below: add your own, then send it with a booking.
            </p>
            <button
              type="button"
              onClick={() => setShowSharedNote(false)}
              className="rounded-full border border-line px-3 py-1 text-sm font-semibold transition-colors hover:border-ink"
            >
              Got it
            </button>
          </div>
        )}

        {status === "loading" && (
          <p className="py-16 text-center text-ink-soft">Loading photos…</p>
        )}

        {status === "error" && (
          <p role="alert" className="rounded border border-line bg-paper-raised px-4 py-6 text-center">
            The photos couldn't be loaded right now. Please refresh to try again.
          </p>
        )}

        <ul className="grid grid-flow-dense auto-rows-[14rem] grid-cols-1 gap-2 sm:auto-rows-[clamp(11rem,19vw,17rem)] sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          {visiblePhotos.map((photo, index) => (
            <PhotoTile
              key={photo.id}
              photo={photo}
              eager={index === 0}
              isShortlisted={shortlist.includes(photo.id)}
              onShortlistChange={onShortlistChange}
            />
          ))}
        </ul>
      </Container>
    </section>
  );
}

export default Gallery;
