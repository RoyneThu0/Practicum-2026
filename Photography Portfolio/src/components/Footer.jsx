import Container from "./Container.jsx";

function Footer() {
  return (
    <footer className="border-t border-line">
      <Container className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-6 text-sm text-ink-soft">
        <p>© 2026 Practicum Photography</p>
        <a
          href="#top"
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 font-semibold text-ink no-underline transition-colors hover:border-accent hover:bg-accent hover:text-accent-ink"
        >
          Back to top <span aria-hidden="true">↑</span>
        </a>
      </Container>
    </footer>
  );
}

export default Footer;
