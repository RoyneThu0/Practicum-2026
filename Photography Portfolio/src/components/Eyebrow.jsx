// The small monospace label above a section heading ("About", "Book a shoot").
function Eyebrow({ children }) {
  return (
    <p className="mb-3 font-mono text-xs tracking-[0.12em] text-ink-soft uppercase">
      {children}
    </p>
  );
}

export default Eyebrow;
