// Load variables from server/.env into process.env (on Railway they come from the dashboard instead).
import "dotenv/config";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import photosRouter from "./routes/photos.js";
import shortlistRouter from "./routes/shortlist.js";

const app = express();
const port = process.env.PORT || 3000;

// Railway (and Vercel in front of it) sit between the browser and us.
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
app.use(express.json());

// A tiny route to check the server is up. Railway also uses it as a health check.
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/photos", photosRouter);
app.use("/api/shortlist", shortlistRouter); // signed-in users only

// Anything that throws ends up here: log it, send a plain JSON error.
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
