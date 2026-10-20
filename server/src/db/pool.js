import pg from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy server/.env.example to server/.env and fill it in.");
}

// One shared pool of connections to Neon. Every query in the app goes through it.
// The connection string ends in ?sslmode=require, which turns on SSL for Neon.
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

export default pool;
