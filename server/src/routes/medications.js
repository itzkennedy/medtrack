const { Router } = require("express");
const db = require("../db.js");
const { authenticate, requireRole } = require("../middleware/auth.js");

const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const [medications] = await db.query(
      `SELECT m.medication_id, m.name, m.dosage, m.start_date, m.end_date, m.created_at,
              s.schedule_id, s.time_of_day, s.days_of_week
       FROM MEDICATION m
       LEFT JOIN SCHEDULE s ON m.medication_id = s.medication_id
       WHERE m.user_id = ?
       ORDER BY m.created_at DESC, s.time_of_day`,
      [req.user.user_id]
    );

    const medMap = [];
    const medIndex = {};

    for (const row of medications) {
      if (!medIndex[row.medication_id]) {
        const med = {
          medication_id: row.medication_id,
          name: row.name,
          dosage: row.dosage,
          start_date: row.start_date,
          end_date: row.end_date,
          created_at: row.created_at,
          schedules: [],
        };
        medMap.push(med);
        medIndex[row.medication_id] = med;
      }
      if (row.schedule_id) {
        medIndex[row.medication_id].schedules.push({
          schedule_id: row.schedule_id,
          time_of_day: row.time_of_day,
          days_of_week: row.days_of_week,
        });
      }
    }

    res.json(medMap);
  } catch (err) {
    console.error("Get medications error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authenticate, requireRole("patient"), async (req, res) => {
  try {
    const { name, dosage, start_date, end_date, time_of_day, days_of_week } = req.body;

    if (!name || !dosage || !start_date || !time_of_day || !days_of_week) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [medResult] = await db.query(
      "INSERT INTO MEDICATION (user_id, name, dosage, start_date, end_date) VALUES (?, ?, ?, ?, ?)",
      [req.user.user_id, name, dosage, start_date, end_date || null]
    );

    const medication_id = medResult.insertId;

    const timeValue = time_of_day.length === 5 ? time_of_day + ":00" : time_of_day;
    const [schResult] = await db.query(
      "INSERT INTO SCHEDULE (medication_id, time_of_day, days_of_week) VALUES (?, ?, ?)",
      [medication_id, timeValue, days_of_week]
    );

    res.status(201).json({
      medication_id,
      name,
      dosage,
      start_date,
      end_date: end_date || null,
      schedules: [
        {
          schedule_id: schResult.insertId,
          time_of_day: timeValue,
          days_of_week,
        },
      ],
    });
  } catch (err) {
    console.error("Add medication error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
