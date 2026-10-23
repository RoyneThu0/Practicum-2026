import { useState } from "react";
import { photoCategories, photoShapes } from "../../data/photoOptions.js";
import { imageFor } from "../../lib/unsplash.js";
import FormField, { inputClass } from "../FormField.jsx";

const emptyPhoto = {
  title: "",
  alt: "",
  category: "plains",
  shape: "single",
  unsplashId: "",
  credit: "",
  link: "",
};

// The add / edit form for one photo.
// photo: the photo being edited, or null to add a new one.
// onSave(values) must return a promise; if it rejects with err.fields
// (the server's per-field messages), they're shown under each field.
function PhotoEditor({ photo, onSave, onCancel }) {
  const [values, setValues] = useState(photo ?? emptyPhoto);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // One change handler for every field: the input's name says which value to update.
  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setMessage("");
    try {
      await onSave(values);
    } catch (err) {
      setErrors(err.fields ?? {});
      setMessage(err.message);
      setBusy(false);
    }
  }

  // A live preview, as soon as the Unsplash field holds something id-like.
  const previewId = values.unsplashId.match(/photo-[A-Za-z0-9-]+/)?.[0];
  const preview = previewId ? imageFor({ ...values, unsplashId: previewId }) : null;

  const fieldError = (name) =>
    errors[name] && <p className="text-sm font-semibold text-red-700 dark:text-red-300">{errors[name]}</p>;

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="photo-editor-title"
      className="grid gap-6 rounded border border-line bg-paper-raised p-5 sm:p-6 lg:grid-cols-[1fr_16rem]"
    >
      <div className="flex min-w-0 flex-col gap-4">
        <h3 id="photo-editor-title" className="font-display text-3xl leading-none">
          {photo ? `Edit “${photo.title}”` : "Add a photo"}
        </h3>

        <FormField id="photo-title" label="Title">
          <input id="photo-title" name="title" value={values.title} onChange={handleChange} required maxLength={120} className={inputClass} />
          {fieldError("title")}
        </FormField>

        <FormField id="photo-alt" label="Description for screen readers (alt text)">
          <input id="photo-alt" name="alt" value={values.alt} onChange={handleChange} required maxLength={300} className={inputClass} />
          {fieldError("alt")}
        </FormField>

        <div className="flex flex-col gap-4 sm:flex-row">
          <FormField id="photo-category" label="Category">
            <select id="photo-category" name="category" value={values.category} onChange={handleChange} className={inputClass}>
              {photoCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.label}</option>
              ))}
            </select>
            {fieldError("category")}
          </FormField>
          <FormField id="photo-shape" label="Tile shape">
            <select id="photo-shape" name="shape" value={values.shape} onChange={handleChange} className={inputClass}>
              {photoShapes.map((shape) => (
                <option key={shape.id} value={shape.id}>{shape.label}</option>
              ))}
            </select>
            {fieldError("shape")}
          </FormField>
        </div>

        <FormField id="photo-unsplash" label="Unsplash image (photo-… id or images.unsplash.com address)">
          <input
            id="photo-unsplash"
            name="unsplashId"
            value={values.unsplashId}
            onChange={handleChange}
            required
            placeholder="photo-1761078206756-68d3023f3021"
            className={`${inputClass} font-mono text-sm`}
          />
          {fieldError("unsplashId")}
        </FormField>

        <div className="flex flex-col gap-4 sm:flex-row">
          <FormField id="photo-credit" label="Photographer">
            <input id="photo-credit" name="credit" value={values.credit} onChange={handleChange} required className={inputClass} />
            {fieldError("credit")}
          </FormField>
          <FormField id="photo-link" label="Photo page link">
            <input id="photo-link" name="link" type="url" value={values.link} onChange={handleChange} required placeholder="https://unsplash.com/photos/…" className={inputClass} />
            {fieldError("link")}
          </FormField>
        </div>

        <p role="alert" className="text-sm font-semibold text-red-700 empty:hidden dark:text-red-300">
          {message}
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-accent px-5 py-2.5 font-bold text-accent-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-60"
          >
            {busy ? "Saving…" : photo ? "Save changes" : "Add photo"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-line px-5 py-2.5 font-semibold transition-colors hover:border-ink"
          >
            Cancel
          </button>
        </div>
      </div>

      <figure className="min-w-0">
        <figcaption className="mb-2 font-mono text-xs tracking-widest text-ink-soft uppercase">Preview</figcaption>
        {preview ? (
          <img
            src={preview.src}
            alt={values.alt || "Preview of the photo"}
            className={`w-full rounded bg-paper object-cover ${
              { single: "aspect-square", tall: "aspect-[1/2]", wide: "aspect-[2/1]", feature: "aspect-square" }[values.shape]
            }`}
          />
        ) : (
          <div className="grid aspect-square place-items-center rounded border border-dashed border-line p-4 text-center text-sm text-ink-soft">
            Paste an Unsplash image to see it here
          </div>
        )}
      </figure>
    </form>
  );
}

export default PhotoEditor;
