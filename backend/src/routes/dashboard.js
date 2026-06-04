const express     = require("express");
const db          = require("../models/db");
const requireAuth = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

/* ── GET /api/dashboard ─────────────────────────────────── */
router.get("/", (req, res) => {
  const userId = req.user.id;

  // Projects the user belongs to
  const projectIds = db.prepare(`
    SELECT project_id FROM memberships WHERE user_id = ?
  `).all(userId).map(r => r.project_id);

  if (projectIds.length === 0) {
    return res.json({
      totalTasks: 0, byStatus: { todo: 0, progress: 0, done: 0 },
      overdue: 0, perUser: [], projects: []
    });
  }

  const placeholders = projectIds.map(() => "?").join(",");

  // All tasks across user's projects
  const allTasks = db.prepare(
    `SELECT * FROM tasks WHERE project_id IN (${placeholders})`
  ).all(...projectIds);

  const today = new Date().toISOString().slice(0, 10);

  const byStatus = { todo: 0, progress: 0, done: 0 };
  let overdue = 0;
  allTasks.forEach(t => {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    if (t.status !== "done" && t.due_date && t.due_date < today) overdue++;
  });

  // Tasks per user
  const perUser = db.prepare(`
    SELECT u.id, u.name, u.email, COUNT(t.id) as taskCount
    FROM tasks t
    JOIN users u ON u.id = t.assignee_id
    WHERE t.project_id IN (${placeholders})
    GROUP BY u.id
    ORDER BY taskCount DESC
  `).all(...projectIds);

  // Project summaries
  const projects = db.prepare(`
    SELECT p.*, m.role,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as taskCount,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as doneCount,
      (SELECT COUNT(*) FROM memberships WHERE project_id = p.id) as memberCount
    FROM projects p
    JOIN memberships m ON m.project_id = p.id AND m.user_id = ?
    ORDER BY p.created_at DESC
  `).all(userId);

  return res.json({
    totalTasks: allTasks.length,
    byStatus,
    overdue,
    perUser,
    projects,
  });
});

module.exports = router;