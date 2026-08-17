/**
 * Express entry point — MedTrack API server.
 * Sprint 0: route stubs only, no business logic.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.js");
const medicationRoutes = require("./routes/medications.js");
const scheduleRoutes = require("./routes/schedules.js");
const doseRoutes = require("./routes/doses.js");
const caregiverRoutes = require("./routes/caregiver.js");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Global middleware ──
app.use(cors());
app.use(express.json());

// ── Health check ──
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", sprint: 0 });
});

// ── Route mounting ──
app.use("/api/auth", authRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/doses", doseRoutes);
app.use("/api/caregiver", caregiverRoutes);

// ── Start ──
app.listen(PORT, () => {
  console.log(`MedTrack API running on http://localhost:${PORT}`);
});
