# AGENTS.md — Rules for the Build Agent

You are building the Mini ERP + CRM Operations Portal against a 48-hour deadline. This file governs how you work. `01_ARCHITECTURE.md` governs what you build. If they ever conflict, ARCHITECTURE.md wins for technical facts, this file wins for process/behavior.

## Non-negotiables

1. **Never contradict `01_ARCHITECTURE.md`.** If you think the schema, API contract, or stack choice in that doc is wrong, stop and flag it in `03_CHANGELOG.md` under "Deviations Proposed" — do not silently change it and do not silently build around it.
2. **No Prisma calls outside `*.service.ts` files.** No business logic inside `*.controller.ts` or `*.routes.ts` files. This is enforced structurally, not by convention — if you catch yourself writing a `prisma.` call in a controller, stop and move it.
3. **Every write endpoint has a Zod schema.** No exceptions, including "quick" admin-only endpoints.
4. **Stock changes are always atomic and always logged.** Any code path that changes `Product.currentStock` without writing a `StockMovement` row in the same transaction is a bug. Fix it before moving on, don't leave a TODO.
5. **Never commit `.env` files or real secrets.** Use `.env.example` with placeholder values.
6. **Do not invent scope.** If the case study PDF and ARCHITECTURE.md don't mention a feature, don't build it, even if it seems like a nice addition — 48 hours means every hour spent on unscoped work is an hour stolen from a required module. Exception: bonus features listed in ARCHITECTURE.md/case study, only after all required modules are done and tested.

## Working loop (see `skills/agentic-loop.md` for detail)

For every unit of work: **Plan → Implement → Self-verify → Log → Next.** Do not batch five features and test at the end. After each module, run it, confirm it actually works (not just "compiles"), then write one line in `03_CHANGELOG.md` before starting the next module.

## Order of build (do not reorder without reason)

1. Backend scaffold + Prisma schema + migration + seed script (creates one user per role)
2. Auth module (login, JWT middleware, role middleware) — test with Postman before anything else touches it
3. Customers module
4. Products + Stock module
5. Challans module (build last — depends on customers + products existing and tested)
6. Frontend scaffold (design system components first: Button, Input, Table, Badge, Modal, AppShell) — see `skills/ui-ux.md`
7. Frontend feature pages, module by module, same order as backend
8. Deploy: DB (Supabase) → Backend (Render) → Frontend (Vercel), in that order, verifying each is live before starting the next
9. Postman collection export + README + `04_PROJECT_SUMMARY.md` final pass

## When to ask vs proceed

Proceed without asking when: the answer is already specified in ARCHITECTURE.md, or there's an obviously correct default (e.g., naming a variable, choosing a Tailwind spacing value).

Stop and ask when: a required business rule is genuinely ambiguous after re-reading ARCHITECTURE.md and the original case study PDF, or a decision would be expensive to reverse (e.g., switching ORMs, changing the auth strategy).

## Quality bar

- TypeScript strict mode on, no `any` except at genuine third-party boundary.
- Every list endpoint paginates (`page`, `limit`, default `limit=20`).
- Every mutation gets a loading state and error toast on the frontend — no silent failures.
- No console.log left in committed code except structured server-side error logging.

## Definition of "submission ready"

All items in the case study PDF's "Submission Requirements" section exist and are correct: repo link, live URLs (or local+recording fallback), test credentials per role, Postman collection, README, architecture explanation, known limitations documented honestly in `04_PROJECT_SUMMARY.md`.
