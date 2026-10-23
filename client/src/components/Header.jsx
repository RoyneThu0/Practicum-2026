import Container from "./Container.jsx";
import ProfileMenu from "./ProfileMenu.jsx";

const navLinks = [
  { href: "#work", label: "Work" },
  { href: "#about", label: "About" },
];

// user: the signed-in user, or null. The header only shows it; App decides.
// Layout: brand and nav links on the left; the far right holds ProfileMenu
// (signed in, with Sign out inside) or a Sign in button (signed out).
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
        <Container className="flex min-h-16 flex-wrap items-center gap-x-4 gap-y-2 py-2.5 sm:gap-x-10">
          <a href="#top" className="font-display text-[1.3rem] leading-none no-underline min-[23rem]:text-2xl sm:text-[1.65rem]">
            Practicum Photography
          </a>

          {/* Below lg the links get their own row under the brand; from lg up they sit right after it. */}
          <nav aria-label="Main" className="order-last w-full lg:order-none lg:w-auto">
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

          {/* Far right: the profile menu when signed in, otherwise Sign in. */}
          <div className="ml-auto">
            {user ? (
              <ProfileMenu user={user} onSignOut={onSignOutClick} />
            ) : (
              <button
                type="button"
                onClick={onSignInClick}
                className="rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold transition-colors hover:border-ink"
              >
                Sign in
              </button>
            )}
          </div>
        </Container>
      </header>
    </>
  );
}

export default Header;
