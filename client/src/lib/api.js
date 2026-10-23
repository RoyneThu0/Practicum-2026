// Every call to our own backend goes through this one helper.
// Paths start with /api, which is the same site the page came from:
//   - in development, Vite forwards /api to the Express server (vite.config.js)
//   - on Vercel, vercel.json forwards /api to the Render server
// Because it's the same site, the browser sends the session cookie automatically.

export async function api(path, { method = "GET", body } = {}) {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  // 204 No Content: success with nothing to read.
  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Better Auth sends { message }, our routes send { error }.
    const message = data?.message || data?.error || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    // Form routes also send { errors: { field: "message" } }; forms show them per field.
    error.fields = data?.errors;
    throw error;
  }

  return data;
}
