import Container from "./Container.jsx";
import ProfileMenu from "./ProfileMenu.jsx";

const navLinks = [
  { href: "#work", label: "Work" },
  { href: "#about", label: "About" },
];

// user: the signed-in user, or null. The header only shows it; App decides.
// Signed in -> ProfileMenu (far left) with Sign out inside. Signed out -> a Sign in button in the nav.
function Header({ shortlistCount = 0, user, onSignInClick, onSignOutClick }) {
  return (
    <>
      <a
        href="#main"
        className="absolute -top-12 left-4 z-20 rounded bg-ink px-3.5 py-2 text-paper focus:top-3"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur-md">
        <Container className="flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-2 py-2.5 sm:gap-x-10">
          {/* Signed in: the profile menu sits at the far left, before the brand. */}
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {user && <ProfileMenu user={user} onSignOut={onSignOutClick} />}
            <a href="#top" className="font-display text-2xl leading-none no-underline sm:text-[1.65rem]">
              Practicum Photography
            </a>
          </div>

          <nav aria-label="Main">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 sm:gap-x-6">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="border-b border-transparent py-1.5 text-sm font-semibold transition-colors hover:border-current"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="#book"
                  className="border-b border-transparent py-1.5 text-sm font-semibold transition-colors hover:border-current"
                >
                  Shortlist ({shortlistCount})
                </a>
              </li>
              {!user && (
                <li>
                  <button
                    type="button"
                    onClick={onSignInClick}
                    className="border-b border-transparent py-1.5 text-sm font-semibold transition-colors hover:border-current"
                  >
                    Sign in
                  </button>
                </li>
              )}
              <li>
                <a
                  href="#book"
                  className="rounded-full bg-accent px-3.5 py-2 text-sm font-semibold text-accent-ink transition-colors hover:bg-ink hover:text-paper"
                >
                  Book a shoot
                </a>
              </li>
            </ul>
          </nav>
        </Container>
      </header>
    </>
  );
}

export default Header;
