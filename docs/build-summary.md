# Support Ticketing Portal — Build Summary

## All 6 Spec Sections Implemented

| Section | Status | Notes |
|---------|--------|-------|
| Auth and Roles | Done | JWT, bcrypt, 3 roles, server-side RBAC middleware |
| Ticket CRUD | Done | Full schema, status machine, DB-layer visibility, pagination, text search |
| Assignment and Conversation | Done | Admin-only assign, comments, internal notes stripped server-side, activity log |
| AI Triage | Done | OpenAI/Anthropic/mock fallback, fallback flag, stored separately, draft reply in UI |
| Dashboard | Done | 4 MongoDB aggregation pipelines, Recharts pie and bar charts |
| Technical | Done | Swagger, centralized error handler, express-validator, .env.example, seed, Jest tests |

## How to Run

```bash
# Docker Compose (one command)
docker compose up --build

# Seed demo data (after containers healthy ~30s)
docker exec support_backend node src/scripts/seed.js

# Open http://localhost:3000
# Use the quick-fill buttons on the login page for each role
```
