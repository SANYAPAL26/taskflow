require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Request logger (dev-friendly)
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString().slice(11, 19)} ${req.method} ${req.path}`);
  next();
});

// ─── Boot: wait for DB, then load routes & listen ────────────
const db = require("./models/db");

db.ready.then(() => {
  const authRouter      = require("./routes/auth");
  const projectsRouter  = require("./routes/projects");
  const tasksRouter     = require("./routes/tasks");
  const dashboardRouter = require("./routes/dashboard");

  // ─── Routes ────────────────────────────────────────────────
  app.use("/api/auth",      authRouter);
  app.use("/api/projects",  projectsRouter);
  app.use("/api/projects/:projectId/tasks", tasksRouter);
  app.use("/api/dashboard", dashboardRouter);

  // Health check
  app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

  // 404
  app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

  // Global error handler
  app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal server error" });
  });

  app.listen(PORT, () => {
    console.log(`\n⬡  TaskFlow API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health\n`);
  });
}).catch((err) => {
  console.error("Failed to initialise database:", err);
  process.exit(1);
});