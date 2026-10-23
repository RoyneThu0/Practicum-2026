import { useState } from "react";

// A delete button that asks before acting. The first click swaps it for
// "Delete? Yes / No" right where it was, so nothing is removed by a slip.
// (The page can't use window.confirm: it's blocked in some browsers' frames
// and it's jarring anyway.)
function ConfirmButton({ label = "Delete", confirmLabel = "Yes, delete", onConfirm, disabled }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      setAsking(false);
    }
  }

  if (!asking) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAsking(true)}
        className="rounded-full border border-line px-3 py-1 text-sm font-semibold text-red-700 transition-colors hover:border-red-700 disabled:opacity-50 dark:text-red-300 dark:hover:border-red-300"
      >
        {label}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        disabled={busy}
        onClick={confirm}
        className="rounded-full bg-red-700 px-3 py-1 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60 dark:bg-red-400 dark:text-black"
      >
        {busy ? "Deleting…" : confirmLabel}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => setAsking(false)}
        className="rounded-full border border-line px-3 py-1 text-sm font-semibold hover:border-ink"
      >
        Cancel
      </button>
    </span>
  );
}

export default ConfirmButton;
