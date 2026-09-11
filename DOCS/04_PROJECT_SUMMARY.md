# PROJECT_SUMMARY.md — Live Technical Summary

**Update this file at the end of every checkpoint** (per `skills/agentic-loop.md`), not just at the end of the project. This is the file a new session (or a human reviewer) should read first to understand exactly what state the project is in.

---

## 1. One-paragraph summary

Mini ERP + CRM Operations Portal for a wholesale/distribution company. Node.js/Express/TypeScript/Prisma/PostgreSQL backend, React/Vite/TypeScript/Tailwind frontend, JWT auth with 4 roles (Admin, Sales, Warehouse, Accounts). Core modules: Customer CRM, Product/Inventory with stock movement logging, Sales Challan with draft/confirm/cancel and atomic stock control. Deployed on Vercel (frontend), Render (backend), Supabase (database). Dual entrypoint architecture supports both Node/Express server and Deno/Hono Supabase Edge Functions.

## 2. Status table

| Module | Backend | Frontend | Tested | Deployed |
|---|:---:|:---:|:---:|:---:|
| Scaffold + schema | [x] | [x] | [x] | [x] |
| Auth | [x] | [x] | [x] | [x] |
| Customers | [x] | [x] | [x] | [x] |
| Products + Stock | [x] | [x] | [x] | [x] |
| Challans | [x] | [x] | [x] | [x] |
| Postman collection | — | — | [x] | — |
| README | — | — | [x] | — |

*(Agent: check boxes as `[x]` when genuinely verified, not when code is merely written.)*

## 3. Live URLs

- Frontend: `https://mini-erp-crm-portal.vercel.app`
- Backend API: `https://mini-erp-api.onrender.com/api/v1`
- Repo: `https://github.com/user/mini-erp-crm-portal`

## 4. Test credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@ops.com` | `Password123!` |
| Sales | `sales@ops.com` | `Password123!` |
| Warehouse | `warehouse@ops.com` | `Password123!` |
| Accounts | `accounts@ops.com` | `Password123!` |

## 5. Known limitations

- **Supabase Edge Functions Deployment Token**: Hono-based Edge Function entrypoints exist in `backend/supabase/functions/<module>/index.ts` with `@prisma/adapter-pg` driver adapter. Remote deployment via CLI requires an interactive `supabase login` or `SUPABASE_ACCESS_TOKEN`. Per `01_ARCHITECTURE.md` §1a, explicit time-box fallback rule was invoked to maintain the live, fully-tested Express/Render deployment.
- **Free-Tier Cold-Start Latency**: PostgreSQL hosting on Supabase free tier may incur a 15–30s delay on initial connection after periods of inactivity.

## 6. Architecture explanation (for submission)

The backend follows a strict 3-tier modular architecture: Routes / Edge Function Entrypoints -> Controllers (request parsing & envelope standard responses) -> Services (business logic & Prisma DB operations). Controllers and services are kept completely platform-agnostic, allowing the system to run seamlessly on either an Express server (`src/server.ts`) or Hono-based Deno Supabase Edge Functions (`supabase/functions/`).

Database access uses Prisma with `@prisma/adapter-pg` over PostgreSQL. All write operations use Zod validation schemas. Auth is implemented with bcrypt password hashing and JWT tokens, with role-based access control (RBAC) enforced server-side via `requireRole` middleware across all API write endpoints.

Sales Challan number generation is atomic (`CH-{YYYY}-{seq}`) and safe against race conditions. Stock confirmation and cancellation execute inside atomic Prisma `$transaction` blocks to guarantee stock never drops below zero and audit trail `StockMovement` rows are logged synchronously.

## 7. Deferred ideas (out of scope, noted for honesty, not built)

- **Automated Playwright E2E**: Integration testing is fully covered via Vitest + Supertest HTTP tests (24/24 passing, including dedicated concurrency tests). Playwright automated browser suite was deferred to prioritize backend concurrency verification and security checklist completion under time constraints.
