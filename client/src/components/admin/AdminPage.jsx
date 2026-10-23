import { useCallback, useState } from "react";
import Container from "../Container.jsx";
import ProfileMenu from "../ProfileMenu.jsx";
import AdminBookings from "./AdminBookings.jsx";
import AdminPhotos from "./AdminPhotos.jsx";

const tabs = [
  { id: "bookings", label: "Bookings" },
  { id: "photos", label: "Photos" },
];

// The admin panel at /admin. App renders this instead of the public page.
// Only admins see the tabs; everyone else gets a short explanation.
// The server checks again on every /api/admin request, so this is about
// showing the right screen, not about security.
//
// Props: me = { user, isAdmin } or null while it's still loading.
function AdminPage({ me, onSignInClick, onSignOut }) {
  // Remember the open tab in the address (#photos), so a refresh keeps it.
  const [tab, setTab] = useState(() => (window.location.hash === "#photos" ? "photos" : "bookings"));
  const [newCount, setNewCount] = useState(null);
  const handleCounts = useCallback((count) => setNewCount(count), []);

  function openTab(id) {
    setTab(id);
    history.replaceState(null, "", `#${id}`);
  }

  // Arrow keys move between tabs, the usual keyboard pattern for a tab list.
  function handleTabKeys(event) {
    const index = tabs.findIndex((t) => t.id === tab);
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    const next = tabs[(index + step + tabs.length) % tabs.length];
    openTab(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  }

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur-md">
        <Container className="flex min-h-16 flex-wrap items-center gap-x-6 gap-y-2 py-2.5">
          <a href="/" className="font-display text-[1.3rem] leading-none no-underline sm:text-2xl">
            Practicum Photography
          </a>
          <span className="font-mono text-xs tracking-widest text-ink-soft uppercase">Admin</span>
          <div className="ml-auto flex items-center gap-4">
            <a href="/" className="text-sm font-semibold underline-offset-2 hover:underline">
              ← Back to the site
            </a>
            {me?.user && <ProfileMenu user={me.user} isAdmin={me.isAdmin} onSignOut={onSignOut} />}
          </div>
        </Container>
      </header>

      <main id="main" className="py-10 sm:py-14">
        <Container>
          <h1 className="font-display text-5xl leading-none tracking-tight sm:text-6xl">Admin panel</h1>

          {me === null && <p className="mt-8 text-ink-soft">Checking your account…</p>}

          {me && !me.user && (
            <div className="mt-8 flex max-w-lg flex-col items-start gap-4">
              <p>Sign in with an admin account to manage photos and bookings.</p>
              <button
                type="button"
                onClick={onSignInClick}
                className="rounded-full bg-accent px-5 py-2.5 font-bold text-accent-ink transition-colors hover:bg-ink hover:text-paper"
              >
                Sign in
              </button>
            </div>
          )}

          {me?.user && !me.isAdmin && (
            <p className="mt-8 max-w-lg">
              You're signed in as <strong>{me.user.email}</strong>, which isn't an admin account. Admin emails are set
              in the server's <code className="font-mono text-sm">ADMIN_EMAILS</code> setting.
            </p>
          )}

          {me?.isAdmin && (
            <>
              <div role="tablist" aria-label="Admin sections" onKeyDown={handleTabKeys} className="mt-8 mb-6 flex gap-1 border-b border-line">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    id={`tab-${t.id}`}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    aria-controls={`panel-${t.id}`}
                    tabIndex={tab === t.id ? 0 : -1}
                    onClick={() => openTab(t.id)}
                    className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 font-semibold transition-colors ${
                      tab === t.id ? "border-accent text-ink" : "border-transparent text-ink-soft hover:text-ink"
                    }`}
                  >
                    {t.label}
                    {t.id === "bookings" && newCount > 0 && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-ink">
                        {newCount} new
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Both panels stay mounted so switching tabs doesn't reload them. */}
              <section id="panel-bookings" role="tabpanel" aria-labelledby="tab-bookings" hidden={tab !== "bookings"}>
                <AdminBookings onCountsChange={handleCounts} />
              </section>
              <section id="panel-photos" role="tabpanel" aria-labelledby="tab-photos" hidden={tab !== "photos"}>
                <AdminPhotos />
              </section>
            </>
          )}
        </Container>
      </main>
    </>
  );
}

export default AdminPage;
