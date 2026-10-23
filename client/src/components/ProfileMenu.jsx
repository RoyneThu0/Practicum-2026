import { useEffect, useRef, useState } from "react";

// The signed-in user's profile button and its dropdown (name, email, an
// "Admin panel" link for admins, Sign out).
// Only the open/closed state lives here; who the user is and what signing out
// does both come from App through props.
function ProfileMenu({ user, isAdmin = false, onSignOut }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // While open, close on a click anywhere outside the menu or on Esc.
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event) {
      if (!menuRef.current.contains(event.target)) setOpen(false);
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const firstName = user.name.split(" ")[0];
  const initial = user.name.trim().charAt(0).toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="profile-menu"
        className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-2.5 text-sm font-semibold transition-colors hover:border-ink"
      >
        <span
          aria-hidden="true"
          className="grid size-7 place-items-center rounded-full bg-accent font-display text-base leading-none text-accent-ink"
        >
          {initial}
        </span>
        <span className="hidden sm:inline">Hi, {firstName}</span>
        <span className="sr-only sm:hidden">Account menu for {firstName}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className={`size-3 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {open && (
        <div
          id="profile-menu"
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-20 mt-2 w-60 rounded border border-line bg-paper-raised p-1.5 shadow-lg"
        >
          <div className="border-b border-line px-3 pb-2.5 pt-2">
            <p className="font-semibold">{user.name}</p>
            <p className="truncate font-mono text-xs text-ink-soft">{user.email}</p>
          </div>
          {isAdmin && (
            <a
              href="/admin"
              role="menuitem"
              className="mt-1 block w-full rounded px-3 py-2 text-left text-sm font-semibold no-underline hover:bg-paper focus-visible:bg-paper"
            >
              Admin panel
            </a>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="mt-1 w-full rounded px-3 py-2 text-left text-sm font-semibold hover:bg-paper focus-visible:bg-paper"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;
