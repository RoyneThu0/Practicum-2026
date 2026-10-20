// Creates or updates the database tables by running every .sql file in
// src/db/migrations in name order (001_, 002_, ...). Each file uses
// IF NOT EXISTS, so running this again is safe.
import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import pool from "./pool.js";

const dir = new URL("./migrations/", import.meta.url);
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  const sql = await readFile(new URL(file, dir), "utf8");
  await pool.query(sql);
  console.log(`ran ${file}`);
}

await pool.end();
