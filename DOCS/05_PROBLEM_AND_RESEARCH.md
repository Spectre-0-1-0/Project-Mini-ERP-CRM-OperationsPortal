# PROBLEM_AND_RESEARCH.md — Understand This Before Touching Code

Purpose of this doc: separate from `01_ARCHITECTURE.md` (which says *what* to build), this doc explains *why* the problem is shaped the way it is, and documents the research behind the trickiest technical decisions, so the build agent isn't just following instructions blindly — it understands the tradeoffs well enough to make good calls on anything this doc set doesn't explicitly cover.

---

## 1. The Problem Statement, Restated Plainly

A wholesale/distribution company runs on paper-adjacent processes today: someone tracks customers in a notebook or spreadsheet, someone else tracks stock, and when a sale happens, a challan (delivery note) gets written up before an invoice follows. The risk in that world is always the same: sales promises stock that isn't actually there, nobody can say why stock moved, and there's no single place that reflects reality.

The assignment is to replace that with a small internal web app that:
- Lets different employee types (sales, warehouse, accounts, admin) log in and see only what's relevant to their job.
- Gives sales a proper CRM: who the customer is, what stage they're at (lead/active/inactive), when to follow up.
- Gives warehouse a live, trustworthy stock count with a paper trail for every change.
- Lets sales turn a sale into a challan that **actually reserves real stock** — not just a document that says a number.
- Proves all of this works by being live on the internet, not just running on a laptop.

The evaluator is grading full-stack competence under time pressure: can you design a correct schema, secure it properly, build something usable, and ship it — not just make each individual CRUD screen technically function.

## 2. The Two Problems That Actually Determine the Grade

Everything else in this project (customer CRUD, product CRUD) is standard, low-risk work any competent developer does correctly on the first pass. Two things are genuinely easy to get subtly wrong, and they're exactly the things a reviewer with real backend experience will probe:

### Problem A: Concurrency-safe challan numbering

**The naive approach** — read the max existing challan number, add 1, save — looks correct in every manual test and breaks under real concurrent load. Two sales users submitting a challan in the same second can both read the same "last number," both compute the same "next number," and either collide (unique constraint violation, confusing error) or silently duplicate (no constraint, corrupted data).

**Research finding:** the standard, well-established fix is a dedicated counter row, incremented inside the same transaction as the insert, using `SELECT ... FOR UPDATE` to lock that specific row until the transaction commits. <cite index="2-1">The pattern uses a counter table with a unique key on the numbering scope, locks the counter row inside a transaction, computes the next number, updates the counter, then inserts the document using that number before committing</cite>. The locking is what matters — <cite index="2-1">the second concurrent transaction cannot read and increment the same counter row until the first one commits, so it waits instead of colliding</cite>.

An alternative some implementations use is a raw Postgres `SEQUENCE`, but research shows this has a subtler flaw for numbering that must appear gap-free and in true commit order: <cite index="5-1">sequence-generated values can become visible out of the actual transaction commit order under concurrency, so if strict no-gap, correctly-ordered numbering matters, a sequence alone isn't sufficient — you need a transactional table with write locks to force commit ordering</cite>.

**Recommendation for this project:** use the counter-table + `FOR UPDATE` pattern described in `01_ARCHITECTURE.md` §3, not a bare Postgres sequence. Scope: one counter per year (`CH-2026-0001`, resets each year), no need for per-branch/per-warehouse scoping since this is a single-location system per the case study.

### Problem B: Atomic, non-negative stock on challan confirm

Same family of bug, different symptom. If "check stock is sufficient" and "decrement stock" are two separate steps, two challans confirming near-simultaneously against the same low-stock product can both pass the check before either decrements — both succeed, stock goes negative, and the audit trail lies about what actually happened.

**Recommendation (already reflected in `01_ARCHITECTURE.md` §3):** the check and the decrement must happen inside one database transaction, where the check re-reads the current stock *within* that transaction (not from a value fetched earlier in the request), and the whole operation — status change, stock decrement, `StockMovement` row insert — commits or rolls back together. Prisma's `$transaction` with an interactive callback (not the array form) is required here because the logic is conditional (branch on insufficient stock), not just a fixed batch of writes.

## 3. Research: Role-Based Access Control Done Right

Confirmed against current practice, not just this project's guess:

- <cite index="19-1">Authentication verifies who a user is; authorization (RBAC) verifies what that authenticated user is allowed to do — they're separate concerns and both are required, with role-checking abstracted into middleware kept away from controller logic, and the frontend UI must never be the actual enforcement layer</cite>. This confirms the layering already specified in `01_ARCHITECTURE.md`/`skills/clean-code.md`: role checks live in Express middleware applied per-route, and hiding a button on the frontend is UX only, never security.
- <cite index="15-1">The standard pattern embeds the user's role directly in the JWT payload at login</cite>, and <cite index="13-1">a small middleware function checks `req.user.role` against a list of allowed roles for that route, returning 403 if it doesn't match</cite> — this is exactly the `requireRole([...])` middleware called for in this project's architecture.
- **One real caveat worth knowing:** <cite index="19-1">because JWTs are immutable once issued, if a user's role changes after the token was issued, the old token still carries the old role until it expires</cite>. For this project (48h, no live role-change requirement in the spec), this is an acceptable known limitation — note it explicitly in `04_PROJECT_SUMMARY.md` rather than over-engineering a token-revocation system that isn't asked for.

## 4. Why Certain Things Were Deliberately Left Out of Scope

Researched and consciously rejected, not overlooked:

- **A permissions table / dynamic RBAC system** — reasonable for a system that will grow many roles over years; overkill for 4 fixed roles in a 48-hour build. A hardcoded role enum with middleware checks is the correct engineering choice at this scale, not a shortcut.
- **Refresh tokens / token rotation** — a real production auth system would want this; the case study explicitly says "simple JWT-based authentication is acceptable," so this is respected scope discipline, not a gap.
- **AWS deployment** — explicitly marked bonus/optional in the case study, and free-tier alternatives (Vercel/Render/Supabase) are explicitly acceptable per the brief. Spending build hours wrestling with IAM/ECS instead of shipping the free-tier path would be a scope misjudgment, not thoroughness.
- **RLS in Supabase** — considered and rejected because access control is already fully handled at the Express API layer; enabling it too would be redundant defense-in-depth that isn't worth the build-time cost here (see `skills/supabase.md`).

## 5. How to Use This Doc

Read this once, before Prompt 1 in `02_PROMPTS.md`. When you hit a design decision this doc set doesn't explicitly answer, reason from the *principles* here (concurrency safety over optimistic assumptions, enforcement at the API layer not the UI, scope discipline under time pressure) rather than defaulting to whatever's fastest to type. If you find a better-researched approach than what's written here, propose it — log it under "Deviations Proposed" in `03_CHANGELOG.md` with your reasoning, don't just silently diverge.
