// Load variables from server/.env into process.env (on Render they come from the dashboard instead).
import "dotenv/config";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import photosRouter from "./routes/photos.js";
import shortlistRouter from "./routes/shortlist.js";
import meRouter from "./routes/me.js";
import bookingsRouter from "./routes/bookings.js";
import adminPhotosRouter from "./routes/admin/photos.js";
import adminBookingsRouter from "./routes/admin/bookings.js";
import requireAdmin from "./middleware/requireAdmin.js";

const app = express();
const port = process.env.PORT || 3000;

// Render (and Vercel in front of it) sit between the browser and us.
// Trusting the proxy lets Express see the real protocol (https) and client IP.
app.set("trust proxy", true);

// Better Auth answers every /api/auth/* request itself:
//   POST /api/auth/sign-up/email   create an account and sign in
//   POST /api/auth/sign-in/email   sign in
//   POST /api/auth/sign-out        sign out
//   GET  /api/auth/get-session     who is signed in (null if nobody)
// It must come BEFORE express.json(), because it reads the request body itself.
app.all("/api/auth/*splat", toNodeHandler(auth));

// Parse JSON request bodies for our own routes (e.g. shortlist updates).
// 100kb is plenty for a booking or a photo's details.
app.use(express.json({ limit: "100kb" }));

// A tiny route to check the server is up. Render also uses it as a health check.
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/photos", photosRouter);
app.use("/api/shortlist", shortlistRouter); // signed-in users only
app.use("/api/me", meRouter);
app.use("/api/bookings", bookingsRouter); // anyone can send a booking request

// Admin panel routes. requireAdmin answers 401 (not signed in) or 403 (not on
// the ADMIN_EMAILS list) before any of these run.
app.use("/api/admin/photos", requireAdmin, adminPhotosRouter);
app.use("/api/admin/bookings", requireAdmin, adminBookingsRouter);

// Anything that throws ends up here: log it, send a plain JSON error.
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
