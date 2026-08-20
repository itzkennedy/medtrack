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

async function resolvePatientId(req) {
  const patientId = req.query.patient_id;

  if (!patientId) {
    if (req.user.role !== "patient") {
      return { error: "patient_id is required for caregiver access", status: 400 };
    }
    return { userId: req.user.user_id };
  }

  if (req.user.role !== "caregiver") {
    return { error: "patient_id parameter is not allowed for patients", status: 400 };
  }

  const { rows } = await db.query(
    `SELECT link_id FROM caregiver_link
     WHERE patient_id = $1 AND caregiver_id = $2 AND status = 'accepted'`,
    [patientId, req.user.user_id]
  );

  if (rows.length === 0) {
    return { error: "You are not linked to this patient", status: 403 };
  }

  return { userId: parseInt(patientId) };
}

router.get("/today", authenticate, async (req, res) => {
  try {
    const target = await resolvePatientId(req);
    if (target.error) return res.status(target.status).json({ error: target.error });

    const { rows: schedules } = await db.query(
      `SELECT s.schedule_id, m.medication_id, m.name AS medication_name, m.dosage,
              m.start_date::text AS start_date, s.time_of_day, s.days_of_week
       FROM schedule s
       JOIN medication m ON s.medication_id = m.medication_id
       WHERE m.user_id = $1
       ORDER BY s.time_of_day`,
      [target.userId]
    );

    const scheduleIds = schedules.map((s) => s.schedule_id);
    let logs = [];
    if (scheduleIds.length > 0) {
      const logResult = await db.query(
        `SELECT schedule_id, status, log_id, logged_at
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

    let adherenceMap = {};
    if (scheduleIds.length > 0) {
      const { rows: recentLogs } = await db.query(
        `SELECT al.schedule_id, al.status, al.logged_at::date::text AS log_date
         FROM adherence_log al
         WHERE al.schedule_id = ANY($1::int[])
           AND al.logged_at >= CURRENT_DATE - INTERVAL '365 days'`,
        [scheduleIds]
      );
      const logBySchedule = {};
      for (const rl of recentLogs) {
        if (!logBySchedule[rl.schedule_id]) logBySchedule[rl.schedule_id] = {};
        logBySchedule[rl.schedule_id][rl.log_date] = rl.status;
      }

      function countOccurrences(daysOfWeek, startDate, limit) {
        const today = new Date();
        const medStart = startDate ? new Date(startDate + "T00:00:00") : null;
        const occurrences = [];
        for (let i = 0; i < 365 && occurrences.length < limit; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          if (medStart && date < medStart) break;
          if (!isScheduleActiveOnDay(daysOfWeek, DAY_NAMES[date.getDay()])) continue;
          occurrences.push(formatDate(date));
        }
        return occurrences;
      }

      for (const s of schedules) {
        const occurrences = countOccurrences(s.days_of_week, s.start_date, 30);
        const taken = occurrences.filter((d) => logBySchedule[s.schedule_id]?.[d] === "taken").length;

        adherenceMap[s.schedule_id] = {
          adherence: occurrences.length === 0 ? null : Math.round((taken / occurrences.length) * 100),
          adherence_count: occurrences.length,
        };
      }
    }

    const today2 = new Date();
    const dayAbbr = DAY_NAMES[today2.getDay()];

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
        logged_at: logMap[s.schedule_id]?.logged_at || null,
        adherence: adherenceMap[s.schedule_id]?.adherence ?? null,
        adherence_count: adherenceMap[s.schedule_id]?.adherence_count ?? null,
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

router.get("/adherence", authenticate, async (req, res) => {
  try {
    const target = await resolvePatientId(req);
    if (target.error) return res.status(target.status).json({ error: target.error });

    const { rows: schedules } = await db.query(
      `SELECT s.schedule_id, s.days_of_week
       FROM schedule s
       JOIN medication m ON s.medication_id = m.medication_id
       WHERE m.user_id = $1`,
      [target.userId]
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
      [target.userId]
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
        if (!allTaken) {
          if (i === 0) continue;
          break;
        }
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

router.get("/history", authenticate, async (req, res) => {
  try {
    const target = await resolvePatientId(req);
    if (target.error) return res.status(target.status).json({ error: target.error });

    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);

    const { rows: history } = await db.query(
      `SELECT al.log_id, al.status, al.logged_at,
              m.name AS medication_name, m.dosage,
              s.time_of_day, s.days_of_week
       FROM adherence_log al
       JOIN schedule s ON al.schedule_id = s.schedule_id
       JOIN medication m ON s.medication_id = m.medication_id
       WHERE m.user_id = $1 AND al.logged_at >= CURRENT_DATE - ($2 || ' days')::interval
       ORDER BY al.logged_at DESC`,
      [target.userId, String(days)]
    );

    const result = history.map((row) => ({
      log_id: row.log_id,
      medication_name: row.medication_name,
      dosage: row.dosage,
      status: row.status,
      scheduled_time: formatTime(row.time_of_day),
      logged_at: row.logged_at,
      date: row.logged_at.toISOString().slice(0, 10),
    }));

    res.json(result);
  } catch (err) {
    console.error("Get dose history error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
