# TESTING_AND_SECURITY.md — Test Plan + Security Checklist

This is not optional polish. A case study reviewer with real backend experience will try to break the two hard problems in `05_PROBLEM_AND_RESEARCH.md` (stock races, challan numbering) and will try at least one auth bypass. Passing this doc's checklist before submission is what separates "it works when I click through it" from "it actually holds up."

---

## 1. Test Layers (what to use, and why)

| Layer | Tool | Covers |
|---|---|---|
| Backend unit/integration | **Vitest + Supertest** | Every API route, real HTTP calls against a real (test) DB — not mocked Prisma, since the whole point is verifying real transaction behavior |
| Frontend component | Vitest + React Testing Library | Design-system components only if time allows — not required for submission, skip under time pressure before skipping backend tests |
| End-to-end | Manual checklist (below) — Playwright only if time genuinely allows | Full user flows across real deployed frontend+backend |
| Security | Manual checklist (below) + `npm audit` / `npx snyk test` | Auth, authorization, injection, secrets, dependency vulnerabilities |

Priority order under time pressure: **backend integration tests > manual E2E checklist > security checklist > frontend unit tests > Playwright automation.** The first three are what a reviewer can actually verify or would specifically probe; frontend unit tests and full E2E automation are the first things to cut if the clock runs out — note the cut honestly in `04_PROJECT_SUMMARY.md` rather than skipping silently.

---

## 2. Functional Test Plan

### Backend integration tests (Vitest + Supertest) — one file per module, mirroring `01_ARCHITECTURE.md` §4

For every endpoint: one test for the success path, one for a validation failure (400), one for a role violation (403) where applicable, one for a not-found (404) where applicable.

**The two hard cases get dedicated tests, not just endpoint coverage:**

- **Concurrent challan-number generation:** fire N (e.g. 10) simultaneous `POST /challans` requests and assert all N `challanNumber` values are unique with no gaps skipped incorrectly. This is the direct test of the counter-table+lock pattern from `05_PROBLEM_AND_RESEARCH.md` §2.
- **Concurrent challan confirm against low stock:** seed a product with exactly enough stock for one of two simultaneous challans, fire both `POST /challans/:id/confirm` at once, assert exactly one succeeds, one gets 409, and final `currentStock` is never negative and matches exactly what the successful confirm should have decremented (not decremented twice, not decremented zero times).
- **Cancel-after-confirm stock reversal:** confirm a challan, cancel it, assert stock returns to its pre-confirm value and a reversing `StockMovement` (`type: IN`) exists.

### Manual E2E checklist (run against the live deployed URLs, not localhost, before calling it done)

- [ ] Log in as each of the 4 seeded roles; sidebar nav shows only what that role should see
- [ ] Sales: add a customer, edit it, search for it, add a follow-up note
- [ ] Warehouse: add a product, do a manual stock IN movement, confirm stock and movement log both update
- [ ] Sales: create a draft challan with 2+ line items, confirm it, verify stock dropped correctly on the Products page
- [ ] Attempt to confirm a challan for more stock than exists → clean error shown, no partial state
- [ ] Cancel a confirmed challan → stock restored, visible in movement log
- [ ] Hard-refresh on a nested route (e.g. a customer detail page) → does not 404 (Vercel rewrite check)
- [ ] Log out and confirm protected routes redirect to login, not a blank/broken page

---

## 3. Security Checklist (run against the live deployment)

Grounded in standard API security practice — role checks belong server-side, never trust the client, per `05_PROBLEM_AND_RESEARCH.md` §3.

### Authentication
- [ ] Login with wrong password → 401, generic message (doesn't reveal whether the email exists)
- [ ] Expired JWT → 401 on any protected route, not a 500 or silent pass-through
- [ ] Tampered JWT (flip one character of the signature) → rejected, not silently accepted
- [ ] No JWT on a protected route → 401
- [ ] Passwords are bcrypt-hashed in the DB, never stored or logged in plaintext (spot-check the DB directly)

### Authorization (role bypass — test every write endpoint, not just a sample)
- [ ] Login as Warehouse, attempt `POST /customers` (Warehouse shouldn't manage customers per role matrix) → 403
- [ ] Login as Accounts, attempt `POST /challans/:id/confirm` → 403
- [ ] Login as Sales, attempt `POST /products/:id/stock-movements` (Warehouse/Admin only) → 403
- [ ] Confirm the 403 happens at the API layer even if you bypass the frontend entirely (test via curl/Postman directly, not by clicking through the UI) — the whole point of `05_PROBLEM_AND_RESEARCH.md` §3 is that frontend hiding is not security

### Injection / input handling
- [ ] Submit SQL-injection-style strings (`' OR '1'='1`, `'; DROP TABLE users;--`) in a search/filter field → treated as literal text, no error, no data leak (Prisma parameterizes queries by default, but verify — don't assume)
- [ ] Submit an XSS payload (`<script>alert(1)</script>`) as a customer name/note → stored and rendered as inert text in the frontend, not executed (React escapes by default, but verify on any place using `dangerouslySetInnerHTML` — there shouldn't be any)
- [ ] Submit malformed/oversized JSON body to a write endpoint → 400 via Zod validation, not a 500 crash

### Secrets and config
- [ ] `.env` is not in the git repo (check `git log` history too, not just the current tree)
- [ ] No JWT secret, DB connection string, or API key appears anywhere in the frontend bundle (`grep` the built `dist/` output) or in any API error response
- [ ] `npm audit` (backend and frontend) run and any **high/critical** findings addressed or explicitly logged as accepted risk in `04_PROJECT_SUMMARY.md`

### Rate limiting / abuse (lightweight, time-permitting)
- [ ] Login endpoint has basic rate limiting (e.g. `express-rate-limit` or equivalent) to slow brute-force attempts — acceptable to log as a known limitation if time-boxed out, but should be attempted first since it's typically a 10-minute add

### CORS
- [ ] Confirm the API rejects requests from an arbitrary origin (test with a curl request setting `Origin` to something not the Vercel URL) and only allows the actual frontend origin

---

## 4. What to do with failures

Every checklist item that fails gets one of two outcomes, decided explicitly, not left ambiguous:
1. **Fixed now**, if the fix is quick relative to remaining time — then re-run the check to confirm.
2. **Logged as a known limitation** in `04_PROJECT_SUMMARY.md` with a one-line severity note (e.g. "Rate limiting not implemented — brute-force risk on login, low severity for a demo/internal tool, would add `express-rate-limit` next"). Never silently drop a failed check — an honest limitations list is worth more to a reviewer than a silent gap they find themselves.
