import photos from "../data/photos.js";
import Container from "./Container.jsx";
import PhotoTile from "./PhotoTile.jsx";

function Gallery() {
  return (
    <section id="work" aria-labelledby="work-title" className="scroll-mt-16 pb-12">
      <Container>
        <h2 id="work-title" className="sr-only">
          Selected work
        </h2>

        <ul className="grid grid-flow-dense auto-rows-[14rem] grid-cols-1 gap-2">
          {photos.map((photo, index) => (
            <PhotoTile key={photo.id} photo={photo} eager={index === 0} />
          ))}
        </ul>
      </Container>
    </section>
  );
}

export default Gallery;
