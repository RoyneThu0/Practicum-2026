import Container from "./Container.jsx";

function Hero() {
  return (
    <section id="top" aria-labelledby="page-title" className="scroll-mt-16 pt-10 pb-7">
      <Container className="flex flex-col gap-6">
        <h1
          id="page-title"
          className="min-w-0 font-display text-5xl leading-none tracking-tight text-balance"
        >
          Landscapes from the Rift to the <em className="text-accent">coast</em>
        </h1>
        <p className="min-w-0 text-[1.05rem] text-ink-soft">
          Practicum Photography works in open country at the edges of the day:
          first light on the escarpment, storms crossing the plains, the blue
          hour over still water.
        </p>
      </Container>
    </section>
  );
}

export default Hero;
