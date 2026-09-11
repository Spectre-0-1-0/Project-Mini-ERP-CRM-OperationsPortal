# SKILL: Agentic Build Loop

How to work through this project without drifting, losing track of state, or silently breaking earlier modules while building later ones.

## The loop, per task

1. **Plan** — restate the task in one line, name the specific files you'll touch, name the Definition of Done (pull from `01_ARCHITECTURE.md` §7 or the relevant skill doc).
2. **Implement** — do the smallest complete version of the task. Complete means: it actually runs, not "the code looks right."
3. **Self-verify** — actually execute the path: hit the endpoint with a real request (Postman/curl), or actually click through the UI flow. "It should work" is not verification. For anything touching stock or challan confirm, test both the success path and the failure path (insufficient stock, invalid role) — these are the two paths a reviewer will specifically try to break.
4. **Log** — one line in `03_CHANGELOG.md`: what changed, why, any deviation from the plan.
5. **Next** — move to the next task in the build order from `00_AGENTS.md`. Do not jump ahead to a later module "while you're in there" — finish and verify the current one first.

## Checkpoint discipline

After finishing each of the 4 backend modules and each of the 4 frontend feature areas (per `00_AGENTS.md` build order), do a **regression pass**: re-run the previous modules' core flows (login as each role, one CRUD action per module) to confirm nothing broke. This catches the most common agentic-build failure mode: fixing module 4 silently breaks module 2's assumption.

## State tracking

`04_PROJECT_SUMMARY.md` is the live source of truth for "what's actually done right now." Update its status table at the end of every checkpoint, not just at the end of the whole project. If you get interrupted or context resets, the next session should be able to read `04_PROJECT_SUMMARY.md` and `03_CHANGELOG.md` and know exactly where to resume — write for that reader.

## When something doesn't match the spec

Don't guess and move on. Re-read the relevant section of `01_ARCHITECTURE.md` and the original case study PDF once. If still ambiguous after that, implement the most defensible interpretation, log it explicitly under "Deviations Proposed" in `03_CHANGELOG.md` with your reasoning, and continue — don't block the whole build on one ambiguity.

## Scope guard

Before adding anything not explicitly in `01_ARCHITECTURE.md`, ask: is this in the required modules, the bonus list, or neither? If neither, don't build it — log it as a "deferred idea" in `04_PROJECT_SUMMARY.md` instead and move on. 48 hours has no slack for unscoped polish.

## Failure recovery

If a migration, deploy, or dependency install fails: read the actual error message before trying a fix. Don't cargo-cult a fix from memory without confirming it matches the actual error. If stuck more than ~20 minutes on one blocker, log it in `03_CHANGELOG.md` under a "Blocked" note, take the pragmatic fallback (e.g. skip AWS bonus deploy, use the documented free-tier path instead), and keep moving — a fully working core beats a broken stretch goal.
