const { Router } = require("express");
const crypto = require("crypto");
const db = require("../db.js");
const { authenticate, requireRole } = require("../middleware/auth.js");

const router = Router();

function generateCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

// Patient: generate invite code
router.post("/invite", authenticate, requireRole("patient"), async (req, res) => {
  try {
    const code = generateCode();
    const result = await db.query(
      `INSERT INTO caregiver_link (patient_id, caregiver_id, status, invite_code)
       VALUES ($1, NULL, 'pending', $2)
       RETURNING link_id, invite_code`,
      [req.user.user_id, code]
    );
    res.json({ invite_code: result.rows[0].invite_code });
  } catch (err) {
    console.error("Invite error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Caregiver: accept invite
router.post("/accept", authenticate, requireRole("caregiver"), async (req, res) => {
  try {
    const { invite_code } = req.body;
    if (!invite_code) {
      return res.status(400).json({ error: "Invite code is required" });
    }

    const { rows } = await db.query(
      `SELECT link_id, patient_id FROM caregiver_link
       WHERE invite_code = $1 AND status = 'pending' AND caregiver_id IS NULL`,
      [invite_code.trim().toUpperCase()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Invalid or already used invite code" });
    }

    const link = rows[0];

    if (link.patient_id === req.user.user_id) {
      return res.status(400).json({ error: "You cannot link to your own patient account" });
    }

    await db.query(
      `UPDATE caregiver_link SET caregiver_id = $1, status = 'accepted' WHERE link_id = $2`,
      [req.user.user_id, link.link_id]
    );

    const { rows: patient } = await db.query(
      "SELECT full_name FROM \"user\" WHERE user_id = $1",
      [link.patient_id]
    );

    res.json({ patient_id: link.patient_id, full_name: patient[0].full_name });
  } catch (err) {
    console.error("Accept invite error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Caregiver: get linked patients
router.get("/patients", authenticate, requireRole("caregiver"), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.user_id, u.full_name
       FROM caregiver_link cl
       JOIN "user" u ON cl.patient_id = u.user_id
       WHERE cl.caregiver_id = $1 AND cl.status = 'accepted'`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Get patients error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Patient: list all caregivers with access
router.get("/access", authenticate, requireRole("patient"), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT cl.link_id, cl.status, cl.created_at, cl.invite_code,
              u.full_name, u.email
       FROM caregiver_link cl
       LEFT JOIN "user" u ON cl.caregiver_id = u.user_id
       WHERE cl.patient_id = $1 AND cl.status IN ('accepted', 'pending')
       ORDER BY cl.created_at DESC`,
      [req.user.user_id]
    );

    const result = rows.map((row) => ({
      link_id: row.link_id,
      full_name: row.full_name || "Pending",
      email: row.email || null,
      status: row.status,
      invite_code: row.status === "pending" ? row.invite_code : null,
      created_at: row.created_at,
    }));

    res.json(result);
  } catch (err) {
    console.error("Get caregiver access error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Patient: revoke caregiver access
router.delete("/access/:link_id", authenticate, requireRole("patient"), async (req, res) => {
  try {
    const { link_id } = req.params;

    const { rows: links } = await db.query(
      "SELECT link_id FROM caregiver_link WHERE link_id = $1 AND patient_id = $2",
      [link_id, req.user.user_id]
    );

    if (links.length === 0) {
      return res.status(403).json({ error: "Link not found or access denied" });
    }

    await db.query(
      "UPDATE caregiver_link SET status = 'revoked' WHERE link_id = $1",
      [link_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Revoke caregiver error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
