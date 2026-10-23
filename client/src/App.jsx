import { useEffect, useState } from "react";
import About from "./components/About.jsx";
import AuthDialog from "./components/AuthDialog.jsx";
import BookingForm from "./components/BookingForm.jsx";
import Footer from "./components/Footer.jsx";
import Gallery from "./components/Gallery.jsx";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import { api } from "./lib/api.js";
import { getCurrentUser, signOut } from "./lib/auth.js";

function App() {
  // The photos now come from the API (Postgres), not a hardcoded file.
  // status is "loading" until the request finishes, then "ready" or "error".
  const [photos, setPhotos] = useState([]);
  const [photosStatus, setPhotosStatus] = useState("loading");

  // Runs once when the page loads ([] = no dependencies, so never again).
  useEffect(() => {
    api("/api/photos")
      .then((rows) => {
        setPhotos(rows);
        setPhotosStatus("ready");
      })
      .catch(() => setPhotosStatus("error"));
  }, []);

  // Who is signed in (null = nobody). On page load we ask the server; the
  // session cookie is sent along, so a refresh keeps you signed in.
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  function handleSignedIn(signedInUser) {
    setUser(signedInUser);
    setAuthOpen(false);
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
  }

  // The shortlist lives here (not in Gallery) so it survives filter changes
  // and can be shared with the header and booking form. It holds photo ids.
  const [shortlist, setShortlist] = useState([]);

  function setShortlisted(id, isShortlisted) {
    setShortlist((prev) =>
      isShortlisted ? [...prev, id] : prev.filter((x) => x !== id)
    );
  }

  // Derived, not stored: the titles always match whatever is in the shortlist.
  const shortlistedTitles = photos
    .filter((photo) => shortlist.includes(photo.id))
    .map((photo) => photo.title);

  return (
    <>
      <Header
        shortlistCount={shortlist.length}
        user={user}
        onSignInClick={() => setAuthOpen(true)}
        onSignOutClick={handleSignOut}
      />
      <main id="main">
        <Hero />
        <Gallery
          photos={photos}
          status={photosStatus}
          shortlist={shortlist}
          onShortlistChange={setShortlisted}
        />
        <About />
        <BookingForm
          shortlistedTitles={shortlistedTitles}
          onClearShortlist={() => setShortlist([])}
        />
      </main>
      <Footer />
      <AuthDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSignedIn={handleSignedIn}
      />
    </>
  );
}

export default App;
