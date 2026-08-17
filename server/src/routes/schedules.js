/**
 * Schedules routes — time-of-day schedules per medication.
 * Sprint 0: stubs returning 501.
 */

const { Router } = require("express");
const router = Router();

router.get("/", (_req, res) => {
  res.status(501).json({ error: "Not implemented — Sprint 1" });
});

router.post("/", (_req, res) => {
  res.status(501).json({ error: "Not implemented — Sprint 1" });
});

module.exports = router;
