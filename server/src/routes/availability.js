import { Router } from "express";
import pool from "../db/pool.js";
import { today } from "../lib/dates.js";

const router = Router();

// GET /api/availability -> { blockedDates: ["2026-12-12", ...] }
// Upcoming unavailable days, for the booking form. Only the dates go out;
// the private notes stay in the admin panel.
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT to_char(day, 'YYYY-MM-DD') AS day FROM blocked_dates
        WHERE day >= ${today} ORDER BY day`
    );
    res.json({ blockedDates: rows.map((row) => row.day) });
  } catch (error) {
    next(error);
  }
});

export default router;
