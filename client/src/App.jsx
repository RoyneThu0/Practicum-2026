import { useEffect, useState } from "react";
import About from "./components/About.jsx";
import AuthDialog from "./components/AuthDialog.jsx";
import BookingForm from "./components/BookingForm.jsx";
import Footer from "./components/Footer.jsx";
import Gallery from "./components/Gallery.jsx";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import AdminPage from "./components/admin/AdminPage.jsx";
import { api } from "./lib/api.js";
import { getMe, signOut } from "./lib/auth.js";
import { clearSharedShortlistFromUrl, readSharedShortlist } from "./lib/shareLink.js";

// The site has two pages: the portfolio at / and the admin panel at /admin.
// A plain path check is enough for two pages, so there's no router library.
// (Vercel serves index.html for /admin too; see client/vercel.json.)
const isAdminPage = window.location.pathname.replace(/\/+$/, "") === "/admin";

// A shared shortlist link (?shortlist=1,5,8) is read once, when the page loads.
const sharedIds = isAdminPage ? [] : readSharedShortlist();
clearSharedShortlistFromUrl();

function App() {
  // The photos now come from the API (Postgres), not a hardcoded file.
  // status is "loading" until the request finishes, then "ready" or "error".
  const [photos, setPhotos] = useState([]);
  const [photosStatus, setPhotosStatus] = useState("loading");

  // The shortlist lives here (not in Gallery) so it survives filter changes
  // and can be shared with the header and booking form. It holds photo ids.
  // A shared link starts it off with the shared photos.
  const [shortlist, setShortlist] = useState(sharedIds);

  // Upcoming days the studio isn't available, for the booking form's date check.
  const [blockedDates, setBlockedDates] = useState([]);

  // Runs once when the page loads ([] = no dependencies, so never again).
  // The admin panel loads its own copy of the photos, so it skips this.
  useEffect(() => {
    if (isAdminPage) return;
    api("/api/photos")
      .then((rows) => {
        setPhotos(rows);
        setPhotosStatus("ready");
        // Drop shared ids that don't match a photo (deleted, or a mistyped link).
        const realIds = new Set(rows.map((photo) => photo.id));
        setShortlist((prev) => prev.filter((id) => realIds.has(id)));
      })
      .catch(() => setPhotosStatus("error"));

    // Upcoming unavailable days, so the booking form can warn before sending.
    api("/api/availability")
      .then((data) => setBlockedDates(data.blockedDates))
      .catch(() => {}); // not fatal: the server still refuses blocked dates
  }, []);

  // Who is signed in (null = nobody). On page load we ask the server; the
  // session cookie is sent along, so a refresh keeps you signed in.
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  // Whether the signed-in user is an admin (the server decides, from ADMIN_EMAILS),
  // and whether we've heard back yet, so /admin doesn't flash "not an admin".
  const [isAdmin, setIsAdmin] = useState(false);
  const [meLoaded, setMeLoaded] = useState(false);

  // Signed in, the shortlist is saved in the shortlists table. Anything starred
  // before signing in (localIds) is saved first, so it isn't lost, then the
  // full saved list is loaded back from the server.
  async function loadSavedShortlist(localIds) {
    try {
      // allSettled: one bad id (say, a deleted photo from an old shared link)
      // shouldn't stop the rest being saved.
      await Promise.allSettled(localIds.map((id) => api(`/api/shortlist/${id}`, { method: "PUT" })));
      setShortlist(await api("/api/shortlist"));
    } catch {
      // Not fatal: the shortlist still works for this visit, it just isn't saved.
    }
  }

  useEffect(() => {
    getMe()
      .then((me) => {
        setUser(me.user);
        setIsAdmin(me.isAdmin);
        // Signed in: merge any shared photos into the saved shortlist.
        if (me.user && !isAdminPage) loadSavedShortlist(sharedIds);
      })
      .catch(() => setUser(null))
      .finally(() => setMeLoaded(true));
  }, []);

  function handleSignedIn(signedInUser) {
    setUser(signedInUser);
    setAuthOpen(false);
    if (!isAdminPage) loadSavedShortlist(shortlist);
    // Ask again so the admin link and panel appear straight away for admins.
    getMe()
      .then((me) => setIsAdmin(me.isAdmin))
      .catch(() => setIsAdmin(false));
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
    setIsAdmin(false);
    setShortlist([]); // it belongs to the account that just signed out
  }

  // Update the screen straight away, then (if signed in) tell the server.
  function setShortlisted(id, isShortlisted) {
    setShortlist((prev) =>
      isShortlisted ? [...prev, id] : prev.filter((x) => x !== id)
    );
    if (user) {
      api(`/api/shortlist/${id}`, { method: isShortlisted ? "PUT" : "DELETE" }).catch(() => {});
    }
  }

  function clearShortlist() {
    setShortlist([]);
    if (user) api("/api/shortlist", { method: "DELETE" }).catch(() => {});
  }

  // Derived, not stored: the titles always match whatever is in the shortlist.
  const shortlistedTitles = photos
    .filter((photo) => shortlist.includes(photo.id))
    .map((photo) => photo.title);

  const authDialog = (
    <AuthDialog
      open={authOpen}
      onClose={() => setAuthOpen(false)}
      onSignedIn={handleSignedIn}
    />
  );

  if (isAdminPage) {
    return (
      <>
        <AdminPage
          me={meLoaded ? { user, isAdmin } : null}
          onSignInClick={() => setAuthOpen(true)}
          onSignOut={handleSignOut}
        />
        {authDialog}
      </>
    );
  }

  return (
    <>
      <Header
        shortlistCount={shortlist.length}
        user={user}
        isAdmin={isAdmin}
        onSignInClick={() => setAuthOpen(true)}
        onSignOutClick={handleSignOut}
      />
      <main id="main">
        <Hero />
        <Gallery
          photos={photos}
          status={photosStatus}
          startOnShortlist={sharedIds.length > 0}
          sharedCount={photosStatus === "ready" ? sharedIds.filter((id) => photos.some((p) => p.id === id)).length : 0}
          shortlist={shortlist}
          onShortlistChange={setShortlisted}
        />
        <About />
        <BookingForm
          user={user}
          blockedDates={blockedDates}
          shortlist={shortlist}
          shortlistedTitles={shortlistedTitles}
          onClearShortlist={clearShortlist}
        />
      </main>
      <Footer />
      {authDialog}
    </>
  );
}

export default App;
