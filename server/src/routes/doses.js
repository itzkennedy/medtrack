/**
 * Doses routes — log dose status (taken / skipped / snoozed).
 * Sprint 0: stubs returning 501.
 */

const { Router } = require("express");
const router = Router();

router.get("/today", (_req, res) => {
  res.status(501).json({ error: "Not implemented — Sprint 2" });
});

router.post("/", (_req, res) => {
  res.status(501).json({ error: "Not implemented — Sprint 2" });
});

module.exports = router;
