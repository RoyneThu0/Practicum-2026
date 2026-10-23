import { useEffect, useState } from "react";
import { photoCategories, photoShapes } from "../../data/photoOptions.js";
import { api } from "../../lib/api.js";
import { thumbnailFor } from "../../lib/unsplash.js";
import ConfirmButton from "./ConfirmButton.jsx";
import PhotoEditor from "./PhotoEditor.jsx";

const labelFor = (list, id) => list.find((item) => item.id === id)?.label ?? id;

const smallButton =
  "rounded-full border border-line px-3 py-1 text-sm font-semibold transition-colors hover:border-ink disabled:opacity-40 disabled:hover:border-line";

// The Photos tab: every gallery photo in order, with move up/down, edit and delete,
// plus an "Add a photo" form. Changes go straight to the database through
// /api/admin/photos and show on the public site on its next load.
function AdminPhotos() {
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [editing, setEditing] = useState(null); // null, "new", or the photo being edited
  const [notice, setNotice] = useState("");

  useEffect(() => {
    api("/api/admin/photos")
      .then((rows) => {
        setPhotos(rows);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  async function savePhoto(values) {
    if (editing === "new") {
      const created = await api("/api/admin/photos", { method: "POST", body: values });
      setPhotos((prev) => [...prev, { ...created, shortlistCount: 0, bookingCount: 0 }]);
      setNotice(`Added “${created.title}” to the end of the gallery.`);
    } else {
      const updated = await api(`/api/admin/photos/${editing.id}`, { method: "PATCH", body: values });
      // Keep the counts: the PATCH reply only has the photo's own fields.
      setPhotos((prev) => prev.map((photo) => (photo.id === updated.id ? { ...photo, ...updated } : photo)));
      setNotice(`Saved “${updated.title}”.`);
    }
    setEditing(null);
  }

  async function move(photo, direction) {
    try {
      setPhotos(await api(`/api/admin/photos/${photo.id}/move`, { method: "POST", body: { direction } }));
      setNotice("");
    } catch (err) {
      setNotice(`Couldn't move “${photo.title}”: ${err.message}`);
    }
  }

  async function remove(photo) {
    try {
      await api(`/api/admin/photos/${photo.id}`, { method: "DELETE" });
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setNotice(`Deleted “${photo.title}”.`);
    } catch (err) {
      setNotice(`Couldn't delete “${photo.title}”: ${err.message}`);
    }
  }

  if (status === "loading") return <p className="py-12 text-ink-soft">Loading photos…</p>;
  if (status === "error") {
    return <p role="alert" className="py-12">The photos couldn't be loaded. Refresh to try again.</p>;
  }

  // The five photos people like most: saved shortlists plus bookings that include them.
  const popularity = (photo) => photo.shortlistCount + photo.bookingCount;
  const mostLiked = [...photos]
    .filter((photo) => popularity(photo) > 0)
    .sort((a, b) => popularity(b) - popularity(a) || b.bookingCount - a.bookingCount)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="most-liked-title" className="rounded border border-line bg-paper-raised p-4 sm:p-5">
        <h3 id="most-liked-title" className="font-display text-2xl leading-none">Most shortlisted</h3>
        {mostLiked.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">
            Nothing yet. Counts come from signed-in visitors' saved shortlists and from booking requests.
          </p>
        ) : (
          <ol className="mt-3 flex flex-col gap-2">
            {mostLiked.map((photo, index) => (
              <li key={photo.id} className="flex items-center gap-3">
                <span className="w-4 font-mono text-sm text-ink-soft tabular-nums">{index + 1}</span>
                <img
                  src={thumbnailFor(photo.unsplashId, 96)}
                  alt=""
                  width="40"
                  height="40"
                  loading="lazy"
                  className="size-10 shrink-0 rounded bg-paper object-cover"
                />
                <span className="min-w-0 flex-1 truncate font-semibold">{photo.title}</span>
                <span className="shrink-0 font-mono text-xs text-ink-soft tabular-nums">
                  ★ {photo.shortlistCount} · {photo.bookingCount} {photo.bookingCount === 1 ? "booking" : "bookings"}
                </span>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-xs text-ink-soft">
          ★ = saved in a signed-in visitor's shortlist. Guests' stars stay in their browser until they sign in or book.
        </p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-soft">
          {photos.length} {photos.length === 1 ? "photo" : "photos"}, in gallery order. The top one is the first tile.
        </p>
        {editing === null && (
          <button
            type="button"
            onClick={() => {
              setEditing("new");
              setNotice("");
            }}
            className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-ink transition-colors hover:bg-ink hover:text-paper"
          >
            + Add a photo
          </button>
        )}
      </div>

      <p role="status" aria-live="polite" className="rounded border border-line bg-paper-raised px-3 py-2 text-sm empty:hidden">
        {notice}
      </p>

      {editing === "new" && <PhotoEditor photo={null} onSave={savePhoto} onCancel={() => setEditing(null)} />}

      <ol className="flex flex-col gap-3">
        {photos.map((photo, index) =>
          editing !== null && editing !== "new" && editing.id === photo.id ? (
            <li key={photo.id}>
              <PhotoEditor photo={photo} onSave={savePhoto} onCancel={() => setEditing(null)} />
            </li>
          ) : (
            <li
              key={photo.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded border border-line bg-paper-raised p-3"
            >
              <span className="w-6 text-right font-mono text-sm text-ink-soft tabular-nums">{index + 1}</span>
              <img
                src={thumbnailFor(photo.unsplashId)}
                alt=""
                width="64"
                height="64"
                loading="lazy"
                className="size-16 shrink-0 rounded bg-paper object-cover"
              />
              <div className="min-w-0 flex-1 basis-48">
                <p className="truncate font-semibold">{photo.title}</p>
                <p className="font-mono text-xs text-ink-soft">
                  {labelFor(photoCategories, photo.category)} · {labelFor(photoShapes, photo.shape)} · {photo.credit}
                </p>
                <p className="font-mono text-xs text-ink-soft tabular-nums">
                  ★ {photo.shortlistCount} saved · in {photo.bookingCount} {photo.bookingCount === 1 ? "booking" : "bookings"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(photo, "up")}
                  aria-label={`Move ${photo.title} up`}
                  className={smallButton}
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === photos.length - 1}
                  onClick={() => move(photo, "down")}
                  aria-label={`Move ${photo.title} down`}
                  className={smallButton}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(photo);
                    setNotice("");
                  }}
                  className={smallButton}
                >
                  Edit
                </button>
                <ConfirmButton onConfirm={() => remove(photo)} />
              </div>
            </li>
          )
        )}
      </ol>
    </div>
  );
}

export default AdminPhotos;
