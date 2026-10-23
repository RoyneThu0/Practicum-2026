import { Router } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";
import { isAdmin } from "../lib/admins.js";

const router = Router();

// GET /api/me -> { user, isAdmin }. user is null when nobody is signed in.
// The client uses isAdmin to decide whether to show the admin panel link.
// (The admin routes check again on the server, so hiding the link is only
// for tidiness, not for security.)
router.get("/", async (req, res, next) => {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const user = session?.user ?? null;
    res.json({ user, isAdmin: isAdmin(user) });
  } catch (error) {
    next(error);
  }
});

export default router;
