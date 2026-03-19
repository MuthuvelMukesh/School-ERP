# School ERP System

A full-stack School Management platform built with Next.js 14, Express, Prisma, and PostgreSQL.

This README is the single source of truth for setup, architecture, module status, testing, and next steps.

## Current Status

- Frontend and backend modules are implemented across academics, operations, and administration.
- API endpoint regression suite is passing with zero failures.
- Remaining skipped checks are test-data precondition skips.

Latest endpoint suite result (`node test-all-endpoints.js`):
- Passed: `171`
- Failed: `0`
- Skipped: `2`
- Total: `173`

## Module Coverage

| Module | Backend | Frontend |
|---|---|---|
| Authentication | Yes | Yes |
| Dashboard | Yes | Yes |
| Students | Yes | Yes |
| Staff | Yes | Yes |
| Attendance | Yes | Yes |
| Timetable | Yes | Yes |
| Exams | Yes | Yes |
| Fees | Yes | Yes |
| Notifications | Yes | Yes |
| LMS | Yes | Yes |
| File Management | Yes | Yes |
| Library | Yes | Yes |
| Transport | Yes | Yes |
| Hostel | Yes | Yes |
| Payments | Yes | Yes |
| Permissions | Yes | Yes |
| Activity Log | Yes | Yes |
| Student Progression (promotion/transfer) | Yes | Yes |

## Architecture

### Backend
- Runtime: Node.js + Express
- ORM: Prisma
- Database: PostgreSQL
- Auth: JWT + role-based authorization
- Security: Helmet, CORS, rate limiting, input sanitization
- Uploads: Multer with authenticated static access

Entrypoint: `backend/src/server.js`

Route groups mounted under `/api`:
- `auth`, `students`, `staff`, `fees`, `attendance`, `timetable`, `exams`, `dashboard`
- `notifications`, `activities`, `files`, `payments`, `library`, `transport`, `hostel`, `lms`, `metadata`, `permissions`

Health endpoint:
- `GET /api/health`

### Frontend
- Framework: Next.js 14 App Router (React 18 + TypeScript)
- Styling: Tailwind CSS
- API client: Axios (`frontend/lib/api.ts`)
- Auth state: token/localStorage driven client session helpers

## Repository Layout

```text
School-ERP/
  backend/
    prisma/
      schema.prisma
      migrations/
      seed.js
      seed-all.js
    src/
      controllers/
      middleware/
      routes/
      utils/
      server.js
  frontend/
    app/
    lib/
    public/
  docker-compose.yml
  test-all-endpoints.js
```

## ER Diagrams

- Simplified diagram: `er-diagram.html`
- Mermaid source: `er-diagram.mmd`
- Full Chen diagram page: `frontend/public/er-diagram-full-chen.html`

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL 14+ (or Docker)

## Local Development Setup

### 1. Install dependencies

From repository root:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. Configure environment files

Backend:

```bash
cp backend/.env.example backend/.env
```

Set at minimum in `backend/.env`:
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`

Frontend:

```bash
cp frontend/.env.local.example frontend/.env.local
```

Recommended in `frontend/.env.local`:
- `NEXT_PUBLIC_API_URL=http://localhost:5000/api`

### 3. Run database migrations and seed

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

### 4. Start app

From repository root (starts backend + frontend):

```bash
npm run dev
```

Or run individually:

```bash
npm run dev:backend
npm run dev:frontend
```

Local URLs:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
- Health: `http://localhost:5000/api/health`

## Docker Setup

Start stack (frontend, backend, postgres):

```bash
docker compose up -d
```

Stop stack:

```bash
docker compose down
```

Notes:
- `docker-compose.yml` maps PostgreSQL to host port `5434`.
- Containers: `school-erp-db`, `school-erp-backend`, `school-erp-frontend`.

## Default/Test Credentials

Seeded admin used in local regression runs:
- Email: `admin@school.com`
- Password: `Admin@123`

## Testing

### Backend tests

```bash
npm --prefix backend test
```

### Full API endpoint regression

```bash
node test-all-endpoints.js
```

## Known Constraints

- Cleanup delete calls may return `500` when foreign-key dependencies exist in test data.
- Two suite checks can skip when metadata prerequisites are missing:
  - `POST /timetable`
  - `POST /lms`

## Security Notes

- Do not use placeholder secrets from example env files in production.
- Rotate `JWT_SECRET` and SMTP credentials before deployment.
- Restrict `FRONTEND_URL`/CORS to trusted origins.

## Next Steps

1. Make endpoint suite fully deterministic by auto-provisioning timetable/LMS prerequisites in the test harness.
2. Add CI pipeline steps for frontend build, backend tests, and endpoint regression against an ephemeral database.
3. Add production deployment runbook (backup, migration rollout, rollback).
4. Add role-specific smoke tests for Parent and Student flows.
5. Add centralized request IDs and structured log shipping for better observability.

## License

MIT. See `LICENSE`.
