import { Router } from "express";
import pool from "../../db/pool.js";
import { isIsoDate, today } from "../../lib/dates.js";

const router = Router();

// The longest range that can be blocked in one go, to catch typos like 2062.
const maxDays = 366;

async function listBlockedDates() {
  const { rows } = await pool.query(
    `SELECT to_char(day, 'YYYY-MM-DD') AS day, note FROM blocked_dates
      WHERE day >= ${today} ORDER BY day`
  );
  return rows;
}

// GET /api/admin/blocked-dates -> upcoming blocked days with their private notes.
// Past days are kept in the table but not listed; they no longer matter.
router.get("/", async (req, res, next) => {
  try {
    res.json(await listBlockedDates());
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/blocked-dates { from, to?, note? }
// Blocks one day, or every day from `from` to `to`. Blocking a day that's
// already blocked just updates its note. Answers with the full upcoming list.
router.post("/", async (req, res, next) => {
  const { from, note = "" } = req.body ?? {};
  const to = req.body?.to || from;
  const errors = {};

  if (!isIsoDate(from)) errors.from = "Choose a start date";
  if (!isIsoDate(to)) errors.to = "Use a real end date";
  else if (isIsoDate(from) && to < from) errors.to = "The end date must be on or after the start date";
  if (typeof note !== "string" || note.length > 200) errors.note = "Keep the note under 200 characters";
  if (!errors.from && !errors.to) {
    const days = (new Date(to) - new Date(from)) / 86400000 + 1;
    if (days > maxDays) errors.to = `Block at most ${maxDays} days at a time`;
  }
  if (Object.keys(errors).length) return res.status(400).json({ error: "Check the highlighted fields", errors });

  try {
    // generate_series makes one row per day in the range.
    await pool.query(
      `INSERT INTO blocked_dates (day, note)
       SELECT d::date, $3 FROM generate_series($1::date, $2::date, interval '1 day') AS d
       ON CONFLICT (day) DO UPDATE SET note = EXCLUDED.note`,
      [from, to, note.trim()]
    );
    res.status(201).json(await listBlockedDates());
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/blocked-dates/:day -> make that day available again.
router.delete("/:day", async (req, res, next) => {
  if (!isIsoDate(req.params.day)) return res.status(400).json({ error: "day must be YYYY-MM-DD" });
  try {
    await pool.query("DELETE FROM blocked_dates WHERE day = $1", [req.params.day]);
    res.json(await listBlockedDates());
  } catch (error) {
    next(error);
  }
});

export default router;
