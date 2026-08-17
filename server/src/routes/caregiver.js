/**
 * Caregiver routes — link management + read-only patient data.
 * Sprint 0: stubs returning 501.
 */

const { Router } = require("express");
const router = Router();

router.get("/patients", (_req, res) => {
  res.status(501).json({ error: "Not implemented — Sprint 3" });
});

router.post("/invite", (_req, res) => {
  res.status(501).json({ error: "Not implemented — Sprint 3" });
});

router.post("/accept/:linkId", (_req, res) => {
  res.status(501).json({ error: "Not implemented — Sprint 3" });
});

module.exports = router;
