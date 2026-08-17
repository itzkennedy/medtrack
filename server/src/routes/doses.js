const { Router } = require("express");
const db = require("../db.js");
const { authenticate, requireRole } = require("../middleware/auth.js");

const router = Router();

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function isScheduleActiveOnDay(daysOfWeek, dayAbbr) {
  if (daysOfWeek === "DAILY") return true;
  if (daysOfWeek === "WEEKDAYS") return ["MON", "TUE", "WED", "THU", "FRI"].includes(dayAbbr);
  return daysOfWeek.split(",").includes(dayAbbr);
}

function formatTime(timeStr) {
  const parts = timeStr.split(":");
  const hour = parseInt(parts[0], 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${String(displayHour).padStart(2, "0")}:${parts[1]} ${ampm}`;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

router.get("/today", authenticate, requireRole("patient"), async (req, res) => {
  try {
    const { rows: schedules } = await db.query(
      `SELECT s.schedule_id, m.name AS medication_name, m.dosage,
              s.time_of_day, s.days_of_week
       FROM schedule s
       JOIN medication m ON s.medication_id = m.medication_id
       WHERE m.user_id = $1
       ORDER BY s.time_of_day`,
      [req.user.user_id]
    );

    const scheduleIds = schedules.map((s) => s.schedule_id);
    let logs = [];
    if (scheduleIds.length > 0) {
      const logResult = await db.query(
        `SELECT schedule_id, status, log_id
         FROM adherence_log
         WHERE schedule_id = ANY($1::int[]) AND logged_at::date = CURRENT_DATE
         ORDER BY logged_at DESC`,
        [scheduleIds]
      );
      logs = logResult.rows;
    }

    const logMap = {};
    for (const log of logs) {
      if (!logMap[log.schedule_id]) {
        logMap[log.schedule_id] = log;
      }
    }

    const today = new Date();
    const dayAbbr = DAY_NAMES[today.getDay()];

    const doses = schedules
      .filter((s) => isScheduleActiveOnDay(s.days_of_week, dayAbbr))
      .map((s) => ({
        schedule_id: s.schedule_id,
        medication_name: s.medication_name,
        dosage: s.dosage,
        time_of_day: formatTime(s.time_of_day),
        days_of_week: s.days_of_week,
        status: logMap[s.schedule_id]?.status || null,
        log_id: logMap[s.schedule_id]?.log_id || null,
      }));

    res.json(doses);
  } catch (err) {
    console.error("Get today doses error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:schedule_id/log", authenticate, requireRole("patient"), async (req, res) => {
  try {
    const { schedule_id } = req.params;
    const { status } = req.body;

    if (!["taken", "skipped", "snoozed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be 'taken', 'skipped', or 'snoozed'" });
    }

    const { rows: found } = await db.query(
      `SELECT s.schedule_id
       FROM schedule s
       JOIN medication m ON s.medication_id = m.medication_id
       WHERE s.schedule_id = $1 AND m.user_id = $2`,
      [schedule_id, req.user.user_id]
    );

    if (found.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const result = await db.query(
      "INSERT INTO adherence_log (schedule_id, status) VALUES ($1, $2) RETURNING log_id",
      [schedule_id, status]
    );

    res.status(201).json({
      log_id: result.rows[0].log_id,
      schedule_id: parseInt(schedule_id),
      status,
    });
  } catch (err) {
    console.error("Log dose error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/adherence", authenticate, requireRole("patient"), async (req, res) => {
  try {
    const { rows: schedules } = await db.query(
      `SELECT s.schedule_id, s.days_of_week
       FROM schedule s
       JOIN medication m ON s.medication_id = m.medication_id
       WHERE m.user_id = $1`,
      [req.user.user_id]
    );

    if (schedules.length === 0) {
      return res.json({ seven_day: 0, thirty_day: 0, streak: 0 });
    }

    const { rows: logs } = await db.query(
      `SELECT al.schedule_id, al.status, al.logged_at::date::text AS log_date
       FROM adherence_log al
       JOIN schedule s ON al.schedule_id = s.schedule_id
       JOIN medication m ON s.medication_id = m.medication_id
       WHERE m.user_id = $1 AND al.logged_at >= CURRENT_DATE - INTERVAL '30 days'`,
      [req.user.user_id]
    );

    const logMap = {};
    for (const log of logs) {
      if (!logMap[log.schedule_id]) logMap[log.schedule_id] = {};
      logMap[log.schedule_id][log.log_date] = log.status;
    }

    function isScheduleActiveOnDate(schedule, date) {
      const dayAbbr = DAY_NAMES[date.getDay()];
      return isScheduleActiveOnDay(schedule.days_of_week, dayAbbr);
    }

    function calculateAdherence(days) {
      let total = 0;
      let taken = 0;
      const today = new Date();

      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = formatDate(date);

        for (const schedule of schedules) {
          if (isScheduleActiveOnDate(schedule, date)) {
            total++;
            if (logMap[schedule.schedule_id]?.[dateStr] === "taken") {
              taken++;
            }
          }
        }
      }

      return total === 0 ? 0 : Math.round((taken / total) * 100);
    }

    function calculateStreak() {
      let streak = 0;
      const today = new Date();

      for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = formatDate(date);

        let hasSchedule = false;
        let allTaken = true;

        for (const schedule of schedules) {
          if (isScheduleActiveOnDate(schedule, date)) {
            hasSchedule = true;
            if (logMap[schedule.schedule_id]?.[dateStr] !== "taken") {
              allTaken = false;
              break;
            }
          }
        }

        if (!hasSchedule) continue;
        if (!allTaken) break;
        streak++;
      }

      return streak;
    }

    res.json({
      seven_day: calculateAdherence(7),
      thirty_day: calculateAdherence(30),
      streak: calculateStreak(),
    });
  } catch (err) {
    console.error("Get adherence error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
