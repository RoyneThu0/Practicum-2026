// Load variables from server/.env into process.env (on Railway they come from the dashboard instead).
import "dotenv/config";
import express from "express";

const app = express();
const port = process.env.PORT || 3000;

// Parse JSON request bodies (signup/login forms, shortlist updates).
app.use(express.json());

// A tiny route to check the server is up. Railway also uses it as a health check.
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
