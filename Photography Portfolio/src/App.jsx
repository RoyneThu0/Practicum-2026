import { useState } from "react";
import About from "./components/About.jsx";
import BookingForm from "./components/BookingForm.jsx";
import Footer from "./components/Footer.jsx";
import Gallery from "./components/Gallery.jsx";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";

function App() {
  // The shortlist lives here (not in Gallery) so it survives filter changes
  // and can be shared with the header and booking form. It holds photo ids.
  const [shortlist, setShortlist] = useState([]);

  function setShortlisted(id, isShortlisted) {
    setShortlist((prev) =>
      isShortlisted ? [...prev, id] : prev.filter((x) => x !== id)
    );
  }

  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <Gallery shortlist={shortlist} onShortlistChange={setShortlisted} />
        <About />
        <BookingForm />
      </main>
      <Footer />
    </>
  );
}

export default App;
