import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { AuthAPI, ProjectAPI, TaskAPI, DashboardAPI } from "./api-client";

/* ─────────────────────────────────────────────────────────
   DESIGN SYSTEM  — Industrial-Utility Dark Theme
   Typography: "Syne" (headings) + "JetBrains Mono" (data)
   Palette: Near-black canvas, amber accent, slate panels
───────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #0d0e11;
    --surface:   #15171c;
    --panel:     #1c1f27;
    --border:    #2a2d38;
    --accent:    #f5a623;
    --accent2:   #e85d04;
    --success:   #22c55e;
    --warn:      #eab308;
    --danger:    #ef4444;
    --text:      #e8e9ec;
    --muted:     #6b7280;
    --subtle:    #374151;
    --r:         8px;
    --r-lg:      14px;
    --shadow:    0 4px 24px rgba(0,0,0,.45);
  }

  html, body, #root { height: 100%; font-family: 'JetBrains Mono', monospace; background: var(--bg); color: var(--text); }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .app { display: flex; height: 100vh; overflow: hidden; }

  /* ── AUTH ── */
  .auth-wrap {
    display: flex; align-items: center; justify-content: center;
    height: 100vh; width: 100%;
    background: radial-gradient(ellipse at 30% 40%, #1a1200 0%, var(--bg) 70%);
  }
  .auth-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r-lg); padding: 48px 40px; width: 380px;
    box-shadow: var(--shadow);
    animation: slideUp .4s cubic-bezier(.16,1,.3,1);
  }
  .auth-logo { font-family:'Syne',sans-serif; font-weight:800; font-size:22px; color:var(--accent); letter-spacing:-.5px; margin-bottom:6px; }
  .auth-tagline { font-size:11px; color:var(--muted); margin-bottom:36px; }
  .auth-tabs { display:flex; gap:4px; margin-bottom:28px; background:var(--panel); padding:4px; border-radius:var(--r); }
  .auth-tab {
    flex:1; padding:8px; text-align:center; font-family:'Syne',sans-serif; font-size:12px; font-weight:600;
    border:none; background:transparent; color:var(--muted); cursor:pointer; border-radius:6px; transition:.2s;
  }
  .auth-tab.active { background:var(--accent); color:#000; }

  /* ── SIDEBAR ── */
  .sidebar {
    width: 220px; min-width:220px; background:var(--surface); border-right:1px solid var(--border);
    display:flex; flex-direction:column; padding:20px 0; overflow-y:auto;
    animation: fadeIn .3s ease;
  }
  .sidebar-logo { font-family:'Syne',sans-serif; font-weight:800; font-size:16px; color:var(--accent); padding:0 20px 20px; border-bottom:1px solid var(--border); }
  .sidebar-logo span { color:var(--muted); font-weight:400; }
  .nav-section { padding:16px 20px 8px; font-size:9px; letter-spacing:2px; color:var(--muted); text-transform:uppercase; }
  .nav-item {
    display:flex; align-items:center; gap:10px; padding:9px 20px;
    font-size:12px; color:var(--muted); cursor:pointer; border:none; background:transparent;
    width:100%; text-align:left; transition:.15s; position:relative;
  }
  .nav-item:hover { color:var(--text); background:var(--panel); }
  .nav-item.active { color:var(--accent); background:var(--panel); }
  .nav-item.active::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--accent); border-radius:0 2px 2px 0; }
  .nav-badge { margin-left:auto; background:var(--accent2); color:#fff; font-size:9px; padding:2px 6px; border-radius:10px; font-weight:500; }
  .sidebar-user { margin-top:auto; padding:16px 20px; border-top:1px solid var(--border); }
  .user-pill { display:flex; align-items:center; gap:10px; }
  .avatar { width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-size:11px; font-weight:700; flex-shrink:0; }
  .user-name { font-size:11px; color:var(--text); }
  .user-role { font-size:9px; color:var(--muted); }
  .logout-btn { margin-top:10px; width:100%; padding:7px; font-size:11px; font-family:'JetBrains Mono',monospace; background:transparent; border:1px solid var(--border); color:var(--muted); border-radius:var(--r); cursor:pointer; transition:.2s; }
  .logout-btn:hover { border-color:var(--danger); color:var(--danger); }

  /* ── MAIN ── */
  .main { flex:1; overflow-y:auto; display:flex; flex-direction:column; }
  .topbar { padding:20px 28px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; background:var(--surface); position:sticky; top:0; z-index:10; }
  .page-title { font-family:'Syne',sans-serif; font-weight:700; font-size:20px; }
  .page-sub { font-size:10px; color:var(--muted); margin-top:2px; }
  .content { padding:28px; flex:1; }

  /* ── CARDS / PANELS ── */
  .card {
    background:var(--surface); border:1px solid var(--border);
    border-radius:var(--r-lg); padding:20px; transition:.2s;
  }
  .card:hover { border-color:var(--subtle); }
  .card-title { font-family:'Syne',sans-serif; font-weight:700; font-size:13px; margin-bottom:4px; }
  .card-meta { font-size:10px; color:var(--muted); }

  /* ── STAT CARDS ── */
  .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:28px; }
  .stat-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--r-lg); padding:20px; position:relative; overflow:hidden; }
  .stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
  .stat-card.amber::before { background:var(--accent); }
  .stat-card.green::before { background:var(--success); }
  .stat-card.blue::before { background:#3b82f6; }
  .stat-card.red::before { background:var(--danger); }
  .stat-num { font-family:'Syne',sans-serif; font-size:32px; font-weight:800; line-height:1; }
  .stat-label { font-size:10px; color:var(--muted); margin-top:4px; text-transform:uppercase; letter-spacing:1px; }
  .stat-icon { position:absolute; right:16px; top:16px; font-size:20px; opacity:.25; }

  /* ── TASK BOARD ── */
  .board { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
  .board-col { background:var(--panel); border:1px solid var(--border); border-radius:var(--r-lg); padding:16px; }
  .col-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
  .col-title { font-family:'Syne',sans-serif; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; }
  .col-count { background:var(--border); color:var(--muted); font-size:10px; padding:2px 8px; border-radius:10px; }
  .task-card {
    background:var(--surface); border:1px solid var(--border); border-radius:var(--r);
    padding:14px; margin-bottom:10px; cursor:pointer; transition:.2s;
    animation: slideUp .25s ease;
  }
  .task-card:hover { border-color:var(--accent); transform:translateY(-1px); box-shadow:0 4px 16px rgba(0,0,0,.3); }
  .task-title { font-family:'Syne',sans-serif; font-size:12px; font-weight:600; margin-bottom:6px; }
  .task-desc { font-size:10px; color:var(--muted); margin-bottom:10px; line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .task-footer { display:flex; align-items:center; justify-content:space-between; }
  .priority-badge { font-size:9px; padding:2px 7px; border-radius:4px; font-weight:500; text-transform:uppercase; letter-spacing:.5px; }
  .priority-high { background:rgba(239,68,68,.15); color:#ef4444; border:1px solid rgba(239,68,68,.3); }
  .priority-medium { background:rgba(234,179,8,.15); color:#eab308; border:1px solid rgba(234,179,8,.3); }
  .priority-low { background:rgba(34,197,94,.15); color:#22c55e; border:1px solid rgba(34,197,94,.3); }
  .due-date { font-size:9px; color:var(--muted); }
  .due-date.overdue { color:var(--danger); }
  .assignee-chip { width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:8px; font-weight:700; flex-shrink:0; }

  /* ── PROJECTS ── */
  .projects-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }
  .project-card {
    background:var(--surface); border:1px solid var(--border); border-radius:var(--r-lg);
    padding:20px; cursor:pointer; transition:.2s; position:relative; overflow:hidden;
  }
  .project-card::after { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; background:var(--accent); transform:scaleX(0); transition:.25s; transform-origin:left; }
  .project-card:hover { border-color:var(--subtle); transform:translateY(-2px); }
  .project-card:hover::after { transform:scaleX(1); }
  .project-name { font-family:'Syne',sans-serif; font-size:15px; font-weight:700; margin-bottom:6px; }
  .project-desc { font-size:10px; color:var(--muted); margin-bottom:14px; line-height:1.6; }
  .project-meta { display:flex; gap:12px; font-size:10px; color:var(--muted); }
  .project-role { font-size:9px; padding:2px 8px; border-radius:4px; font-weight:600; }
  .role-admin { background:rgba(245,166,35,.15); color:var(--accent); border:1px solid rgba(245,166,35,.3); }
  .role-member { background:rgba(107,114,128,.1); color:var(--muted); border:1px solid var(--border); }

  /* ── FORMS / MODALS ── */
  .modal-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,.7); display:flex;
    align-items:center; justify-content:center; z-index:100; backdrop-filter:blur(4px);
    animation: fadeIn .2s ease;
  }
  .modal {
    background:var(--surface); border:1px solid var(--border); border-radius:var(--r-lg);
    padding:28px; width:460px; max-height:85vh; overflow-y:auto;
    box-shadow:var(--shadow); animation: slideUp .3s cubic-bezier(.16,1,.3,1);
  }
  .modal-title { font-family:'Syne',sans-serif; font-weight:700; font-size:17px; margin-bottom:4px; }
  .modal-sub { font-size:10px; color:var(--muted); margin-bottom:24px; }
  .form-row { margin-bottom:16px; }
  label { display:block; font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
  input, textarea, select {
    width:100%; background:var(--panel); border:1px solid var(--border); border-radius:var(--r);
    padding:10px 12px; font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--text);
    outline:none; transition:.2s;
  }
  input:focus, textarea:focus, select:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(245,166,35,.1); }
  select option { background:var(--panel); }
  textarea { resize:vertical; min-height:80px; }
  .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:24px; }

  /* ── BUTTONS ── */
  .btn {
    padding:9px 18px; border-radius:var(--r); font-family:'JetBrains Mono',monospace;
    font-size:11px; font-weight:500; cursor:pointer; border:none; transition:.2s; display:inline-flex; align-items:center; gap:6px;
  }
  .btn-primary { background:var(--accent); color:#000; font-weight:700; }
  .btn-primary:hover { background:#e5991f; transform:translateY(-1px); }
  .btn-ghost { background:transparent; border:1px solid var(--border); color:var(--muted); }
  .btn-ghost:hover { border-color:var(--text); color:var(--text); }
  .btn-danger { background:transparent; border:1px solid var(--danger); color:var(--danger); }
  .btn-danger:hover { background:var(--danger); color:#fff; }
  .btn-sm { padding:5px 12px; font-size:10px; }
  .add-btn {
    display:flex; align-items:center; gap:8px; padding:12px;
    background:transparent; border:1px dashed var(--border); border-radius:var(--r);
    color:var(--muted); font-size:11px; font-family:'JetBrains Mono',monospace;
    cursor:pointer; width:100%; transition:.2s; margin-top:8px;
  }
  .add-btn:hover { border-color:var(--accent); color:var(--accent); }

  /* ── MEMBERS TABLE ── */
  .table-wrap { border:1px solid var(--border); border-radius:var(--r-lg); overflow:hidden; }
  .table { width:100%; border-collapse:collapse; }
  .table th { background:var(--panel); padding:10px 16px; font-size:9px; text-align:left; color:var(--muted); text-transform:uppercase; letter-spacing:1.5px; font-weight:500; }
  .table td { padding:12px 16px; font-size:11px; border-top:1px solid var(--border); }
  .table tr:hover td { background:rgba(255,255,255,.02); }

  /* ── STATUS DOTS ── */
  .status-dot { width:7px; height:7px; border-radius:50%; display:inline-block; margin-right:6px; }
  .dot-todo { background:var(--muted); }
  .dot-progress { background:#3b82f6; }
  .dot-done { background:var(--success); }

  /* ── EMPTY STATE ── */
  .empty { text-align:center; padding:60px 20px; }
  .empty-icon { font-size:36px; margin-bottom:12px; opacity:.3; }
  .empty-text { font-family:'Syne',sans-serif; font-size:14px; color:var(--muted); margin-bottom:6px; }
  .empty-sub { font-size:10px; color:var(--subtle); }

  /* ── ALERTS ── */
  .alert { padding:10px 14px; border-radius:var(--r); font-size:11px; margin-bottom:16px; }
  .alert-error { background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.3); color:#ef4444; }
  .alert-success { background:rgba(34,197,94,.1); border:1px solid rgba(34,197,94,.3); color:#22c55e; }

  /* ── PROGRESS BAR ── */
  .progress-bar { background:var(--border); border-radius:4px; height:4px; overflow:hidden; margin-top:8px; }
  .progress-fill { height:100%; background:var(--accent); border-radius:4px; transition:.4s ease; }

  /* ── ANIMATIONS ── */
  @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

  /* ── TASK DETAIL PANEL ── */
  .detail-panel {
    position:fixed; right:0; top:0; bottom:0; width:400px; background:var(--surface);
    border-left:1px solid var(--border); padding:28px; overflow-y:auto; z-index:50;
    box-shadow:-8px 0 32px rgba(0,0,0,.4); animation: slidePanel .3s cubic-bezier(.16,1,.3,1);
  }
  @keyframes slidePanel { from { transform:translateX(400px); } to { transform:translateX(0); } }
  .detail-close { position:absolute; right:20px; top:20px; background:var(--panel); border:1px solid var(--border); color:var(--muted); border-radius:6px; padding:5px 9px; cursor:pointer; font-size:12px; transition:.2s; }
  .detail-close:hover { color:var(--text); }

  /* ── STATUS SELECTOR ── */
  .status-pills { display:flex; gap:8px; flex-wrap:wrap; }
  .status-pill { padding:6px 14px; border-radius:20px; font-size:10px; font-weight:600; cursor:pointer; border:2px solid transparent; transition:.2s; }
  .status-pill.todo { background:rgba(107,114,128,.1); color:var(--muted); border-color:var(--border); }
  .status-pill.progress { background:rgba(59,130,246,.1); color:#3b82f6; border-color:rgba(59,130,246,.3); }
  .status-pill.done { background:rgba(34,197,94,.1); color:var(--success); border-color:rgba(34,197,94,.3); }
  .status-pill.active { box-shadow:0 0 0 3px rgba(245,166,35,.3); }

  /* ── FILTERS ── */
  .filters { display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap; align-items:center; }
  .filter-chip { padding:5px 12px; border-radius:20px; font-size:10px; cursor:pointer; border:1px solid var(--border); background:transparent; color:var(--muted); font-family:'JetBrains Mono',monospace; transition:.2s; }
  .filter-chip:hover { border-color:var(--text); color:var(--text); }
  .filter-chip.active { background:var(--accent); color:#000; border-color:var(--accent); font-weight:700; }

  /* ── TOAST ── */
  .toast { position:fixed; bottom:24px; right:24px; background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:12px 18px; font-size:11px; z-index:200; box-shadow:var(--shadow); animation:slideUp .3s ease; display:flex; align-items:center; gap:10px; }
  .toast.success { border-color:rgba(34,197,94,.4); }
  .toast.error { border-color:rgba(239,68,68,.4); }

  /* ── LOADING ── */
  .loading { display:flex; align-items:center; justify-content:center; height:200px; color:var(--muted); font-size:12px; gap:10px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { width:16px; height:16px; border:2px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin .7s linear infinite; }
`;

/* ─── COLORS ────────────────────────────────────────── */
const COLORS = ["#f5a623","#3b82f6","#22c55e","#ef4444","#a855f7","#ec4899","#14b8a6","#f97316"];
const colorFor = str => COLORS[str.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
const initials = name => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

/* ─── CONTEXT ───────────────────────────────────────── */
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

/* ─── TOAST ─────────────────────────────────────────── */
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return (
    <div className={`toast ${type}`}>
      <span>{type === "success" ? "✓" : "✗"}</span>
      {msg}
    </div>
  );
}

/* ─── LOADING SPINNER ───────────────────────────────── */
function Loading() {
  return <div className="loading"><div className="spinner" /> Loading...</div>;
}

/* ─── AUTH SCREEN ───────────────────────────────────── */
function AuthScreen({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    if (tab === "signup") {
      if (!form.name || !form.email || !form.password) {
        setLoading(false);
        return setError("All fields required");
      }
      const { user, error } = await AuthAPI.signup(form.name, form.email, form.password);
      setLoading(false);
      if (error) return setError(error);
      onLogin(user);
    } else {
      if (!form.email || !form.password) {
        setLoading(false);
        return setError("All fields required");
      }
      const { user, error } = await AuthAPI.login(form.email, form.password);
      setLoading(false);
      if (error) return setError(error);
      onLogin(user);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">⬡ TaskFlow</div>
        <div className="auth-tagline">Team Task Management — Collaborative & Efficient</div>
        <div className="auth-tabs">
          {["login","signup"].map(t => (
            <button key={t} className={`auth-tab ${tab === t ? "active" : ""}`}
              onClick={() => { setTab(t); setError(""); }}>
              {t === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {tab === "signup" && (
          <div className="form-row">
            <label>Full Name</label>
            <input placeholder="Jane Smith" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
        )}
        <div className="form-row">
          <label>Email</label>
          <input placeholder="jane@example.com" type="email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="form-row">
          <label>Password</label>
          <input placeholder="••••••••" type="password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyDown={e => e.key === "Enter" && submit()} />
        </div>
        <button className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", marginTop: 8, opacity: loading ? .6 : 1 }}
          onClick={submit} disabled={loading}>
          {loading ? "Please wait..." : tab === "login" ? "→ Sign In" : "→ Create Account"}
        </button>
      </div>
    </div>
  );
}

/* ─── SIDEBAR ───────────────────────────────────────── */
function Sidebar({ page, setPage, overdueCount }) {
  const { user, logout } = useApp();

  const navItems = [
    { id: "dashboard", icon: "▦", label: "Dashboard" },
    { id: "projects",  icon: "◈", label: "Projects" },
    { id: "tasks",     icon: "◻", label: "My Tasks", badge: overdueCount || null },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">Task<span>Flow</span></div>
      <div className="nav-section">Navigation</div>
      {navItems.map(item => (
        <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`}
          onClick={() => setPage(item.id)}>
          <span style={{ fontSize: 14 }}>{item.icon}</span>
          {item.label}
          {item.badge && <span className="nav-badge">{item.badge}</span>}
        </button>
      ))}
      <div className="sidebar-user">
        <div className="user-pill">
          <div className="avatar" style={{ background: colorFor(user.id) + "30", color: colorFor(user.id) }}>
            {initials(user.name)}
          </div>
          <div>
            <div className="user-name">{user.name}</div>
            <div className="user-role">Member</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>Sign Out</button>
      </div>
    </div>
  );
}

/* ─── DASHBOARD ─────────────────────────────────────── */
function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DashboardAPI.get().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div><div className="topbar"><div><div className="page-title">Dashboard</div></div></div><div className="content"><Loading /></div></div>;
  if (!data) return null;

  const { totalTasks = 0, byStatus = {}, overdue = 0, perUser = [], projects = [] } = data;

  const stats = [
    { label: "Total Tasks",  num: totalTasks,           color: "amber", icon: "◻" },
    { label: "In Progress",  num: byStatus.progress||0, color: "blue",  icon: "↻" },
    { label: "Completed",    num: byStatus.done||0,     color: "green", icon: "✓" },
    { label: "Overdue",      num: overdue,              color: "red",   icon: "⚠" },
  ];

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Here's your project overview</div>
        </div>
      </div>
      <div className="content">
        <div className="stats-grid">
          {stats.map(s => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-num">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
          {/* Status Breakdown */}
          <div className="card">
            <div className="card-title" style={{ marginBottom:16 }}>Task Status Breakdown</div>
            {[
              { label:"To Do",       count: byStatus.todo||0,     color:"var(--muted)",   cls:"dot-todo" },
              { label:"In Progress", count: byStatus.progress||0, color:"#3b82f6",        cls:"dot-progress" },
              { label:"Done",        count: byStatus.done||0,     color:"var(--success)", cls:"dot-done" },
            ].map(s => (
              <div key={s.label} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:5 }}>
                  <span><span className={`status-dot ${s.cls}`} />{s.label}</span>
                  <span style={{ color:"var(--muted)" }}>{s.count} / {totalTasks}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: totalTasks ? `${(s.count/totalTasks)*100}%` : "0%", background: s.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* My Projects */}
          <div className="card">
            <div className="card-title" style={{ marginBottom:16 }}>My Projects</div>
            {projects.length === 0
              ? <div style={{ color:"var(--muted)", fontSize:11 }}>No projects yet.</div>
              : projects.slice(0,5).map(p => (
                <div key={p.id} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}>
                    <span style={{ fontFamily:"Syne,sans-serif", fontWeight:600 }}>{p.name}</span>
                    <span className={`project-role ${p.role==="Admin" ? "role-admin" : "role-member"}`}>{p.role}</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--muted)", marginBottom:4 }}>
                    <span>{p.taskCount} tasks</span><span>{p.doneCount} done</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: p.taskCount ? `${(p.doneCount/p.taskCount)*100}%` : "0%" }} />
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Tasks Per User */}
        {perUser.length > 0 && (
          <div className="card">
            <div className="card-title" style={{ marginBottom:16 }}>Tasks Per User</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:12 }}>
              {perUser.map(u => (
                <div key={u.id} style={{ display:"flex", alignItems:"center", gap:8, background:"var(--panel)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 14px" }}>
                  <div className="avatar" style={{ width:24, height:24, fontSize:9, background:colorFor(u.id)+"30", color:colorFor(u.id) }}>{initials(u.name)}</div>
                  <span style={{ fontSize:11 }}>{u.name}</span>
                  <span style={{ fontSize:10, color:"var(--muted)" }}>×{u.taskCount}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── TASK DETAIL PANEL ─────────────────────────────── */
function TaskDetail({ task, projectId, projectRole, onClose, onUpdate, onDelete, members }) {
  const { user } = useApp();
  const isAdmin    = projectRole === "Admin";
  const isAssignee = task.assignee_id === user.id;
  const canEdit    = isAdmin || isAssignee;

  const setStatus = status => onUpdate(task.id, { status });
  const assignee  = members.find(m => m.id === task.assignee_id);

  return (
    <div className="detail-panel">
      <button className="detail-close" onClick={onClose}>✕</button>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:17, marginBottom:6 }}>{task.title}</div>
        <div style={{ fontSize:10, color:"var(--muted)" }}>Created {new Date(task.created_at).toLocaleDateString()}</div>
      </div>

      <div style={{ marginBottom:16 }}>
        <label style={{ display:"block", marginBottom:8 }}>Status</label>
        <div className="status-pills">
          {[["todo","To Do"],["progress","In Progress"],["done","Done"]].map(([s,l]) => (
            <button key={s} className={`status-pill ${s} ${task.status===s?"active":""}`}
              onClick={() => canEdit && setStatus(s)}
              style={{ opacity:canEdit?1:.5, cursor:canEdit?"pointer":"default" }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {task.description && (
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", marginBottom:6 }}>Description</label>
          <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.7, background:"var(--panel)", padding:12, borderRadius:8, border:"1px solid var(--border)" }}>
            {task.description}
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
        <div>
          <label style={{ display:"block", marginBottom:6 }}>Priority</label>
          <span className={`priority-badge priority-${task.priority||"low"}`}>{task.priority||"low"}</span>
        </div>
        <div>
          <label style={{ display:"block", marginBottom:6 }}>Due Date</label>
          <div style={{ fontSize:11, color: task.due_date && new Date(task.due_date) < new Date() && task.status !== "done" ? "var(--danger)" : "var(--muted)" }}>
            {task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}
          </div>
        </div>
      </div>

      <div style={{ marginBottom:20 }}>
        <label style={{ display:"block", marginBottom:6 }}>Assignee</label>
        {assignee ? (
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div className="avatar" style={{ background:colorFor(assignee.id)+"30", color:colorFor(assignee.id) }}>{initials(assignee.name)}</div>
            <div>
              <div style={{ fontSize:11 }}>{assignee.name}</div>
              <div style={{ fontSize:9, color:"var(--muted)" }}>{assignee.email}</div>
            </div>
          </div>
        ) : <div style={{ fontSize:11, color:"var(--muted)" }}>Unassigned</div>}
      </div>

      {isAdmin && (
        <button className="btn btn-danger btn-sm" onClick={() => { onDelete(task.id); onClose(); }}>
          Delete Task
        </button>
      )}
    </div>
  );
}

/* ─── PROJECT VIEW ──────────────────────────────────── */
function ProjectView({ project, onBack, showToast }) {
  const { user }          = useApp();
  const [tasks, setTasks]     = useState([]);
  const [members, setMembers] = useState([]);
  const [role, setRole]       = useState("Member");
  const [loading, setLoading] = useState(true);
  const [showNewTask, setShowNewTask]   = useState(false);
  const [showMembers, setShowMembers]   = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filter, setFilter]   = useState("all");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [form, setForm] = useState({ title:"", description:"", dueDate:"", priority:"medium", assigneeId:"" });

  const reload = useCallback(async () => {
    try {
      const [t, m, r] = await Promise.all([
        TaskAPI.list(project.id),
        ProjectAPI.getMembers(project.id),
        ProjectAPI.getUserRole(project.id),
      ]);
      setTasks(t);
      setMembers(m);
      setRole(r || "Member");
    } catch(e) { showToast("Failed to load project data", "error"); }
    setLoading(false);
  }, [project.id]);

  useEffect(() => { reload(); }, [reload]);

  const isAdmin = role === "Admin";

  const createTask = async () => {
    if (!form.title) return;
    try {
      await TaskAPI.create({ ...form, projectId: project.id });
      setForm({ title:"", description:"", dueDate:"", priority:"medium", assigneeId:"" });
      setShowNewTask(false);
      await reload();
      showToast("Task created", "success");
    } catch(e) { showToast(e.message, "error"); }
  };

  const updateTask = async (id, updates) => {
    try {
      await TaskAPI.update(project.id, id, updates);
      await reload();
      if (selectedTask?.id === id) setSelectedTask(t => ({ ...t, ...updates }));
    } catch(e) { showToast(e.message, "error"); }
  };

  const deleteTask = async id => {
    try {
      await TaskAPI.delete(project.id, id);
      await reload();
      showToast("Task deleted", "success");
    } catch(e) { showToast(e.message, "error"); }
  };

  const addMember = async () => {
    const { error } = await ProjectAPI.addMember(project.id, newMemberEmail);
    if (error) return showToast(error, "error");
    setNewMemberEmail("");
    await reload();
    showToast("Member added", "success");
  };

  const filtered = tasks.filter(t => {
    if (filter === "mine")     return t.assignee_id === user.id;
    if (filter === "overdue")  return t.status !== "done" && t.due_date && new Date(t.due_date) < new Date();
    if (["todo","progress","done"].includes(filter)) return t.status === filter;
    return true;
  });

  const cols = [
    { id:"todo",     label:"To Do",       dot:"dot-todo" },
    { id:"progress", label:"In Progress", dot:"dot-progress" },
    { id:"done",     label:"Done",        dot:"dot-done" },
  ];

  if (loading) return (
    <div>
      <div className="topbar">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom:6 }}>← Back</button>
          <div className="page-title">{project.name}</div>
        </div>
      </div>
      <div className="content"><Loading /></div>
    </div>
  );

  return (
    <div>
      <div className="topbar">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom:6 }}>← Back</button>
          <div className="page-title">{project.name}</div>
          <div className="page-sub">{project.description}</div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowMembers(true)}>
            👥 Members ({members.length})
          </button>
          {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setShowNewTask(true)}>+ New Task</button>}
        </div>
      </div>

      <div className="content">
        <div className="filters">
          {[["all","All"],["mine","Mine"],["overdue","Overdue"],["todo","To Do"],["progress","In Progress"],["done","Done"]].map(([id,label]) => (
            <button key={id} className={`filter-chip ${filter===id?"active":""}`} onClick={() => setFilter(id)}>{label}</button>
          ))}
        </div>

        <div className="board">
          {cols.map(col => {
            const colTasks = filtered.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="board-col">
                <div className="col-header">
                  <div className="col-title"><span className={`status-dot ${col.dot}`} />{col.label}</div>
                  <div className="col-count">{colTasks.length}</div>
                </div>
                {colTasks.map(task => {
                  const assignee  = members.find(m => m.id === task.assignee_id);
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                  return (
                    <div key={task.id} className="task-card" onClick={() => setSelectedTask(task)}>
                      <div className="task-title">{task.title}</div>
                      {task.description && <div className="task-desc">{task.description}</div>}
                      <div className="task-footer">
                        <span className={`priority-badge priority-${task.priority||"low"}`}>{task.priority||"low"}</span>
                        {task.due_date && (
                          <span className={`due-date ${isOverdue && task.status!=="done" ? "overdue":""}`}>
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                        {assignee && (
                          <div className="assignee-chip" style={{ background:colorFor(assignee.id)+"40", color:colorFor(assignee.id), marginLeft:"auto" }}>
                            {initials(assignee.name)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isAdmin && col.id === "todo" && (
                  <button className="add-btn" onClick={() => setShowNewTask(true)}>+ Add task</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* New Task Modal */}
      {showNewTask && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowNewTask(false)}>
          <div className="modal">
            <div className="modal-title">Create Task</div>
            <div className="modal-sub">Add a new task to {project.name}</div>
            <div className="form-row"><label>Title *</label><input placeholder="Task title" value={form.title} onChange={e => setForm({...form,title:e.target.value})} /></div>
            <div className="form-row"><label>Description</label><textarea placeholder="What needs to be done..." value={form.description} onChange={e => setForm({...form,description:e.target.value})} /></div>
            <div className="form-grid">
              <div><label>Priority</label>
                <select value={form.priority} onChange={e => setForm({...form,priority:e.target.value})}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </div>
              <div><label>Due Date</label><input type="date" value={form.dueDate} onChange={e => setForm({...form,dueDate:e.target.value})} /></div>
            </div>
            <div className="form-row">
              <label>Assign To</label>
              <select value={form.assigneeId} onChange={e => setForm({...form,assigneeId:e.target.value})}>
                <option value="">— Unassigned —</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowNewTask(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createTask}>Create Task</button>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembers && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowMembers(false)}>
          <div className="modal" style={{ width:520 }}>
            <div className="modal-title">Team Members</div>
            <div className="modal-sub">{members.length} member{members.length!==1?"s":""} in this project</div>
            <div className="table-wrap" style={{ marginBottom:20 }}>
              <table className="table">
                <thead><tr><th>Member</th><th>Role</th>{isAdmin && <th></th>}</tr></thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id}>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div className="avatar" style={{ background:colorFor(m.id)+"30", color:colorFor(m.id) }}>{initials(m.name)}</div>
                          <div><div style={{ fontSize:11 }}>{m.name}</div><div style={{ fontSize:9, color:"var(--muted)" }}>{m.email}</div></div>
                        </div>
                      </td>
                      <td><span className={`project-role ${m.role==="Admin"?"role-admin":"role-member"}`}>{m.role}</span></td>
                      {isAdmin && (
                        <td>
                          {m.id !== user.id && (
                            <button className="btn btn-danger btn-sm" onClick={async () => {
                              await ProjectAPI.removeMember(project.id, m.id);
                              await reload();
                              showToast("Member removed","success");
                            }}>Remove</button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {isAdmin && (
              <div>
                <label>Add Member by Email</label>
                <div style={{ display:"flex", gap:8, marginTop:6 }}>
                  <input placeholder="user@example.com" value={newMemberEmail}
                    onChange={e => setNewMemberEmail(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && addMember()} />
                  <button className="btn btn-primary" onClick={addMember} style={{ whiteSpace:"nowrap" }}>+ Add</button>
                </div>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowMembers(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          projectId={project.id}
          projectRole={role}
          members={members}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
}

/* ─── PROJECTS PAGE ─────────────────────────────────── */
function ProjectsPage({ showToast }) {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [form, setForm] = useState({ name:"", description:"" });

  const reload = async () => {
    try { setProjects(await ProjectAPI.list()); }
    catch(e) { showToast("Failed to load projects", "error"); }
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  if (selected) return <ProjectView project={selected} onBack={() => { setSelected(null); reload(); }} showToast={showToast} />;

  const create = async () => {
    if (!form.name) return;
    try {
      await ProjectAPI.create(form.name, form.description);
      setForm({ name:"", description:"" });
      setShowNew(false);
      await reload();
      showToast("Project created","success");
    } catch(e) { showToast(e.message,"error"); }
  };

  if (loading) return (
    <div>
      <div className="topbar"><div><div className="page-title">Projects</div></div></div>
      <div className="content"><Loading /></div>
    </div>
  );

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="page-title">Projects</div>
          <div className="page-sub">Manage your team projects</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New Project</button>
      </div>
      <div className="content">
        {projects.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">◈</div>
            <div className="empty-text">No projects yet</div>
            <div className="empty-sub">Create your first project to get started</div>
            <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => setShowNew(true)}>Create Project</button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(p => (
              <div key={p.id} className="project-card" onClick={() => setSelected(p)}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div className="project-name">{p.name}</div>
                  <span className={`project-role ${p.role==="Admin"?"role-admin":"role-member"}`}>{p.role}</span>
                </div>
                <div className="project-desc">{p.description||"No description"}</div>
                <div className="project-meta">
                  <span>◻ {p.taskCount||0} tasks</span>
                  <span>👥 {p.memberCount||0} members</span>
                  <span>✓ {p.doneCount||0} done</span>
                </div>
                {(p.taskCount||0) > 0 && (
                  <div className="progress-bar" style={{ marginTop:10 }}>
                    <div className="progress-fill" style={{ width:`${((p.doneCount||0)/(p.taskCount||1))*100}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showNew && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowNew(false)}>
          <div className="modal">
            <div className="modal-title">New Project</div>
            <div className="modal-sub">You'll be set as Admin of this project</div>
            <div className="form-row"><label>Project Name *</label><input placeholder="e.g. Website Redesign" value={form.name} onChange={e => setForm({...form,name:e.target.value})} /></div>
            <div className="form-row"><label>Description</label><textarea placeholder="What is this project about?" value={form.description} onChange={e => setForm({...form,description:e.target.value})} /></div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={create}>Create Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── MY TASKS PAGE ─────────────────────────────────── */
function MyTasksPage({ showToast }) {
  const { user }    = useApp();
  const [allTasks, setAllTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);

  const reload = async () => {
    try {
      const projs = await ProjectAPI.list();
      setProjects(projs);
      const taskLists = await Promise.all(projs.map(p => TaskAPI.list(p.id)));
      const mine = taskLists.flat().filter(t => t.assignee_id === user.id);
      setAllTasks(mine);
    } catch(e) { showToast("Failed to load tasks","error"); }
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const filtered = allTasks.filter(t => {
    if (filter === "overdue") return t.status!=="done" && t.due_date && new Date(t.due_date)<new Date();
    if (["todo","progress","done"].includes(filter)) return t.status===filter;
    return true;
  });

  const updateTask = async (id, updates) => {
    const task = allTasks.find(t => t.id === id);
    if (!task) return;
    try {
      await TaskAPI.update(task.project_id, id, updates);
      await reload();
      if (selectedTask?.id === id) setSelectedTask(t => ({...t,...updates}));
    } catch(e) { showToast(e.message,"error"); }
  };

  const getProjectName = projectId => projects.find(p => p.id === projectId)?.name || "—";
  const getProjectRole = projectId => projects.find(p => p.id === projectId)?.role || "Member";

  if (loading) return (
    <div>
      <div className="topbar"><div><div className="page-title">My Tasks</div></div></div>
      <div className="content"><Loading /></div>
    </div>
  );

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="page-title">My Tasks</div>
          <div className="page-sub">Tasks assigned to you across all projects</div>
        </div>
      </div>
      <div className="content">
        <div className="filters">
          {[["all","All"],["overdue","Overdue"],["todo","To Do"],["progress","In Progress"],["done","Done"]].map(([id,label]) => (
            <button key={id} className={`filter-chip ${filter===id?"active":""}`} onClick={() => setFilter(id)}>{label}</button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">◻</div>
            <div className="empty-text">No tasks here</div>
            <div className="empty-sub">Tasks assigned to you will appear here</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Task</th><th>Project</th><th>Priority</th><th>Status</th><th>Due Date</th></tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const isOverdue = t.due_date && new Date(t.due_date)<new Date() && t.status!=="done";
                  return (
                    <tr key={t.id} onClick={() => setSelectedTask(t)} style={{ cursor:"pointer" }}>
                      <td style={{ fontFamily:"Syne,sans-serif", fontWeight:600, fontSize:12 }}>{t.title}</td>
                      <td style={{ color:"var(--muted)", fontSize:10 }}>{getProjectName(t.project_id)}</td>
                      <td><span className={`priority-badge priority-${t.priority||"low"}`}>{t.priority||"low"}</span></td>
                      <td>
                        <span style={{ display:"flex", alignItems:"center", fontSize:10, color: t.status==="done"?"var(--success)":t.status==="progress"?"#3b82f6":"var(--muted)" }}>
                          <span className={`status-dot ${t.status==="done"?"dot-done":t.status==="progress"?"dot-progress":"dot-todo"}`} />
                          {t.status==="todo"?"To Do":t.status==="progress"?"In Progress":"Done"}
                        </span>
                      </td>
                      <td style={{ fontSize:10, color:isOverdue?"var(--danger)":"var(--muted)" }}>
                        {t.due_date ? new Date(t.due_date).toLocaleDateString() : "—"}
                        {isOverdue && " ⚠"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          projectId={selectedTask.project_id}
          projectRole={getProjectRole(selectedTask.project_id)}
          members={[]}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
          onDelete={async id => {
            await TaskAPI.delete(selectedTask.project_id, id);
            await reload();
            setSelectedTask(null);
            showToast("Task deleted","success");
          }}
        />
      )}
    </div>
  );
}

/* ─── ROOT APP ──────────────────────────────────────── */
export default function App() {
  const [user, setUser]   = useState(null);
  const [page, setPage]   = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [overdueCount, setOverdueCount] = useState(0);

  // Restore session from token
  useEffect(() => {
    const saved = localStorage.getItem("ttm_user");
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
  }, []);

  const login = u => {
    setUser(u);
    localStorage.setItem("ttm_user", JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    AuthAPI.logout();
    localStorage.removeItem("ttm_user");
  };

  const showToast = (msg, type = "success") => setToast({ msg, type });

  return (
    <>
      <style>{STYLES}</style>
      <AppCtx.Provider value={{ user, logout, showToast }}>
        {!user ? (
          <AuthScreen onLogin={login} />
        ) : (
          <div className="app">
            <Sidebar page={page} setPage={setPage} overdueCount={overdueCount} />
            <div className="main">
              {page === "dashboard" && <Dashboard />}
              {page === "projects"  && <ProjectsPage showToast={showToast} />}
              {page === "tasks"     && <MyTasksPage  showToast={showToast} />}
            </div>
          </div>
        )}
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </AppCtx.Provider>
    </>
  );
}
