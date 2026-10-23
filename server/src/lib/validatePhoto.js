import { categories, shapes } from "./options.js";

// Checks a photo sent from the admin panel and returns { photo, errors }.
// `photo` holds the cleaned-up values; `errors` maps field name -> message
// and is empty when everything is fine.
//
// The Unsplash field accepts either the bare id ("photo-1761…") or a full
// images.unsplash.com URL pasted from the browser; the id is pulled out of it.
export default function validatePhoto(input = {}) {
  const errors = {};
  const text = (value) => (typeof value === "string" ? value.trim() : "");

  const photo = {
    title: text(input.title),
    alt: text(input.alt),
    category: text(input.category),
    shape: text(input.shape),
    unsplashId: text(input.unsplashId).match(/photo-[A-Za-z0-9-]+/)?.[0] ?? "",
    credit: text(input.credit),
    link: text(input.link),
  };

  if (!photo.title) errors.title = "Give the photo a title";
  else if (photo.title.length > 120) errors.title = "Keep the title under 120 characters";

  if (!photo.alt) errors.alt = "Describe the photo for screen reader users";
  else if (photo.alt.length > 300) errors.alt = "Keep the description under 300 characters";

  if (!categories.includes(photo.category)) errors.category = "Choose a category";
  if (!shapes.includes(photo.shape)) errors.shape = "Choose a tile shape";

  if (!photo.unsplashId) {
    errors.unsplashId = "Paste the photo-… id or the images.unsplash.com address";
  }

  if (!photo.credit) errors.credit = "Add the photographer's name";

  try {
    const url = new URL(photo.link);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
  } catch {
    errors.link = "Paste the photo's page address, starting with https://";
  }

  return { photo, errors };
}
