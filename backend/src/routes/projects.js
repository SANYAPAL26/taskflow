const express      = require("express");
const { v4: uid }  = require("uuid");
const db           = require("../models/db");
const requireAuth  = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// ── Helper: check membership & return role ────────────────────
function getRole(projectId, userId) {
  const m = db.prepare("SELECT role FROM memberships WHERE project_id = ? AND user_id = ?")
    .get(projectId, userId);
  return m?.role || null;
}

/* ── GET /api/projects ─── list projects for current user ── */
router.get("/", (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, m.role
    FROM projects p
    JOIN memberships m ON m.project_id = p.id
    WHERE m.user_id = ?
    ORDER BY p.created_at DESC
  `).all(req.user.id);
  return res.json({ projects: rows });
});

/* ── POST /api/projects ─── create project ─────────────── */
router.post("/", (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });

  const id = uid();
  db.prepare("INSERT INTO projects (id, name, description, creator_id) VALUES (?, ?, ?, ?)")
    .run(id, name.trim(), description?.trim() || null, req.user.id);

  // Auto-assign creator as Admin
  db.prepare("INSERT INTO memberships (id, project_id, user_id, role) VALUES (?, ?, ?, 'Admin')")
    .run(uid(), id, req.user.id);

  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  return res.status(201).json({ project: { ...project, role: "Admin" } });
});

/* ── GET /api/projects/:id ─────────────────────────────── */
router.get("/:id", (req, res) => {
  const role = getRole(req.params.id, req.user.id);
  if (!role) return res.status(403).json({ error: "Not a member of this project" });

  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  return res.json({ project: { ...project, role } });
});

/* ── DELETE /api/projects/:id ── (Admin only) ──────────── */
router.delete("/:id", (req, res) => {
  const role = getRole(req.params.id, req.user.id);
  if (role !== "Admin") return res.status(403).json({ error: "Admin only" });

  db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);
  return res.json({ success: true });
});

/* ══════════════════════════════════════════════════════════
   MEMBER MANAGEMENT
══════════════════════════════════════════════════════════ */

/* ── GET /api/projects/:id/members ─────────────────────── */
router.get("/:id/members", (req, res) => {
  const role = getRole(req.params.id, req.user.id);
  if (!role) return res.status(403).json({ error: "Not a member of this project" });

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, m.role, m.joined_at
    FROM memberships m
    JOIN users u ON u.id = m.user_id
    WHERE m.project_id = ?
    ORDER BY m.role DESC, u.name ASC
  `).all(req.params.id);

  return res.json({ members });
});

/* ── POST /api/projects/:id/members ─── add member ─────── */
router.post("/:id/members", (req, res) => {
  const role = getRole(req.params.id, req.user.id);
  if (role !== "Admin") return res.status(403).json({ error: "Admin only" });

  const { email, memberRole = "Member" } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });
  if (!["Admin", "Member"].includes(memberRole))
    return res.status(400).json({ error: "role must be Admin or Member" });

  const targetUser = db.prepare("SELECT id, name, email FROM users WHERE email = ?")
    .get(email.toLowerCase().trim());
  if (!targetUser) return res.status(404).json({ error: "No user found with that email" });

  const existing = db.prepare("SELECT id FROM memberships WHERE project_id = ? AND user_id = ?")
    .get(req.params.id, targetUser.id);
  if (existing) return res.status(409).json({ error: "User is already a member" });

  db.prepare("INSERT INTO memberships (id, project_id, user_id, role) VALUES (?, ?, ?, ?)")
    .run(uid(), req.params.id, targetUser.id, memberRole);

  return res.status(201).json({ user: targetUser, role: memberRole });
});

/* ── PATCH /api/projects/:id/members/:userId ─── change role */
router.patch("/:id/members/:userId", (req, res) => {
  const role = getRole(req.params.id, req.user.id);
  if (role !== "Admin") return res.status(403).json({ error: "Admin only" });

  const { memberRole } = req.body;
  if (!["Admin", "Member"].includes(memberRole))
    return res.status(400).json({ error: "role must be Admin or Member" });

  db.prepare("UPDATE memberships SET role = ? WHERE project_id = ? AND user_id = ?")
    .run(memberRole, req.params.id, req.params.userId);

  return res.json({ success: true });
});

/* ── DELETE /api/projects/:id/members/:userId ───────────── */
router.delete("/:id/members/:userId", (req, res) => {
  const role = getRole(req.params.id, req.user.id);
  if (role !== "Admin") return res.status(403).json({ error: "Admin only" });

  // Prevent removing the only admin
  if (req.params.userId === req.user.id) {
    const adminCount = db.prepare(
      "SELECT COUNT(*) as c FROM memberships WHERE project_id = ? AND role = 'Admin'"
    ).get(req.params.id).c;
    if (adminCount <= 1)
      return res.status(400).json({ error: "Cannot remove the only Admin" });
  }

  db.prepare("DELETE FROM memberships WHERE project_id = ? AND user_id = ?")
    .run(req.params.id, req.params.userId);

  return res.json({ success: true });
});

module.exports = router;