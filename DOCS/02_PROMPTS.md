# PROMPTS.md — Prompts to Build This Project

Feed these to the build agent (Antigravity) **in order, one at a time**, waiting for each to complete and self-verify before sending the next. Each prompt assumes the agent has read `00_AGENTS.md`, `01_ARCHITECTURE.md`, and all files in `skills/` at session start — paste this whole `docs/` folder into context first, or point the agent at the repo's `docs/` path if it can read files directly.

---

### Prompt 0 — Context load (send first, once)

> Read `docs/00_AGENTS.md`, `docs/01_ARCHITECTURE.md`, and every file in `docs/skills/`. These are binding for the rest of this project. Confirm you've read them by summarizing the tech stack, folder structure, and the 5 non-negotiables from AGENTS.md back to me in under 150 words. Do not write any code yet.

---

### Prompt 1 — Backend scaffold

> Scaffold `backend/` exactly per the folder structure in `01_ARCHITECTURE.md` §2. Set up Express + TypeScript + Prisma with the full schema from §3. Run the initial migration against the Supabase DB (connection details will be provided via `.env` — ask me for the Supabase connection string if not already set). Write `prisma/seed.ts` to create exactly one user per role (Admin, Sales, Warehouse, Accounts) with a printed table of their test credentials. Do not build any route logic yet — just prove the app boots, connects to the DB, and the seed runs. Log this task in `03_CHANGELOG.md` when done.

---

### Prompt 2 — Auth module

> Build the auth module: `POST /auth/login`, `GET /auth/me`, JWT middleware, and role-check middleware, per `01_ARCHITECTURE.md` §4 and the layering rules in `skills/clean-code.md`. Follow the agentic loop from `skills/agentic-loop.md`: implement, then actually test login for all 4 seeded roles via curl/Postman before telling me it's done. Update `03_CHANGELOG.md`.

---

### Prompt 3 — Customers module

> Build the full Customers module (API) per `01_ARCHITECTURE.md` §4: list with pagination/search/filter, get by id with notes, create, update, add follow-up note. Apply role restrictions per the role matrix in §5. Zod-validate every write. Self-verify each endpoint with a real request including at least one deliberate validation failure and one deliberate role-violation attempt (expect 400 and 403 respectively). Update `03_CHANGELOG.md`.

---

### Prompt 4 — Products + Stock module

> Build the Products + Stock module per `01_ARCHITECTURE.md` §4: product CRUD, manual stock movement endpoint, stock movement history endpoint. Every stock change must write a `StockMovement` row per §3's business rules. Self-verify: create a product, do a manual IN movement, confirm `currentStock` updated correctly and a movement row exists with the right `createdBy`. Update `03_CHANGELOG.md`.

---

### Prompt 5 — Challans module (hardest — take your time)

> Build the Sales Challan module per `01_ARCHITECTURE.md` §4 and the business rules in §3: draft creation with product snapshotting, auto-generated challan numbers (atomic, no race condition), confirm endpoint that atomically checks and decrements stock inside a Prisma transaction, cancel endpoint that reverses stock if the challan was confirmed. This is the module most likely to have subtle bugs — explicitly test: (a) confirming with sufficient stock succeeds and stock drops correctly with a matching StockMovement, (b) confirming with insufficient stock fails with 409 and stock is unchanged, (c) two near-simultaneous challan creations don't produce duplicate challan numbers, (d) cancelling a confirmed challan restores stock correctly. Do not mark this module done until all four are verified. Update `03_CHANGELOG.md`.

---

### Prompt 6 — Frontend design system

> Scaffold `frontend/` per `01_ARCHITECTURE.md` §2 with Vite + React + TS + Tailwind. Build the design-system components (`Button`, `Input`, `Select`, `Table`, `Badge`, `Modal`, `AppShell`) per `skills/ui-ux.md` before any feature page. Build the auth flow (login page, auth context, protected routes, role-aware sidebar nav). Self-verify: log in as each of the 4 seeded roles and confirm the sidebar shows only the modules that role can access per the role matrix. Update `03_CHANGELOG.md`.

---

### Prompt 7 — Frontend: Customers, Products, Challans pages

