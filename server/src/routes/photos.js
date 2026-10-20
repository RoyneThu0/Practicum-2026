import { Router } from "express";
import pool from "../db/pool.js";

const router = Router();

// GET /api/photos -> every photo, in gallery order, as JSON.
// Column names are snake_case in Postgres; the response uses the same
// camelCase keys the React components already expect (unsplashId, ...).
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, alt, category, shape,
              unsplash_id AS "unsplashId", credit, link
         FROM photos
        ORDER BY sort_order, id`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

export default router;
