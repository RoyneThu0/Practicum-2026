import Container from "./Container.jsx";

const facts = [
  { label: "Based in", value: "Nanyuki, Kenya" },
  { label: "Travels to", value: "East Africa & beyond" },
  { label: "Shooting since", value: "2014" },
];

function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="scroll-mt-16 border-y border-line bg-paper-raised py-12"
    >
      <Container className="flex flex-col gap-6">
        <figure className="min-w-0 max-w-sm">
          <img
            src="https://images.unsplash.com/photo-1768011849411-7c77d8f827c8?auto=format&fit=crop&w=800&h=1000&q=75"
            alt="A photographer holding a camera in a forest"
            width="800"
            height="1000"
            loading="lazy"
            decoding="async"
            className="aspect-4/5 w-full rounded object-cover"
          />
        </figure>

        <div className="min-w-0 max-w-xl">
          <p className="mb-3 font-mono text-xs tracking-[0.12em] text-ink-soft uppercase">About</p>
          <h2 id="about-title" className="font-display text-[2rem] leading-none tracking-tight text-balance">
            Slow pictures of wide places
          </h2>
          <p className="mt-4">
            I'm a landscape photographer based in Nanyuki. I work mostly at dawn
            and dusk, often from the same spot over several visits, and take
            commissions for lodges, conservancies, editorial features and
            fine-art prints.
          </p>

          <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-4 border-t border-line pt-5">
            {facts.map((fact) => (
              <div key={fact.label} className="min-w-0">
                <dt className="font-mono text-[0.7rem] tracking-widest text-ink-soft uppercase">
                  {fact.label}
                </dt>
                <dd className="mt-0.5 font-semibold">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}

export default About;
