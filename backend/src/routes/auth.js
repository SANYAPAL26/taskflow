const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const { v4: uid } = require("uuid");
const db       = require("../models/db");

const router = express.Router();

/* ── POST /api/auth/signup ──────────────────────────── */
router.post("/signup", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: "name, email, and password are required" });

  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing)
    return res.status(409).json({ error: "Email already registered" });

  const hash = bcrypt.hashSync(password, 10);
  const id   = uid();

  db.prepare("INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)")
    .run(id, name.trim(), email.toLowerCase().trim(), hash);

  const user  = { id, name: name.trim(), email: email.toLowerCase().trim() };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "7d" });

  return res.status(201).json({ user, token });
});

/* ── POST /api/auth/login ───────────────────────────── */
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "email and password are required" });

  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim());
  if (!row || !bcrypt.compareSync(password, row.password))
    return res.status(401).json({ error: "Invalid email or password" });

  const user  = { id: row.id, name: row.name, email: row.email };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "7d" });

  return res.json({ user, token });
});

/* ── GET /api/auth/me ───────────────────────────────── */
const requireAuth = require("../middleware/auth");
router.get("/me", requireAuth, (req, res) => {
  const row = db.prepare("SELECT id, name, email, created_at FROM users WHERE id = ?").get(req.user.id);
  if (!row) return res.status(404).json({ error: "User not found" });
  return res.json({ user: row });
});

module.exports = router;