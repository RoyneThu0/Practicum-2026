import { imageFor } from "../lib/unsplash.js";
import ShortlistToggle from "./ShortlistToggle.jsx";

// Grid spans for each tile shape. On a phone there is one column,
// so nothing spans columns (that would make the page scroll sideways).
const shapeClasses = {
  single: "",
  tall: "row-span-2",
  wide: "",
  feature: "row-span-2",
};

function PhotoTile({ photo, eager = false, isShortlisted, onShortlistChange }) {
  const image = imageFor(photo);

  return (
    <li
      className={`group relative min-w-0 overflow-hidden rounded bg-paper-raised ${shapeClasses[photo.shape]}`}
    >
      <a href={photo.link} target="_blank" rel="noopener" className="block h-full">
        <figure className="h-full">
          <img
            src={image.src}
            srcSet={image.srcSet}
            sizes={image.sizes}
            width={image.width}
            height={image.height}
            alt={photo.alt}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-600 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-[1.035] group-focus-within:scale-[1.035] motion-reduce:transition-none"
          />
          {/* Touch screens always see the caption; with a mouse it appears on hover or keyboard focus. */}
          <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 bg-linear-to-t from-scrim to-transparent px-3.5 pt-10 pb-3 text-[#f2f4f1] transition duration-300 motion-reduce:transition-none pointer-fine:translate-y-2 pointer-fine:opacity-0 pointer-fine:group-hover:translate-y-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:translate-y-0 pointer-fine:group-focus-within:opacity-100">
            <span className="font-display text-[1.3rem] leading-tight">{photo.title}</span>
            <span className="font-mono text-[0.7rem] tracking-wide opacity-85">
              Photo: {photo.credit} / Unsplash
            </span>
          </figcaption>
        </figure>
      </a>

      {/* A sibling of the link, not inside it: a button inside an <a> is invalid HTML. */}
      <div className="absolute top-2 right-2 z-10">
        <ShortlistToggle
          value={isShortlisted}
          onChange={(next) => onShortlistChange(photo.id, next)}
          label={photo.title}
        />
      </div>
    </li>
  );
}

export default PhotoTile;
