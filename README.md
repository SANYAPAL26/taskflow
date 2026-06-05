# ⬡ TaskFlow

> **Team Task Management — Collaborative & Efficient**

A full-stack task management application built with React and Node.js. Create projects, invite team members, assign tasks, and track progress — all in one place.

🌐 **Live Demo:** [https://aware-clarity-production-de38.up.railway.app](https://aware-clarity-production-de38.up.railway.app)

---

## ✨ Features

- 🔐 **Authentication** — Secure signup & login with JWT tokens
- 📁 **Projects** — Create and manage multiple projects
- 👥 **Team Members** — Invite members by email, assign roles (Admin / Member)
- ✅ **Tasks** — Create, assign, prioritize, and track tasks
- 📊 **Dashboard** — Overview of tasks by status, overdue count, and per-member stats
- 🎯 **Role-based Access** — Admins manage tasks; Members update their own task status

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite |
| Backend | Node.js, Express |
| Database | SQLite (via sql.js) |
| Auth | JWT + bcryptjs |
| Deployment | Railway |

---

## 📁 Project Structure

```
Taskflow/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express server entry point
│   │   ├── models/
│   │   │   └── db.js         # SQLite database & schema
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT authentication middleware
│   │   └── routes/
│   │       ├── auth.js       # /api/auth (signup, login, me)
│   │       ├── projects.js   # /api/projects (CRUD + members)
│   │       ├── tasks.js      # /api/projects/:id/tasks (CRUD)
│   │       └── dashboard.js  # /api/dashboard (stats)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── main.jsx          # React entry point
    │   ├── app.jsx           # Main app component
    │   └── api-client.js     # API fetch wrapper
    ├── index.html
    └── package.json
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js v22+
- npm

### Backend

```bash
cd backend
npm install
node src/index.js
```

Server runs on **http://localhost:4000**

### Frontend

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:4000" > .env
npm run dev
```

App runs on **http://localhost:5173**

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user info |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects for current user |
| POST | `/api/projects` | Create a new project |
| GET | `/api/projects/:id` | Get project details |
| DELETE | `/api/projects/:id` | Delete project (Admin only) |

### Members
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/members` | List project members |
| POST | `/api/projects/:id/members` | Add a member by email |
| PATCH | `/api/projects/:id/members/:userId` | Change member role |
| DELETE | `/api/projects/:id/members/:userId` | Remove a member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/tasks` | List tasks (filterable) |
| POST | `/api/projects/:id/tasks` | Create a task (Admin only) |
| GET | `/api/projects/:id/tasks/:taskId` | Get task details |
| PATCH | `/api/projects/:id/tasks/:taskId` | Update task |
| DELETE | `/api/projects/:id/tasks/:taskId` | Delete task (Admin only) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get stats (task counts, overdue, per-user) |

---

## 🌍 Deployment (Railway)

### Backend
- Root Directory: `backend`
- Start Command: `node src/index.js`
- Environment Variables:
  - `JWT_SECRET` — your secret key
  - `PORT` — `4000`

### Frontend
- Root Directory: `frontend`
- Build Command: `npm install --include=dev && npm run build`
- Start Command: `npx serve dist -l $PORT`
- Environment Variables:
  - `VITE_API_URL` — your backend Railway URL

---

## 👤 Roles & Permissions

| Action | Admin | Member |
|--------|-------|--------|
| Create/delete tasks | ✅ | ❌ |
| Update task status | ✅ | ✅ (own tasks only) |
| Add/remove members | ✅ | ❌ |
| View all tasks | ✅ | ✅ |
| Delete project | ✅ | ❌ |

---

## 📄 License

MIT
