import { useState } from "react";
import photos, { categories } from "../data/photos.js";
import Container from "./Container.jsx";
import FilterBar from "./FilterBar.jsx";
import PhotoTile from "./PhotoTile.jsx";

function Gallery() {
  // State holds only the chosen category. The filtered list is not stored:
  // it is recalculated from photos + activeCategory on every render,
  // so it can never get out of step with the buttons.
  const [activeCategory, setActiveCategory] = useState("all");

  const visiblePhotos =
    activeCategory === "all"
      ? photos
      : photos.filter((photo) => photo.category === activeCategory);

  return (
    <section id="work" aria-labelledby="work-title" className="scroll-mt-16 pb-12">
      <Container>
        <h2 id="work-title" className="sr-only">
          Selected work
        </h2>

        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-t border-line pt-5">
          <FilterBar
            categories={categories}
            active={activeCategory}
            onChange={setActiveCategory}
          />

          <p aria-live="polite" className="font-mono text-xs text-ink-soft">
            Showing {visiblePhotos.length} of {photos.length}
          </p>
        </div>

        <ul className="grid grid-flow-dense auto-rows-[14rem] grid-cols-1 gap-2">
          {visiblePhotos.map((photo, index) => (
            <PhotoTile key={photo.id} photo={photo} eager={index === 0} />
          ))}
        </ul>
      </Container>
    </section>
  );
}

export default Gallery;
