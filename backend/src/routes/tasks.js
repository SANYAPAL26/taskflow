const express      = require("express");
const { v4: uid }  = require("uuid");
const db           = require("../models/db");
const requireAuth  = require("../middleware/auth");

const router = express.Router({ mergeParams: true }); // inherits :projectId from parent
router.use(requireAuth);

// ── Helper ────────────────────────────────────────────────────
function getRole(projectId, userId) {
  const m = db.prepare("SELECT role FROM memberships WHERE project_id = ? AND user_id = ?")
    .get(projectId, userId);
  return m?.role || null;
}

function enrichTask(task) {
  if (!task) return null;
  const assignee = task.assignee_id
    ? db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(task.assignee_id)
    : null;
  const creator = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(task.creator_id);
  return { ...task, assignee, creator };
}

/* ── GET /api/projects/:projectId/tasks ─────────────────── */
router.get("/", (req, res) => {
  const role = getRole(req.params.projectId, req.user.id);
  if (!role) return res.status(403).json({ error: "Not a member of this project" });

  const { status, priority, assigneeId } = req.query;

  let query = "SELECT * FROM tasks WHERE project_id = ?";
  const params = [req.params.projectId];

  if (status)     { query += " AND status = ?";      params.push(status); }
  if (priority)   { query += " AND priority = ?";    params.push(priority); }
  if (assigneeId) { query += " AND assignee_id = ?"; params.push(assigneeId); }

  query += " ORDER BY created_at DESC";

  const tasks = db.prepare(query).all(...params).map(enrichTask);
  return res.json({ tasks });
});

/* ── POST /api/projects/:projectId/tasks ─── Admin only ─── */
router.post("/", (req, res) => {
  const role = getRole(req.params.projectId, req.user.id);
  if (!role)          return res.status(403).json({ error: "Not a member of this project" });
  if (role !== "Admin") return res.status(403).json({ error: "Only Admins can create tasks" });

  const { title, description, priority = "medium", dueDate, assigneeId } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });

  const validPriorities = ["low", "medium", "high"];
  if (!validPriorities.includes(priority))
    return res.status(400).json({ error: "priority must be low, medium, or high" });

  // Validate assignee is a member of the project
  if (assigneeId) {
    const isMember = db.prepare("SELECT id FROM memberships WHERE project_id = ? AND user_id = ?")
      .get(req.params.projectId, assigneeId);
    if (!isMember) return res.status(400).json({ error: "Assignee is not a project member" });
  }

  const id = uid();
  db.prepare(`
    INSERT INTO tasks (id, project_id, creator_id, assignee_id, title, description, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.projectId, req.user.id, assigneeId || null,
         title.trim(), description?.trim() || null, priority, dueDate || null);

  const task = enrichTask(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id));
  return res.status(201).json({ task });
});

/* ── GET /api/projects/:projectId/tasks/:taskId ─────────── */
router.get("/:taskId", (req, res) => {
  const role = getRole(req.params.projectId, req.user.id);
  if (!role) return res.status(403).json({ error: "Not a member of this project" });

  const task = enrichTask(
    db.prepare("SELECT * FROM tasks WHERE id = ? AND project_id = ?")
      .get(req.params.taskId, req.params.projectId)
  );
  if (!task) return res.status(404).json({ error: "Task not found" });

  return res.json({ task });
});

/* ── PATCH /api/projects/:projectId/tasks/:taskId ───────── */
router.patch("/:taskId", (req, res) => {
  const role = getRole(req.params.projectId, req.user.id);
  if (!role) return res.status(403).json({ error: "Not a member of this project" });

  const task = db.prepare("SELECT * FROM tasks WHERE id = ? AND project_id = ?")
    .get(req.params.taskId, req.params.projectId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const isAdmin    = role === "Admin";
  const isAssignee = task.assignee_id === req.user.id;

  // Members can only update status of their own tasks
  if (!isAdmin && !isAssignee)
    return res.status(403).json({ error: "You can only update tasks assigned to you" });

  const { title, description, priority, status, dueDate, assigneeId } = req.body;

  // Members can only change status
  if (!isAdmin && (title || description || priority || dueDate || assigneeId))
    return res.status(403).json({ error: "Members can only update status" });

  // Validate fields
  if (status && !["todo", "progress", "done"].includes(status))
    return res.status(400).json({ error: "Invalid status" });
  if (priority && !["low", "medium", "high"].includes(priority))
    return res.status(400).json({ error: "Invalid priority" });
  if (assigneeId) {
    const isMember = db.prepare("SELECT id FROM memberships WHERE project_id = ? AND user_id = ?")
      .get(req.params.projectId, assigneeId);
    if (!isMember) return res.status(400).json({ error: "Assignee is not a project member" });
  }

  // Build update
  const updates = {
    title:       title       ?? task.title,
    description: description ?? task.description,
    priority:    priority    ?? task.priority,
    status:      status      ?? task.status,
    due_date:    dueDate     !== undefined ? (dueDate || null) : task.due_date,
    assignee_id: assigneeId  !== undefined ? (assigneeId || null) : task.assignee_id,
    updated_at:  new Date().toISOString(),
  };

  db.prepare(`
    UPDATE tasks SET title=?, description=?, priority=?, status=?,
    due_date=?, assignee_id=?, updated_at=? WHERE id=?
  `).run(updates.title, updates.description, updates.priority, updates.status,
         updates.due_date, updates.assignee_id, updates.updated_at, req.params.taskId);

  return res.json({ task: enrichTask(db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.taskId)) });
});

/* ── DELETE /api/projects/:projectId/tasks/:taskId ── Admin  */
router.delete("/:taskId", (req, res) => {
  const role = getRole(req.params.projectId, req.user.id);
  if (role !== "Admin") return res.status(403).json({ error: "Admin only" });

  const result = db.prepare("DELETE FROM tasks WHERE id = ? AND project_id = ?")
    .run(req.params.taskId, req.params.projectId);

  if (result.changes === 0) return res.status(404).json({ error: "Task not found" });
  return res.json({ success: true });
});

module.exports = router;