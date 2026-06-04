/**
 * api.js  —  Drop this file into your frontend src/ folder.
 * Replace the mock AuthAPI / ProjectAPI / TaskAPI in App.jsx
 * with the exports from this file.
 *
 * Usage:
 *   import { AuthAPI, ProjectAPI, TaskAPI, DashboardAPI } from "./api";
 */

const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ─── Token storage ────────────────────────────────────────────
const token = {
  get:    ()    => localStorage.getItem("ttm_token"),
  set:    (t)   => localStorage.setItem("ttm_token", t),
  clear:  ()    => localStorage.removeItem("ttm_token"),
};

// ─── Core fetch wrapper ───────────────────────────────────────
async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const t = token.get();
  if (t) headers["Authorization"] = `Bearer ${t}`;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────
export const AuthAPI = {
  async signup(name, email, password) {
    try {
      const { user, token: t } = await api("/api/auth/signup", {
        method: "POST", body: { name, email, password },
      });
      token.set(t);
      return { user };
    } catch (e) { return { error: e.message }; }
  },

  async login(email, password) {
    try {
      const { user, token: t } = await api("/api/auth/login", {
        method: "POST", body: { email, password },
      });
      token.set(t);
      return { user };
    } catch (e) { return { error: e.message }; }
  },

  logout() { token.clear(); },
};

// ─── Projects ─────────────────────────────────────────────────
export const ProjectAPI = {
  async list()                  { const d = await api("/api/projects"); return d.projects; },
  async create(name, desc)      { const d = await api("/api/projects", { method:"POST", body:{ name, description:desc } }); return d.project; },
  async getMembers(projectId)   { const d = await api(`/api/projects/${projectId}/members`); return d.members; },
  async addMember(projectId, email, role="Member") {
    try {
      await api(`/api/projects/${projectId}/members`, { method:"POST", body:{ email, memberRole:role } });
      return {};
    } catch(e) { return { error: e.message }; }
  },
  async removeMember(projectId, userId) {
    await api(`/api/projects/${projectId}/members/${userId}`, { method:"DELETE" });
  },
  async getUserRole(projectId) {
    try {
      const d = await api(`/api/projects/${projectId}`);
      return d.project.role;
    } catch { return null; }
  },
};

// ─── Tasks ────────────────────────────────────────────────────
export const TaskAPI = {
  async list(projectId, filters={})  {
    const q = new URLSearchParams(filters).toString();
    const d = await api(`/api/projects/${projectId}/tasks${q ? "?"+q : ""}`);
    return d.tasks;
  },
  async create(data) {
    const { projectId, ...rest } = data;
    const d = await api(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      body: {
        title:       rest.title,
        description: rest.description,
        priority:    rest.priority,
        dueDate:     rest.dueDate,
        assigneeId:  rest.assigneeId,
      },
    });
    return d.task;
  },
  async update(projectId, taskId, updates) {
    const d = await api(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "PATCH", body: updates,
    });
    return d.task;
  },
  async delete(projectId, taskId) {
    await api(`/api/projects/${projectId}/tasks/${taskId}`, { method:"DELETE" });
  },
};

// ─── Dashboard ────────────────────────────────────────────────
export const DashboardAPI = {
  async get() { return api("/api/dashboard"); },
};