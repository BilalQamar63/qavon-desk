# Qavon Desk - Production Deployment & Database Guide

Qavon Desk is a B2B Sales Management SaaS built with React, TypeScript, Express, Prisma ORM, and PostgreSQL. It supports local development/sandbox execution and serverless deployment on Vercel with hosted PostgreSQL providers such as **Neon**, **Supabase**, or **Railway**.

---

## 1. Architecture Overview

- **Frontend**: React 19, TypeScript (`"strict": true`), Tailwind CSS v4, Lucide Icons, `@dnd-kit` Kanban drag-and-drop, Recharts, Sonner.
- **Backend**: Modular Express REST API (`src/server/app.ts`) with Zod request validation (`src/server/validation.ts`), JWT authentication (`src/server/auth.ts`), role-based access control (`OWNER`, `ADMIN`, `SALES_REP`), and strict `workspaceId` tenant isolation.
- **Serverless & Standalone Entry Points**:
  - Local / Standalone Node Server: `server.ts`
  - Vercel Serverless Function Entry: `api/index.ts` (routed via `vercel.json`)
- **Database Layer (`src/server/db/repository.ts`)**:
  - **Production PostgreSQL (`DATABASE_URL` configured)**: Uses `PrismaRepository` (`src/server/db/prismaRepository.ts`) backed by `prisma/schema.prisma` and `prisma/migrations/20260101000000_init/migration.sql`.
  - **Local / Sandbox Fallback (`DATABASE_URL` unset)**: Uses `DatabaseStore` (`src/server/db/store.ts`) persisting to `data/qavon_desk.json` (with `/tmp/qavon_desk_data` fallback on read-only serverless filesystems).

---

## 2. Environment Variables (`.env`)

Configure the following variables in `.env` locally or in **Vercel Project Settings > Environment Variables**:

| Variable | Description | Required in Production | Example Value |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection pooler URL | Yes (for PostgreSQL) | `postgresql://user:pass@ep-qavon-pooler.us-east-2.aws.neon.tech/qavon_desk?sslmode=require` |
| `DIRECT_URL` | Direct PostgreSQL URL for Prisma migrations | Yes (for migrations) | `postgresql://user:pass@ep-qavon.us-east-2.aws.neon.tech/qavon_desk?sslmode=require` |
| `JWT_SECRET` | Secret key for signing JWT tokens (min 16 chars) | **Yes** | `your-secure-random-32-byte-hex-string` |
| `ENABLE_DEMO_MODE` | Enables demo auto-session, role switcher, and demo reset (`"true"` / `"false"`) | Optional (defaults off in prod) | `false` (or `true` for portfolio review) |
| `APP_URL` | Public application URL | Optional | `https://qavon-desk.vercel.app` |
| `PORT` | Standalone Node server port | Optional | `3000` |
| `NODE_ENV` | Runtime environment | Set by platform | `production` |

---

## 3. Database Migration & Seeding (PostgreSQL / Neon / Supabase)

The repository includes an initial migration under `prisma/migrations/20260101000000_init/migration.sql`.

### Step 1: Apply Migrations
For production PostgreSQL instances:
```bash
npx prisma migrate deploy
```

### Step 2: Generate Prisma Client
```bash
npx prisma generate
```

### Step 3: Seed Initial Workspace Data
Populate your PostgreSQL database with the Acme Cloud Dynamics dataset and hashed credentials:
```bash
npx tsx prisma/seed.ts
```

---

## 4. Vercel Deployment Instructions

`vercel.json` is pre-configured with:
- `buildCommand`: `npm run vercel-build` (`prisma generate && vite build`)
- `outputDirectory`: `dist`
- Rewrites mapping `/api/(.*)` to `/api/index.ts` and SPA routes to `/index.html`

### Deploy via Vercel CLI or GitHub
1. Push the repository to GitHub (or deploy directly via `vercel`).
2. In Vercel Project Settings > Environment Variables, set `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, and optionally `ENABLE_DEMO_MODE="true"` if you want evaluators to use 1-click role switching.
3. Run `npx prisma migrate deploy` and `npx tsx prisma/seed.ts` against your production database.
4. Trigger deployment (`vercel --prod` or push to main).

---

## 5. Pre-Configured Demo Accounts (When Seeded)

| Persona | Name | Role | Email | Password |
|---|---|---|---|---|
| **Executive** | Sarah Jenkins | `OWNER` | `sarah.jenkins@acme.io` | `password123` |
| **Operations** | David Vance | `ADMIN` | `david.vance@acme.io` | `password123` |
| **Sales Rep** | Elena Rostova | `SALES_REP` | `elena.rostova@acme.io` | `password123` |

---

## 6. Verification & Build Commands

- TypeScript check (`"strict": true`):
  ```bash
  npm run lint
  ```
- Production client build:
  ```bash
  npm run build
  ```
- Vercel build (Prisma generate + Vite build):
  ```bash
  npm run vercel-build
  ```
- Start standalone full-stack server:
  ```bash
  npm start
  ```
