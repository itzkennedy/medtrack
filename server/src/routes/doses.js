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

function parseTimeMinutes(timeStr) {
  const parts = timeStr.split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
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

function getClientDateTime(req) {
  const clientDate = req.query.client_date;
  const clientTime = req.query.client_time;

  let dateStr;
  if (/^\d{4}-\d{2}-\d{2}$/.test(clientDate)) {
    dateStr = clientDate;
  } else {
    dateStr = formatDate(new Date());
  }

  let timeStr;
  if (/^\d{1,2}:\d{2}$/.test(clientTime)) {
    timeStr = clientTime;
  } else {
    timeStr = "23:59";
  }

  return { dateStr, timeStr };
}

router.get("/today", authenticate, async (req, res) => {
  try {
    const target = await resolvePatientId(req);
    if (target.error) return res.status(target.status).json({ error: target.error });

    const { dateStr: todayDate } = getClientDateTime(req);

    const { rows: schedules } = await db.query(
      `SELECT s.schedule_id, m.medication_id, m.name AS medication_name, m.dosage,
              m.start_date::text AS start_date, m.end_date::text AS end_date,
              s.time_of_day, s.days_of_week
       FROM schedule s
       JOIN medication m ON s.medication_id = m.medication_id
       WHERE m.user_id = $1
       ORDER BY s.time_of_day`,
      [target.userId]
    );

    const todayDateObj = new Date(todayDate + "T00:00:00");
    const todayDayAbbr = DAY_NAMES[todayDateObj.getDay()];

    const activeSchedules = schedules.filter((s) => {
      if (!isScheduleActiveOnDay(s.days_of_week, todayDayAbbr)) return false;
      if (s.start_date) {
        const medStart = new Date(s.start_date + "T00:00:00");
        if (todayDateObj < medStart) return false;
      }
      if (s.end_date) {
        const medEnd = new Date(s.end_date + "T00:00:00");
        if (todayDateObj > medEnd) return false;
      }
      return true;
    });

    const scheduleIds = activeSchedules.map((s) => s.schedule_id);
    let logs = [];
    if (scheduleIds.length > 0) {
      const logResult = await db.query(
        `SELECT schedule_id, status, log_id, logged_at
         FROM adherence_log
         WHERE schedule_id = ANY($1::int[]) AND logged_at::date = $2::date
         ORDER BY logged_at DESC`,
        [scheduleIds, todayDate]
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
           AND al.logged_at >= $2::date - INTERVAL '365 days'`,
        [scheduleIds, todayDate]
      );
      const logBySchedule = {};
      for (const rl of recentLogs) {
        if (!logBySchedule[rl.schedule_id]) logBySchedule[rl.schedule_id] = {};
        logBySchedule[rl.schedule_id][rl.log_date] = rl.status;
      }

      function countAllOccurrences(schedule) {
        const medStart = schedule.start_date ? new Date(schedule.start_date + "T00:00:00") : new Date(todayDateObj);
        const medEnd = schedule.end_date ? new Date(schedule.end_date + "T00:00:00") : todayDateObj;
        const cappedEnd = medEnd < todayDateObj ? medEnd : todayDateObj;
        const occurrences = [];
        const cursor = new Date(medStart);
        while (cursor <= cappedEnd) {
          if (isScheduleActiveOnDay(schedule.days_of_week, DAY_NAMES[cursor.getDay()])) {
            occurrences.push(formatDate(cursor));
          }
          cursor.setDate(cursor.getDate() + 1);
        }
        return occurrences;
      }

      for (const s of activeSchedules) {
        const occurrences = countAllOccurrences(s);
        const taken = occurrences.filter((d) => logBySchedule[s.schedule_id]?.[d] === "taken").length;

        adherenceMap[s.schedule_id] = {
          adherence: occurrences.length === 0 ? null : Math.round((taken / occurrences.length) * 100),
          adherence_count: occurrences.length,
        };
      }
    }

    const doses = activeSchedules.map((s) => ({
      schedule_id: s.schedule_id,
      medication_name: s.medication_name,
      dosage: s.dosage,
      time_of_day: formatTime(s.time_of_day),
      days_of_week: s.days_of_week,
      start_date: s.start_date,
      end_date: s.end_date,
      scheduled_date: todayDate,
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

    const { dateStr: todayDate, timeStr: todayTime } = getClientDateTime(req);

    const { rows: schedules } = await db.query(
      `SELECT s.schedule_id, s.days_of_week, s.time_of_day,
              m.start_date::text AS start_date, m.end_date::text AS end_date
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
       WHERE m.user_id = $1 AND al.logged_at >= $2::date - INTERVAL '365 days'`,
      [target.userId, todayDate]
    );

    const logMap = {};
    for (const log of logs) {
      if (!logMap[log.schedule_id]) logMap[log.schedule_id] = {};
      logMap[log.schedule_id][log.log_date] = log.status;
    }

    function isScheduleActiveOnDate(schedule, date) {
      const dayAbbr = DAY_NAMES[date.getDay()];
      if (schedule.start_date) {
        const medStart = new Date(schedule.start_date + "T00:00:00");
        if (date < medStart) return false;
      }
      if (schedule.end_date) {
        const medEnd = new Date(schedule.end_date + "T00:00:00");
        if (date > medEnd) return false;
      }
      return isScheduleActiveOnDay(schedule.days_of_week, dayAbbr);
    }

    const todayDateObj = new Date(todayDate + "T00:00:00");
    const currentMinutes = parseTimeMinutes(todayTime);

    function allScheduledTimesPassed() {
      for (const schedule of schedules) {
        if (!isScheduleActiveOnDate(schedule, todayDateObj)) continue;
        const scheduledMinutes = parseTimeMinutes(schedule.time_of_day);
        if (currentMinutes < scheduledMinutes) return false;
      }
      return true;
    }

    function calculateAdherence(days) {
      let total = 0;
      let taken = 0;

      for (let i = 1; i <= days; i++) {
        const date = new Date(todayDateObj);
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

      if (allScheduledTimesPassed()) {
        const dateStr = todayDate;
        for (const schedule of schedules) {
          if (isScheduleActiveOnDate(schedule, todayDateObj)) {
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

      if (allScheduledTimesPassed()) {
        let todayAllTaken = true;
        for (const schedule of schedules) {
          if (isScheduleActiveOnDate(schedule, todayDateObj)) {
            if (logMap[schedule.schedule_id]?.[todayDate] !== "taken") {
              todayAllTaken = false;
              break;
            }
          }
        }
        if (todayAllTaken) streak++;
      }

      for (let i = 1; i < 365; i++) {
        const date = new Date(todayDateObj);
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

router.get("/history", authenticate, async (req, res) => {
  try {
    const target = await resolvePatientId(req);
    if (target.error) return res.status(target.status).json({ error: target.error });

    const { dateStr: todayDate } = getClientDateTime(req);
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);

    const { rows: history } = await db.query(
      `SELECT al.log_id, al.status, al.logged_at,
              m.name AS medication_name, m.dosage,
              s.time_of_day, s.days_of_week
       FROM adherence_log al
       JOIN schedule s ON al.schedule_id = s.schedule_id
       JOIN medication m ON s.medication_id = m.medication_id
       WHERE m.user_id = $1 AND al.logged_at >= $2::date - ($3 || ' days')::interval
       ORDER BY al.logged_at DESC`,
      [target.userId, todayDate, String(days)]
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
