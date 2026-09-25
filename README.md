# Support Ticketing Portal with AI Triage

A full-stack MVP customer support ticketing system featuring AI-powered ticket classification, role-based access control, real-time conversation threads, and an admin analytics dashboard.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Demo Credentials](#demo-credentials)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Assumptions & Known Limitations](#assumptions--known-limitations)
- [What's Next](#whats-next)
- [AI Tooling Used](#ai-tooling-used)

---

## Quick Start

### Option A — Docker Compose (recommended, one command)

**Prerequisites:** Docker Desktop installed and running.

```bash
# 1. Clone / enter the project
cd "Getup Solution"

# 2. Copy backend environment file
cp backend/.env.example backend/.env
# Optionally set AI_API_KEY in backend/.env for real AI triage
# Leave it blank to use the deterministic mock fallback automatically

# 3. Start all three services (MongoDB + backend + frontend)
docker compose up --build

# 4. Seed demo data (in a new terminal, after containers are healthy)
docker exec support_backend node src/scripts/seed.js
```

Services:
| Service | URL |
|---------|-----|
| Frontend (Next.js) | http://localhost:3000 |
| Backend API (Express) | http://localhost:5000/api |
| Swagger UI | http://localhost:5000/api-docs |
| MongoDB | localhost:27017 |

---

### Option B — Manual (without Docker)

**Prerequisites:** Node.js 20+, MongoDB 7+ running locally.

```bash
# ── Backend ──────────────────────────────────────────────────────
cd backend
cp .env.example .env
# Edit .env: set MONGO_URI=mongodb://localhost:27017/supportdb

npm install
npm run seed          # seed demo users + tickets
npm run dev           # starts on :5000

# ── Frontend (new terminal) ───────────────────────────────────────
cd frontend
cp .env.example .env.local
# .env.local is auto-loaded by Next.js

npm install
npm run dev           # starts on :3000
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Express server port |
| `NODE_ENV` | No | `development` | `development` / `production` / `test` |
| `MONGO_URI` | Yes | — | Full MongoDB connection string |
| `JWT_SECRET` | Yes | — | Secret for signing JWT tokens |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiry (e.g. `1d`, `7d`) |
| `AI_PROVIDER` | No | `openai` | `openai` \| `anthropic` \| `mock` |
| `AI_API_KEY` | No | `""` | API key — leave blank for mock fallback |
| `UPLOAD_DIR` | No | `./uploads` | Directory for file attachments |
| `MAX_FILE_SIZE_MB` | No | `10` | Max upload size |
| `FRONTEND_URL` | No | `http://localhost:3000` | CORS allowed origin |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:5000/api` | Backend API base URL |

---

## Demo Credentials

Seeded by `npm run seed` (or `docker exec support_backend node src/scripts/seed.js`):

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@example.com` | `Admin1234!` |
| **Agent** | `agent@example.com` | `Agent1234!` |
| **Customer** | `customer@example.com` | `Customer1234!` |

> **Tip:** The login page has quick-fill buttons for each role — just click and submit.

---

## Project Structure

```
.
├── docker-compose.yml
├── .gitignore
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js           # Express entry point
│       ├── config/
│       │   ├── database.js     # Mongoose connection
│       │   └── swagger.js      # OpenAPI spec config
│       ├── models/
│       │   ├── User.js         # User schema (bcrypt, roles)
│       │   └── Ticket.js       # Ticket schema (comments, activity, AI suggestion)
│       ├── middleware/
│       │   ├── auth.js         # JWT authenticate + role authorize
│       │   ├── errorHandler.js # Centralized error handler
│       │   ├── validate.js     # express-validator runner
│       │   └── upload.js       # Multer disk storage
│       ├── routes/             # Express routers + Swagger JSDoc
│       ├── controllers/        # Business logic
│       ├── services/
│       │   └── aiService.js    # OpenAI / Anthropic / mock triage
│       ├── utils/
│       │   ├── AppError.js     # Custom error class
│       │   └── tokenUtils.js   # JWT sign/send
│       ├── scripts/
│       │   └── seed.js         # Demo data seeder
│       └── tests/
│           ├── testDb.js       # In-memory MongoDB helper
│           ├── auth.test.js    # Auth test suite
│           └── tickets.test.js # Ticket + RBAC test suite
│
├── frontend/
│   ├── Dockerfile
│   ├── .env.example
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── app/
│   │   ├── layout.tsx          # Root layout + AuthProvider
│   │   ├── page.tsx            # Root redirect to /login
│   │   ├── login/page.tsx      # Login page
│   │   ├── register/page.tsx   # Registration page
│   │   └── dashboard/
│   │       ├── layout.tsx      # Auth guard + sidebar
│   │       ├── page.tsx        # Dashboard overview
│   │       ├── tickets/
│   │       │   ├── page.tsx    # Ticket list with filters
│   │       │   ├── new/page.tsx
│   │       │   └── [id]/page.tsx  # Ticket detail
│   │       ├── users/page.tsx  # Admin user management
│   │       └── analytics/page.tsx # Admin analytics charts
│   ├── components/
│   │   ├── layout/sidebar.tsx
│   │   └── ui/                 # shadcn-compatible components
│   ├── lib/
│   │   ├── api.ts              # Axios client + typed API functions
│   │   ├── auth-context.tsx    # AuthProvider + useAuth hook
│   │   └── utils.ts            # cn, date helpers, status utilities
│   └── hooks/
│       └── use-toast.ts
│
└── docs/
    └── architecture.md         # AWS architecture diagram + explanation
```

---

## Running Tests

```bash
cd backend
npm test
```

Tests use **Jest + Supertest** with **mongodb-memory-server** — no real MongoDB needed:

| Suite | Coverage |
|-------|---------|
| `auth.test.js` | Register (success, duplicate, invalid), login (success, wrong password, bad email), protected route token validation |
| `tickets.test.js` | Ticket creation, AI fallback path, AI suggestion isolation, RBAC visibility, assignment permissions, status workflow, internal note filtering |

---

## API Documentation

Interactive Swagger UI available at **http://localhost:5000/api-docs** when the backend is running.

### Key Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | Public | Register user |
| `POST` | `/api/auth/login` | Public | Login, returns JWT |
| `GET` | `/api/auth/me` | Any | Current user info |
| `GET` | `/api/tickets` | Any | List tickets (visibility by role) |
| `POST` | `/api/tickets` | Any | Create ticket + AI triage |
| `GET` | `/api/tickets/:id` | Owner/Agent/Admin | Get ticket details |
| `PATCH` | `/api/tickets/:id/status` | Agent/Admin | Update status (workflow validated) |
| `PATCH` | `/api/tickets/:id/assign` | Admin | Assign/reassign to agent |
| `POST` | `/api/tickets/:id/comments` | Owner/Agent/Admin | Add comment or internal note |
| `GET` | `/api/tickets/:id/activity` | Owner/Agent/Admin | Activity log |
| `POST` | `/api/tickets/:id/ai-suggestion/accept` | Agent/Admin | Accept AI suggestion |
| `GET` | `/api/dashboard/stats` | Admin | Aggregated analytics |
| `GET` | `/api/users/agents` | Admin | List agents for assignment |

---

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for the full AWS architecture diagram and hosting explanation covering:

- ECS Fargate (frontend + API)
- MongoDB Atlas / DocumentDB
- S3 with presigned URLs
- AWS Secrets Manager
- CloudWatch logging
- GitHub Actions CI/CD

---

## Assumptions & Known Limitations

### Assumptions Made

1. **Role self-assignment on registration is allowed** for demo purposes. In production, admin creation should require an existing admin's invitation or be done via a separate admin CLI.

2. **JWT is stateless** — logout tells the client to discard the token but the server doesn't blacklist it. A production system would use short-lived access tokens (15 min) + refresh tokens stored in HttpOnly cookies.

3. **File uploads use local disk** (`./uploads/`) with a UUID-named file strategy. The `buildAttachmentMeta()` function in `upload.js` is the only place that needs changing to store S3 keys instead of local paths.

4. **MongoDB text search** requires a text index (created in `Ticket.js`) and works on title + description. For production, Elasticsearch/Atlas Search would give better relevance ranking.

5. **AI triage is best-effort** — it runs after ticket creation succeeds, so a slow or failing AI call never blocks the customer. The `fallback: true` flag in `aiSuggestion` tells agents the classification was heuristic, not AI-generated.

6. **Rate limiting** is set to 200 req/15 min per IP — appropriate for dev/demo. Production should tune this per endpoint.

### Known Limitations

- No email notifications (on ticket creation, assignment, status change).
- No real-time updates (WebSocket/SSE) — the UI requires a page refresh to see new comments.
- File attachments served from Express static middleware — not suitable for high-traffic production (use S3 presigned URLs).
- No pagination on the activity log or comments.
- No admin UI for deactivating/promoting users (API model supports `isActive`, UI doesn't expose it).
- Tests cover the critical paths; edge cases (e.g. file upload, concurrent status changes) are not yet tested.

---

## What's Next (Given More Time)

1. **Real-time updates** — WebSocket or SSE channel so agents see new comments without refreshing.
2. **Email notifications** — Nodemailer/SendGrid on ticket creation, assignment, and status change.
3. **Presigned S3 URLs** — swap `upload.js` storage to S3 and return presigned download URLs.
4. **Refresh tokens** — short-lived access tokens + HttpOnly cookie refresh token rotation.
5. **Elasticsearch** — replace MongoDB text search for better full-text relevance.
6. **Rate limiting per user** (post-auth) instead of per IP, using Redis.
7. **Audit log export** — CSV/PDF download of the activity log per ticket.
8. **Agent performance metrics** — avg response time, tickets resolved per agent.
9. **SLA tracking** — configurable SLA per priority, breach alerts.
10. **Test coverage** — e2e tests with Playwright, more unit tests for AI service mock.

---

## AI Tooling Used

This project was built with **Google Antigravity (AGY) / Gemini** as the primary AI coding assistant. Here's specifically what was used and how:

| Task | Tool / Usage |
|------|-------------|
| Project scaffolding | AGY generated the entire file/directory structure from a detailed spec |
| Backend models | AGY authored the Mongoose schemas with indexes, virtual methods, and JSDoc |
| Auth middleware | AGY wrote JWT auth + RBAC middleware with explicit server-side enforcement |
| AI triage service | AGY designed the pluggable provider pattern with try/catch fallback |
| MongoDB aggregations | AGY wrote all 4 dashboard aggregation pipelines (status, priority, resolution time, stalled tickets) |
| React components | AGY built all Next.js App Router pages with Tailwind + Radix UI |
| Test suites | AGY generated Jest + Supertest tests covering auth, RBAC, and AI fallback path |
| Architecture diagram | AGY produced the Mermaid diagram and AWS hosting explanation |
| README | AGY authored this document |


