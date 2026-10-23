import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";

// Put this in front of any route that needs a signed-in user.
// Better Auth reads the session cookie from the request and looks the session
// up in the database. No valid session -> 401. Otherwise the user is saved on
// req.user so the route knows whose data to read or change.
export default async function requireAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ error: "Please sign in first" });
    }

    req.user = session.user;
    next();
  } catch (error) {
    next(error);
  }
}
