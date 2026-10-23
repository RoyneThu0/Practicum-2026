// Better Auth: handles signup, login, logout and sessions for us.
// It stores users and sessions in our Neon database (through the same pg pool
// as everything else), and keeps people signed in with an httpOnly cookie.
// Its tables (user, session, account, verification) are created by
// src/db/migrations/002_auth.sql.
import { betterAuth } from "better-auth";
import pool from "./db/pool.js";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not set. Copy server/.env.example to server/.env and fill it in.");
}

export const auth = betterAuth({
  database: pool,

  // Signs and checks the session cookie. Read from process.env by name, but
  // passed explicitly so it's obvious where it comes from.
  secret: process.env.BETTER_AUTH_SECRET,

  // The public address of the site. In production that's the Vercel URL:
  // Vercel forwards /api/* to Render, so the browser only ever talks to one
  // origin and the session cookie is a normal first-party cookie.
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.BETTER_AUTH_URL],

  // Email + password signup and login. Passwords are hashed (scrypt) before
  // they are stored; the plain password never reaches the database.
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  // Sessions last 30 days and are refreshed once a day while you keep using
  // the site. They live in the session table, so they survive a page refresh
  // and a server restart.
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
});
