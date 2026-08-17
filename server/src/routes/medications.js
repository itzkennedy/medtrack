/**
 * Medications routes — CRUD for medications.
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

router.put("/:id", (_req, res) => {
  res.status(501).json({ error: "Not implemented — Sprint 1" });
});

router.delete("/:id", (_req, res) => {
  res.status(501).json({ error: "Not implemented — Sprint 1" });
});

module.exports = router;
