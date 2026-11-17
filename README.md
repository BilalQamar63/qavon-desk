# Qavon Desk

**Qavon Desk** is a lightweight, full-stack **B2B CRM & Deal Pipeline SaaS** built for small businesses, agencies, consultants, and growing sales teams.

> **Core Philosophy:** Simple enough for a small team to adopt on day one, structured enough to run a real B2B revenue pipeline.

---

## Table of Contents

1. [Problems Solved & Why Use Qavon Desk](#problems-solved--why-use-qavon-desk)
2. [Key Features](#key-features)
3. [How to Use Qavon Desk (Step-by-Step Guide)](#how-to-use-qavon-desk-step-by-step-guide)
4. [Role Permissions Matrix](#role-permissions-matrix)
5. [Local Setup & Scripts](#local-setup--scripts)
6. [Clean Client Deployment (Zero Demo Data)](#clean-client-deployment-zero-demo-data)
7. [Tech Stack & Architecture](#tech-stack--architecture)

---

## Problems Solved & Why Use Qavon Desk

| Common Sales Team Issue                                           | How Qavon Desk Solves It                                                                                                                                                 |
| :---------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Leads & client details scattered across spreadsheets and chat** | Centralizes **Leads**, **Companies**, **Contacts**, **Deals**, and **Activities** in one connected database with global search.                                          |
| **Enterprise CRMs are bloated and slow to learn**                 | Focuses purely on what B2B teams use daily—lead intake, one-click lead conversion, a 6-stage Kanban pipeline, and follow-up tracking.                                    |
| **Deals stall because follow-ups are forgotten**                  | Links calls, meetings, emails, and tasks directly to deals and leads, highlighting **overdue tasks** right in the sidebar badge.                                         |
| **No visibility into realistic future revenue**                   | Computes both **Total Pipeline Value** and **Weighted Revenue Forecast** automatically from each stage's win probability.                                                |
| **Security & accidental deletion risks on shared tools**          | Enforces JWT authentication, strict multi-tenant **workspace isolation** (`workspaceId`), and server-side **Role-Based Access Control** (`Owner`, `Admin`, `Sales Rep`). |
| **Vendor lock-in with no easy backup**                            | Lets Owners/Admins download a complete structured JSON backup (`qavon-desk-export.json`) anytime in one click.                                                           |

### Why Choose Qavon Desk?

- **End-to-end relational workflow:** Converting a qualified lead automatically creates and links the **Company**, **Contact**, and **Deal** without re-typing data.
- **Desktop & mobile ready:** Drag-and-drop Kanban cards on desktop and drawer-based stage updates on mobile.
- **Zero-config local fallback + production PostgreSQL:** Runs out of the box locally with a relational JSON store (`data/qavon_desk.json`), or scales to **PostgreSQL (Neon / Supabase / Railway)** via **Prisma ORM** on Vercel.

---

## Key Features

- **Workspace Authentication:** Sign up (creates an isolated organization workspace), sign in, bcrypt password hashing, and JWT sessions.
- **Overview Dashboard:** Live KPI cards (Active Pipeline, Weighted Forecast, Active Deals, Won Revenue), 6-month revenue chart, recent deals, pipeline breakdown, and upcoming tasks.
- **Leads Management:** Search, filter by status (`New`, `Contacted`, `Qualified`, `Unqualified`) and source (`Website`, `LinkedIn`, `Referral`, `Outbound`, `Event`, `Partner`), detail drawer, and **one-click Lead-to-Deal conversion**.
- **Companies & Contacts Directory:** Manage client organizations (industry, size, website, contact info, owner) and link multiple decision-maker contacts.
- **Deals & Drag-and-Drop Kanban Pipeline:** 6 stages (`New Opportunity` 20%, `Qualified` 40%, `Proposal Sent` 65%, `Negotiation` 85%, `Won` 100%, `Lost` 0%) with owner/priority filters, value totals per stage, and full deal detail drawers.
- **Activities & Follow-Ups:** Schedule Calls, Meetings, Emails, Tasks, and Follow-ups linked to deals or leads, filter by Upcoming / Overdue / Completed, and toggle completion in one click.
- **Reports & Analytics:** Timeframe filtering (`7D`, `30D`, `90D`, `All`), conversion funnel by stage, revenue analytics, and rep leaderboard.
- **Team & Workspace Settings:** Invite teammates with role permissions, review pipeline weights, and export workspace data to JSON.

---

## How to Use Qavon Desk (Step-by-Step Guide)

> **Note:** If Demo Mode is enabled and auto-logs you into a sample account, click your **profile menu at the bottom-left of the sidebar → Sign out** to reach the login/registration screen.

### 1. Create Your Account & Workspace

1. Open the app and select the **`Create account`** tab.
2. Fill in your details (example values):
   - **Full Name:** `Bilal Qamar` _(minimum 2 characters)_
   - **Workspace / Company Name (Optional):** `Northstar Digital`
   - **Work Email:** `bilal@northstardigital.com`
   - **Password:** `Northstar@2026` _(minimum 8 characters)_
3. Click **`Create account`**. You enter an empty, private workspace as the **Owner**.

_(To sign in later, switch to **`Sign in`** and enter your email and password.)_

### 2. Invite Your Team

1. Open **`Team & Roles`** in the sidebar → click **`Invite Member`**.
2. Enter:
   - **Full Name \*:** `Ayesha Khan`
   - **Work Email \*:** `ayesha@northstardigital.com`
   - **Job Title:** `Account Executive`
   - **Role & Permissions \*:** `Sales Representative`, `Admin`, or `Owner`
3. Click **`Send Invitation`**.
4. Share the app URL with your teammate—their initial temporary password is **`password123`**.

### 3. Add Companies

_(Create at least one Company before adding Contacts or standalone Deals.)_

1. Open **`Companies`** → click **`Add Company`**.
2. Enter:
   - **Company Name \*:** `Apex Logistics Ltd`
   - **Industry \*:** `Supply Chain & Logistics`
   - **Company Size:** `50-100 employees`
   - **Website URL:** `https://apexlogistics.com` _(must include `http://` or `https://`)_
   - **Contact Email / Phone / Address / Notes:** optional
3. Click **`Create Company`**.

### 4. Add Contacts

1. Open **`Contacts`** → click **`Add Contact`**.
2. Enter:
   - **First Name \*:** `Omar`
   - **Last Name \*:** `Farooq`
   - **Company \*:** `Apex Logistics Ltd`
   - **Email Address \*:** `omar@apexlogistics.com`
   - **Phone Number / Job Title / Notes:** e.g. `Operations Director`
3. Click **`Create Contact`**.

### 5. Capture & Qualify Leads

1. Open **`Leads`** → click **`Add Lead`** (or **`Add Lead`** in the top header).
2. Enter:
   - **Full Name \*:** `Hira Tariq`
   - **Company Name \*:** `BrightWave Retail`
   - **Email Address \*:** `hira@brightwaveretail.com`
   - **Est. Deal Value (USD):** `25000`
   - **Status:** `New` (`New`, `Contacted`, `Qualified`, `Unqualified`)
   - **Lead Source:** `Website` (`Website`, `LinkedIn`, `Referral`, `Outbound`, `Event`, `Partner`)
   - **Assigned Rep:** select team member
3. Click **`Create Lead`**. Click any lead row anytime to edit details or log notes.

### 6. Convert Qualified Leads into Deals

1. In **`Leads`**, click **`Convert`** on a lead row (or open the lead drawer and click **`Convert Lead into Opportunity`**).
2. Confirm **Opportunity Title**, **Deal Value (USD)**, **Target Close Date**, **Starting Stage**, and **Assigned Owner**.
3. Click **`Convert to Opportunity`**. Qavon Desk automatically creates/links the Company, Contact, and Deal on your pipeline.

### 7. Manage the Sales Pipeline (Kanban Board)

1. Open **`Deals & Pipeline`** (or click **`Add Deal`** in the top header to create an opportunity directly).
2. Drag and drop deal cards across the 6 stages on desktop (`New Opportunity` → `Qualified` → `Proposal Sent` → `Negotiation` → `Won` / `Lost`), or click any card to open its detail drawer and update fields on desktop or mobile.
3. Filter deals by **Search**, **Owner**, or **Priority** (`Low`, `Medium`, `High`).

### 8. Schedule & Complete Activities

1. Open **`Activities`** → click **`Schedule Activity`** (or click **`Schedule Follow-up Activity`** inside any Deal drawer).
2. Select **Activity Type** (`Phone Call`, `Meeting`, `Email Outreach`, `Task`, `Follow-up`), enter a **Title & Subject**, **Due Date & Time**, and link a **Deal** or **Lead**.
3. Click the circle checkbox beside an activity to mark it complete. Overdue items display a count badge next to **`Activities`** in the sidebar.

### 9. Monitor Analytics & Export Data

- **`Overview`:** Daily KPIs, weighted forecast, and 6-month revenue trends.
- **`Reports`:** Filter by **`7D`**, **`30D`**, **`90D`**, or **`All`** for stage conversion rates and sales rep leaderboards.
- **`Settings`** _(Owner/Admin only)_: View workspace configuration, pipeline stage weights, and click **`Export JSON`** to download `qavon-desk-export.json`.

---

## Role Permissions Matrix

| Capability                                                          | Owner | Admin | Sales Rep |
| :------------------------------------------------------------------ | :---: | :---: | :-------: |
| Create and manage leads, companies, contacts, deals, and activities |  Yes  |  Yes  |    Yes    |
| Drag-and-drop Kanban pipeline updates                               |  Yes  |  Yes  |    Yes    |
| Access revenue analytics and reports                                |  Yes  |  Yes  |    Yes    |
| Delete leads, companies, contacts, or deals                         |  Yes  |  Yes  |    No     |
| Invite team members and assign roles (`Admin` / `Sales Rep`)        |  Yes  |  Yes  |    No     |
| Export workspace JSON backup                                        |  Yes  |  Yes  |    No     |
| Invite another `Owner`                                              |  Yes  |  No   |    No     |

---

## Local Setup & Scripts

### Prerequisites

- Node.js 18+
- Optional: PostgreSQL database (Neon, Supabase, or local Postgres)

### Run Locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`.

### Available Scripts

| Command                | Purpose                                                 |
| :--------------------- | :------------------------------------------------------ |
| `npm run dev`          | Starts Express + Vite development server on port `3000` |
| `npm run lint`         | Runs strict TypeScript type-checking (`tsc --noEmit`)   |
| `npm run build`        | Builds production frontend bundle to `dist/`            |
| `npm run vercel-build` | Runs `prisma generate && vite build` for Vercel         |
| `npm start`            | Starts the Express server (`tsx server.ts`)             |

---

## Clean Client Deployment (Zero Demo Data)

For full Vercel + PostgreSQL setup instructions, see [`DEPLOYMENT.md`](./DEPLOYMENT.md). To deliver a **completely empty client-ready instance**:

1. Set **`ENABLE_DEMO_MODE="false"`** in Vercel Environment Variables (alongside `DATABASE_URL`, `DIRECT_URL`, and `JWT_SECRET`). This disables auto-login, hides the quick-access demo cards on Sign In, hides the sidebar role switcher, and disables demo reset.
2. Run database migrations **without** seeding:
   ```bash
   npx prisma migrate deploy
   ```
   _(Do **not** run `npx tsx prisma/seed.ts`.)_
3. If your database was previously seeded and needs to be wiped clean:
   ```bash
   npx prisma migrate reset --force
   ```
4. When your client opens the deployed URL, they will see a clean login screen and can click **`Create account`** to launch their own empty organization workspace.

---

## Tech Stack & Architecture

- **Frontend:** React 19, TypeScript (`strict`), Vite, Tailwind CSS v4, Lucide React, `@dnd-kit` (Kanban drag-and-drop), Recharts, Sonner
- **Backend:** Express REST API (`src/server/app.ts`), Zod request validation (`src/server/validation.ts`), JWT auth + bcryptjs (`src/server/auth.ts`)
- **Database:** Prisma ORM + PostgreSQL (`prisma/schema.prisma`) with automatic local JSON fallback (`src/server/db/store.ts`) when `DATABASE_URL` is unset
- **Deployment:** Vercel (`vercel.json` + serverless handler `api/index.ts`) or standalone Node server (`server.ts`)
