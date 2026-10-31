# WorkTrack — Production Deployment Guide for Vercel & Neon PostgreSQL

This document provides complete, step-by-step instructions to deploy the WorkTrack application (React 19 + Express Serverless + Neon PostgreSQL) to [Vercel](https://vercel.com).

---

## 1. Architecture Overview

```
                        ┌─────────────────────────────────────────────────────────────┐
                        │                   Vercel Edge Network                      │
                        └──────────────┬───────────────────────────────┬──────────────┘
                                       │                               │
                       Static Assets & SPA Rewrites             /api/* Rewrites
                                       ▼                               ▼
                        ┌──────────────────────────────┐  ┌───────────────────────────┐
                        │        Vite Frontend         │  │   Serverless API Handler  │
                        │    (React 19 / TypeScript)   │  │    (`api/index.ts` via    │
                        │      Served from `dist/`     │  │       Express 4.x)        │
                        └──────────────────────────────┘  └─────────────┬─────────────┘
                                                                        │
                                                         Stateless HTTP Queries (Pooled)
                                                                        ▼
                                                          ┌───────────────────────────┐
                                                          │   Neon PostgreSQL (Cloud) │
                                                          │    raspy-mouse-28818104   │
                                                          └───────────────────────────┘
```

* **Frontend**: React 19, TypeScript, Tailwind CSS, Vite. Built into `dist/`. Client-side routes are managed by React Router with SPA rewrite fallback in `vercel.json`.
* **Backend**: Express.js serverless function in `api/index.ts`. Reuses core routes, authentication middleware, validation, and error handlers.
* **Database**: Neon Serverless PostgreSQL with Drizzle ORM (`@neondatabase/serverless` HTTP driver).
* **Automated Retention**: Vercel Cron Jobs invoke `/api/cron/retention` on the 1st of each month at 00:05 IST (18:35 UTC on month-end).

---

## 2. Prerequisites

1. A [Vercel Account](https://vercel.com/signup).
2. A [Neon PostgreSQL Account](https://neon.tech) (existing database `raspy-mouse-28818104`).
3. GitHub repository containing the WorkTrack codebase.

---

## 3. Vercel Project Setup

### Step 1: Import Repository
1. Log in to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** → **Project**.
3. Select your Git provider (GitHub) and import the repository: `CHV_Desk` (or your repository name).

### Step 2: Configure Project Settings (Manual Configuration)

In the Vercel Import/Settings screen, ensure the following settings:

| Setting | Value | Notes |
| :--- | :--- | :--- |
| **Framework Preset** | `Vite` | Vercel automatically detects Vite. |
| **Root Directory** | `./` | Keep the default root directory. |
| **Build Command** | `npm run build` | Builds the client SPA into `dist/`. |
| **Output Directory** | `dist` | Directory containing the static production assets. |
| **Install Command** | `npm install` | Installs root dependencies for both Vite and the serverless API. |

---

## 4. Required Environment Variables

Configure the following environment variables in the Vercel Dashboard under **Project Settings → Environment Variables**:

| Variable Name | Environment | Example / Value | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Production, Preview, Dev | `postgresql://user:pass@ep-pooler.region.aws.neon.tech/worktrack?sslmode=require` | **Pooled** Neon PostgreSQL connection string for serverless runtime queries. |
| `DIRECT_URL` | Production, Preview, Dev | `postgresql://user:pass@ep.region.aws.neon.tech/worktrack?sslmode=require` | **Direct** Neon connection string used for executing schema migrations. |
| `JWT_SECRET` | Production, Preview, Dev | *32+ character random secret string* | Cryptographic key used to sign and verify JWT authentication tokens. |
| `JWT_EXPIRES_IN` | Production, Preview, Dev | `7d` | Session token lifespan (e.g. `7d`, `24h`). |
| `CLIENT_URL` | Production | `https://your-worktrack-app.vercel.app` | Production origin of your application. |
| `NODE_ENV` | Production | `production` | Enforces production security, secure cookies, and stripped stack traces. |
| `COOKIE_SAME_SITE` | Production | `lax` | Set to `lax` for single-origin Vercel deployments (recommended). |
| `CRON_SECRET` | Production, Preview | *32+ character random secret string* | Secret bearer token Vercel sends to authenticate automated cron executions. |

> [!IMPORTANT]
> - Never prefix backend variables with `VITE_`.
> - Do not enclose connection strings or secrets in quotes within the Vercel Dashboard.

---

## 5. Database Migrations (Pre-Deployment)

Drizzle migrations run directly against your Neon database using the `DIRECT_URL`.

Before triggering the first deployment, run migrations locally or via CI:

```bash
# From repository root:
npm run db:migrate

# Or from the backend directory:
cd backend
npm run db:migrate
```

To verify the database baseline:
```bash
npm run db:seed
```
*Note: The baseline seed script is idempotent. It ensures the 3 core departments (Software, Video Editor, Digital Marketing) and the admin account (`Chandu`, username: `admin`) exist. It will never create mock employees, projects, or activities.*

---

## 6. Vercel Cron Configuration

The monthly retention policy is configured in [`vercel.json`](file:///e:/CHV/CHV_Desk/vercel.json):

```json
{
  "crons": [
    {
      "path": "/api/cron/retention",
      "schedule": "35 18 28-31 * *"
    }
  ]
}
```

### Schedule Explanation & UTC Conversion
- **Target Local Time**: 1st of every month at **00:05 AM Asia/Kolkata (IST)**.
- **Timezone Offset**: Asia/Kolkata is `UTC + 5:30`.
- **UTC Conversion**: `00:05 IST` minus `5h 30m` = `18:35 UTC` on the **preceding day**.
- **Execution Rule**: The cron fires at `18:35 UTC` on the month-end dates (`28-31`). The endpoint internally checks the current day in `Asia/Kolkata`. If it is day 1, it executes the purge; on all other days, it safely skips without making database modifications.
- **Security**: The cron route requires `Authorization: Bearer <CRON_SECRET>`. Vercel automatically supplies this header when `CRON_SECRET` is defined in the project settings.

To manually trigger or test the cron endpoint:
```bash
curl -X GET "https://your-worktrack-app.vercel.app/api/cron/retention?force=true" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 7. Preview & Production Deployments

### Preview Deployments (Pull Requests & Branches)
- Pushing to any non-main branch or opening a Pull Request automatically generates a Preview Deployment.
- Preview URLs (`https://<project>-<branch>.vercel.app`) are supported by CORS and cookie configuration automatically.

### Production Deployments
- Pushing or merging to the `main` branch triggers an automatic production build and deployment.
- Alternatively, deploy manually using the Vercel CLI:
  ```bash
  vercel --prod
  ```

---

## 8. Post-Deployment Verification Checklist

After deploying to Vercel, verify all critical functions using this checklist:

- [ ] **Health Check**:
  Visit `https://your-worktrack-app.vercel.app/api/health` — must return:
  ```json
  { "success": true, "data": { "status": "healthy", "database": "connected" } }
  ```
- [ ] **SPA Route Refresh**:
  Navigate to `https://your-worktrack-app.vercel.app/login` and refresh the browser. The page must render without a 404 error.
- [ ] **Admin Authentication**:
  Log in using:
  - **Username**: `admin`
  - **Password**: `admin123`
  Verify that the dashboard displays **Chandu** and avatar initial **C**.
- [ ] **Session Persistence**:
  Refresh the page while logged in. Verify `/api/auth/me` succeeds and the user remains authenticated.
- [ ] **Project Visibility & Permissions**:
  - Create a new project.
  - Verify that the created project appears in the Admin project management list.
- [ ] **Employee Management**:
  - Create an employee account from the Admin portal.
  - Log in as the newly created employee in an incognito window.
  - Verify the employee only sees their own assigned dashboard and projects.
- [ ] **Cron Security**:
  - Visit `https://your-worktrack-app.vercel.app/api/cron/retention` without headers. Must return HTTP `401 Unauthorized`.
- [ ] **Logout**:
  Click Logout. Verify authentication cookies are cleared and the user is redirected to `/login`.

