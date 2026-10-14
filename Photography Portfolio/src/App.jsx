import About from "./components/About.jsx";
import Gallery from "./components/Gallery.jsx";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";

function App() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <Gallery />
        <About />
      </main>
    </>
  );
}

export default App;
