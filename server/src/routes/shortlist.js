import { Router } from "express";
import pool from "../db/pool.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

// Every shortlist route needs a signed-in user; requireAuth sets req.user.
router.use(requireAuth);

// GET /api/shortlist -> the signed-in user's shortlisted photo ids, e.g. [1, 4]
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT photo_id FROM shortlists WHERE user_id = $1 ORDER BY created_at",
      [req.user.id]
    );
    res.json(rows.map((row) => row.photo_id));
  } catch (error) {
    next(error);
  }
});

// PUT /api/shortlist/:photoId -> add a photo (doing it twice is harmless)
router.put("/:photoId", async (req, res, next) => {
  const photoId = Number(req.params.photoId);
  if (!Number.isInteger(photoId)) {
    return res.status(400).json({ error: "photoId must be a number" });
  }

  try {
    await pool.query(
      `INSERT INTO shortlists (user_id, photo_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [req.user.id, photoId]
    );
    res.status(204).end();
  } catch (error) {
    // 23503 = foreign key violation: there's no photo with that id.
    if (error.code === "23503") {
      return res.status(404).json({ error: "No photo with that id" });
    }
    next(error);
  }
});

// DELETE /api/shortlist/:photoId -> remove one photo
router.delete("/:photoId", async (req, res, next) => {
  try {
    await pool.query(
      "DELETE FROM shortlists WHERE user_id = $1 AND photo_id = $2",
      [req.user.id, Number(req.params.photoId)]
    );
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// DELETE /api/shortlist -> clear the whole shortlist
router.delete("/", async (req, res, next) => {
  try {
    await pool.query("DELETE FROM shortlists WHERE user_id = $1", [req.user.id]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
