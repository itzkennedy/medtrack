const { Router } = require("express");
const db = require("../db.js");
const { authenticate, requireRole } = require("../middleware/auth.js");

const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const { rows: medications } = await db.query(
      `SELECT m.medication_id, m.name, m.dosage, m.start_date, m.end_date, m.created_at,
              s.schedule_id, s.time_of_day, s.days_of_week
       FROM medication m
       LEFT JOIN schedule s ON m.medication_id = s.medication_id
       WHERE m.user_id = $1
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

    const medResult = await db.query(
      "INSERT INTO medication (user_id, name, dosage, start_date, end_date) VALUES ($1, $2, $3, $4, $5) RETURNING medication_id",
      [req.user.user_id, name, dosage, start_date, end_date || null]
    );

    const medication_id = medResult.rows[0].medication_id;

    const timeValue = time_of_day.length === 5 ? time_of_day + ":00" : time_of_day;
    const schResult = await db.query(
      "INSERT INTO schedule (medication_id, time_of_day, days_of_week) VALUES ($1, $2, $3) RETURNING schedule_id",
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
          schedule_id: schResult.rows[0].schedule_id,
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

router.put("/:medication_id", authenticate, requireRole("patient"), async (req, res) => {
  try {
    const { medication_id } = req.params;
    const { name, dosage, start_date, end_date, time_of_day, days_of_week } = req.body;

    if (!name || !dosage || !start_date || !time_of_day || !days_of_week) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { rows: meds } = await db.query(
      "SELECT medication_id FROM medication WHERE medication_id = $1 AND user_id = $2",
      [medication_id, req.user.user_id]
    );
    if (meds.length === 0) {
      return res.status(403).json({ error: "Medication not found or access denied" });
    }

    await db.query(
      "UPDATE medication SET name = $1, dosage = $2, start_date = $3, end_date = $4 WHERE medication_id = $5",
      [name, dosage, start_date, end_date || null, medication_id]
    );

    if (time_of_day && days_of_week) {
      const timeValue = time_of_day.length === 5 ? time_of_day + ":00" : time_of_day;
      await db.query(
        "UPDATE schedule SET time_of_day = $1, days_of_week = $2 WHERE medication_id = $3",
        [timeValue, days_of_week, medication_id]
      );
    }

    const { rows: updated } = await db.query(
      `SELECT m.medication_id, m.name, m.dosage, m.start_date, m.end_date, m.created_at,
              s.schedule_id, s.time_of_day, s.days_of_week
       FROM medication m LEFT JOIN schedule s ON m.medication_id = s.medication_id
       WHERE m.medication_id = $1`,
      [medication_id]
    );

    res.json({
      medication_id: updated[0].medication_id,
      name: updated[0].name,
      dosage: updated[0].dosage,
      start_date: updated[0].start_date,
      end_date: updated[0].end_date,
      schedules: updated[0].schedule_id
        ? [{ schedule_id: updated[0].schedule_id, time_of_day: updated[0].time_of_day, days_of_week: updated[0].days_of_week }]
        : [],
    });
  } catch (err) {
    console.error("Update medication error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:medication_id", authenticate, requireRole("patient"), async (req, res) => {
  try {
    const { medication_id } = req.params;

    const { rows: meds } = await db.query(
      "SELECT medication_id FROM medication WHERE medication_id = $1 AND user_id = $2",
      [medication_id, req.user.user_id]
    );
    if (meds.length === 0) {
      return res.status(403).json({ error: "Medication not found or access denied" });
    }

    await db.query("DELETE FROM medication WHERE medication_id = $1", [medication_id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete medication error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
