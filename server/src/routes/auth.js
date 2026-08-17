const { Router } = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db.js");
const { authenticate } = require("../middleware/auth.js");

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;

    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    if (!["patient", "caregiver"].includes(role)) {
      return res.status(400).json({ error: "Role must be 'patient' or 'caregiver'" });
    }

    const existing = await db.query("SELECT user_id FROM \"user\" WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      "INSERT INTO \"user\" (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id",
      [full_name, email, password_hash, role]
    );

    res.status(201).json({
      user_id: result.rows[0].user_id,
      full_name,
      email,
      role,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await db.query("SELECT * FROM \"user\" WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT user_id, full_name, email, role FROM \"user\" WHERE user_id = $1",
      [req.user.user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
