/**
 * Auth routes — login & register.
 * Sprint 0: stubs returning 501.
 */

const { Router } = require("express");
const router = Router();

router.post("/login", (_req, res) => {
  res.status(501).json({ error: "Not implemented — Sprint 1" });
});

router.post("/register", (_req, res) => {
  res.status(501).json({ error: "Not implemented — Sprint 1" });
});

module.exports = router;
