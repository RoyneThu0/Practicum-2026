// Shareable shortlist links: https://site/?shortlist=1,5,8#work
// Anyone opening one sees those photos starred, so a client can send a mood
// board to a partner, who can then add to it or book with it.

// The photo ids in the current address, e.g. [1, 5, 8], or [] if there are none.
// Anything that isn't a whole number is ignored.
export function readSharedShortlist() {
  const value = new URLSearchParams(window.location.search).get("shortlist") ?? "";
  const ids = value.split(",").map(Number).filter((id) => Number.isInteger(id) && id > 0);
  return [...new Set(ids)];
}

// Take ?shortlist=… back out of the address bar once it's been read, so a
// refresh or a bookmark doesn't keep re-adding those photos.
export function clearSharedShortlistFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("shortlist")) return;
  url.searchParams.delete("shortlist");
  history.replaceState(null, "", url);
}

export function shareLinkFor(ids) {
  const url = new URL("/", window.location.origin);
  url.searchParams.set("shortlist", ids.join(","));
  url.hash = "work";
  // Keep the commas readable in the link instead of %2C.
  return url.toString().replace(/%2C/g, ",");
}
