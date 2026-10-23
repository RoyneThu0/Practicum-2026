import { isAdmin } from "../lib/admins.js";
import requireAuth from "./requireAuth.js";

// Put this in front of admin-only routes.
// First requireAuth checks there is a signed-in user (401 if not) and sets
// req.user. Then we check that user's email is on the admin list (403 if not).
export default function requireAdmin(req, res, next) {
  requireAuth(req, res, (error) => {
    if (error) return next(error);
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: "Admins only" });
    }
    next();
  });
}
