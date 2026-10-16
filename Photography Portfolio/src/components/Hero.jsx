import Container from "./Container.jsx";

function Hero() {
  return (
    <section id="top" aria-labelledby="page-title" className="scroll-mt-16 pt-10 pb-7 sm:pt-16 sm:pb-10 lg:pt-22 lg:pb-12">
      <Container className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <h1
          id="page-title"
          className="min-w-0 font-display text-5xl leading-none tracking-tight text-balance sm:text-7xl lg:flex-1 lg:text-8xl"
        >
          Landscapes from the Rift to the <em className="text-accent">coast</em>
        </h1>
        <p className="min-w-0 text-[1.05rem] text-ink-soft lg:max-w-[22rem] lg:shrink-0">
          Practicum Photography works in open country at the edges of the day:
          first light on the escarpment, storms crossing the plains, the blue
          hour over still water.
        </p>
      </Container>
    </section>
  );
}

export default Hero;
