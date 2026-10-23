import { useEffect, useRef, useState } from "react";
import { signIn, signUp } from "../lib/auth.js";
import FormField, { inputClass } from "./FormField.jsx";

// A popup with the sign-in / create-account form.
// Uses the browser's own <dialog> element: showModal() gives us the dark
// backdrop, focus trapping and closing with Esc for free.
//
// Props:
//   open       whether the dialog should be showing (App owns this)
//   onClose()  called when the person closes it
//   onSignedIn(user)  called with the user after a successful sign in/up
function AuthDialog({ open, onClose, onSignedIn }) {
  const dialogRef = useRef(null);
  const [mode, setMode] = useState("signin"); // "signin" or "signup"
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Keep the real <dialog> in step with the open prop.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const isSignup = mode === "signup";

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setBusy(true);

    try {
      const details = {
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      };
      const user = isSignup ? await signUp(details) : await signIn(details);
      event.target.reset();
      onSignedIn(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function switchMode() {
    setMode(isSignup ? "signin" : "signup");
    setError("");
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="auth-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded border border-line bg-paper-raised p-0 text-ink backdrop:bg-scrim"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 id="auth-title" className="font-display text-4xl leading-none">
            {isSignup ? "Create an account" : "Sign in"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 rounded px-2 text-2xl leading-none text-ink-soft hover:text-ink"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-ink-soft">
          Signed in, your shortlist is saved to your account and is still there next time.
        </p>

        {isSignup && (
          <FormField id="auth-name" label="Name">
            <input id="auth-name" name="name" type="text" autoComplete="name" required className={inputClass} />
          </FormField>
        )}

        <FormField id="auth-email" label="Email">
          <input id="auth-email" name="email" type="email" autoComplete="email" required className={inputClass} />
        </FormField>

        <FormField id="auth-password" label="Password">
          <input
            id="auth-password"
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={8}
            required
            className={inputClass}
          />
        </FormField>

        <p role="alert" className="text-sm font-semibold text-red-700 empty:hidden dark:text-red-300">
          {error}
        </p>

        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-accent px-6 py-3 font-bold text-accent-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-60"
        >
          {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
        </button>

        <p className="text-center text-sm">
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <button type="button" onClick={switchMode} className="font-semibold text-accent underline underline-offset-2">
            {isSignup ? "Sign in" : "Create an account"}
          </button>
        </p>
      </form>
    </dialog>
  );
}

export default AuthDialog;
