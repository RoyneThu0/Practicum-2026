// Thin wrappers around Better Auth's endpoints on our server (/api/auth/*).
// Plain fetch, no client library: each function is one request you can point at.
// On success Better Auth sets (or clears) an httpOnly session cookie; JavaScript
// never sees the session token, the browser just sends the cookie back.
import { api } from "./api.js";

// Who is signed in? Returns the user object, or null if nobody is.
// Called when the page loads, which is why a refresh keeps you signed in.
export async function getCurrentUser() {
  const data = await api("/api/auth/get-session");
  return data?.user ?? null;
}

export async function signUp({ name, email, password }) {
  const data = await api("/api/auth/sign-up/email", {
    method: "POST",
    body: { name, email, password },
  });
  return data.user;
}

export async function signIn({ email, password }) {
  const data = await api("/api/auth/sign-in/email", {
    method: "POST",
    body: { email, password },
  });
  return data.user;
}

export async function signOut() {
  await api("/api/auth/sign-out", { method: "POST", body: {} });
}
