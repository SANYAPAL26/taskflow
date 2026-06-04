/**
 * db.js — sql.js wrapper with better-sqlite3-compatible API
 * Drop-in replacement that works on Windows without Visual Studio.
 */

const initSqlJs = require("sql.js");
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "../../data/taskflow.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// ── sql.js is async to init, so we expose a promise ──────────
let _db = null;

function getDb() {
  if (!_db) throw new Error("Database not initialised yet. Await dbReady first.");
  return _db;
}

// ── Persistence helpers ───────────────────────────────────────
function saveDb() {
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// ── better-sqlite3-compatible Statement wrapper ───────────────
class Statement {
  constructor(sql) {
    this.sql = sql;
  }

  // Bind values and return rows as objects
  _exec(params = []) {
    const db = getDb();
    const stmt = db.prepare(this.sql);
    const cols = stmt.getColumnNames();
    const rows = [];
    stmt.bind(params);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      // sql.js returns numbers for INTEGER columns; keep as-is
      rows.push(row);
    }
    stmt.free();
    return { cols, rows };
  }

  // Returns first matching row or undefined
  get(...params) {
    const { rows } = this._exec(params.flat());
    return rows[0] ?? undefined;
  }

  // Returns all matching rows
  all(...params) {
    const { rows } = this._exec(params.flat());
    return rows;
  }

  // Executes a write statement, returns { changes, lastInsertRowid }
  run(...params) {
    const db = getDb();
    db.run(this.sql, params.flat());
    const changes = db.getRowsModified();
    saveDb(); // persist after every write
    return { changes, lastInsertRowid: null };
  }
}

// ── Thin db façade matching the better-sqlite3 surface area ───
const dbFacade = {
  prepare(sql) {
    return new Statement(sql);
  },

  exec(sql) {
    getDb().run(sql);
    saveDb();
  },

  pragma(sql) {
    // sql.js handles pragmas through run(); ignore WAL (not supported)
    try { getDb().run(`PRAGMA ${sql}`); } catch (_) {}
  },
};

// ── Schema ────────────────────────────────────────────────────
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    creator_id  TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS memberships (
    id          TEXT PRIMARY KEY,
    project_id  TEXT NOT NULL,
    user_id     TEXT NOT NULL,
    role        TEXT NOT NULL CHECK(role IN ('Admin','Member')) DEFAULT 'Member',
    joined_at   TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id          TEXT PRIMARY KEY,
    project_id  TEXT NOT NULL,
    creator_id  TEXT NOT NULL,
    assignee_id TEXT,
    title       TEXT NOT NULL,
    description TEXT,
    priority    TEXT NOT NULL CHECK(priority IN ('low','medium','high')) DEFAULT 'medium',
    status      TEXT NOT NULL CHECK(status IN ('todo','progress','done'))  DEFAULT 'todo',
    due_date    TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id)  REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_id)  REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (assignee_id) REFERENCES users(id)    ON DELETE SET NULL
  );
`;

// ── Boot: initialise sql.js, load or create DB file ──────────
const dbReady = initSqlJs().then((SQL) => {
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }

  // Apply schema
  _db.run(SCHEMA);
  saveDb();

  return dbFacade;
});

// Attach the promise so index.js can await it before listen()
dbFacade.ready = dbReady;

module.exports = dbFacade;