> Build the frontend feature pages for Customers, Products (incl. low-stock flagging per `skills/ui-ux.md`), and Challans (incl. the create-challan flow with a product picker that warns on low stock, and the confirm/cancel actions with a confirmation dialog since these are destructive-ish). Every page needs loading/empty/error states per `skills/ui-ux.md`. Self-verify by clicking through the full flow: add a customer → add a product with stock → create a draft challan → confirm it → check the product's stock dropped and the movement log shows it. Update `03_CHANGELOG.md`.

---

### Prompt 8 — Deploy

> Deploy per `skills/supabase.md`: database (already set up in Prompt 1) and backend as Supabase Edge Functions, one function per module, using the Hono + Prisma-driver-adapter setup documented there. Then deploy `frontend/` per `skills/vercel.md`. Set env vars/secrets in the correct order: backend functions first, get their live URL, then set that as `VITE_API_BASE_URL` in Vercel, then set the Vercel URL as the CORS origin inside each Hono app and redeploy the functions once more. Run the verification checklists from both skill docs. **If the Edge Functions setup isn't producing a working deployment within ~2 hours, stop and fall back to Render per `01_ARCHITECTURE.md` §1a — don't keep pushing past the time-box.** Update `03_CHANGELOG.md` with both live URLs and which backend hosting path was actually used.

---

### Prompt 9 — Testing pass

> Follow `06_TESTING_AND_SECURITY.md` §2 (functional test plan). Write and run backend integration tests (Vitest + Supertest) for every endpoint in `01_ARCHITECTURE.md` §4, including the two hard cases from `05_PROBLEM_AND_RESEARCH.md` (concurrent challan confirms, concurrent challan-number generation) and one deliberate test per role-boundary violation. Run the frontend through the manual E2E checklist in `06_TESTING_AND_SECURITY.md` §2. Fix anything that fails before proceeding — do not document a failing test as a "known limitation" if it's actually fixable within time budget. Update `03_CHANGELOG.md` and the test-status row in `04_PROJECT_SUMMARY.md`.

---

### Prompt 10 — Security testing pass

> Run every check in `06_TESTING_AND_SECURITY.md` §3 (security checklist) against the **live deployed** backend and frontend, not localhost. For each item, record pass/fail and, for any fail, either fix it now (if quick) or log it explicitly as a known limitation in `04_PROJECT_SUMMARY.md` with severity noted — do not silently drop a failed security check. Pay particular attention to: JWT tampering/expired-token handling, role-bypass attempts on every write endpoint, IDOR checks (can User A read/edit User B's-scoped-but-not-actually-scoped data — note most models here aren't per-user scoped, but role scoping still applies), input validation fuzzing on at least one endpoint per module, and confirming no secrets are exposed in frontend bundle or API error responses. Update `03_CHANGELOG.md`.

---

### Prompt 11 — Push to GitHub

> Initialize (or confirm) the git repo per `skills/github.md`: verify `.gitignore` covers `.env`, `node_modules`, `dist`, `build` before any commit. If the repo doesn't already have commit history reflecting the real build order (scaffold → auth → customers → products → challans → frontend → deploy → tests → security), do not squash into one commit — this is one of the few things a reviewer checks in 30 seconds. Push to the remote GitHub repository (ask me for the repo URL/name if not already provided, or create one if I've given you GitHub access). Confirm the push succeeded and the remote reflects the final state. Record the final commit hash and repo URL in `04_PROJECT_SUMMARY.md`.

---

### Prompt 12 — Final submission pass

> Export the Postman collection covering every endpoint in `01_ARCHITECTURE.md` §4, including at least one example of a validation-failure and role-failure response per module. Write `README.md` at repo root per the case study's submission requirements (setup, env vars, run locally, deploy steps, architecture summary, known limitations — pull known limitations honestly from `03_CHANGELOG.md`'s Blocked/Deviations notes, don't hide them). Finalize `04_PROJECT_SUMMARY.md` status table to 100% or explicitly list what's incomplete and why. Do a full regression pass logging in as all 4 roles and exercising one flow per module on the live deployed URLs, not localhost.
