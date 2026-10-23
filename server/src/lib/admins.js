// Who counts as an admin. Set ADMIN_EMAILS in server/.env (and in the Render
// dashboard) to a comma-separated list, e.g.
//   ADMIN_EMAILS=roynethuo@gmail.com,someone@example.com
// Anyone who signs in with one of those emails gets the admin panel.
// Keeping the list in an environment variable means nobody can make
// themselves an admin from the website: only whoever controls the server can.
const adminEmails = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isAdmin(user) {
  return Boolean(user?.email) && adminEmails.includes(user.email.toLowerCase());
}
