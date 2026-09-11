# SKILL: GitHub Workflow

## Repo setup

- Repo name: `mini-erp-crm-portal` (or similar, kebab-case).
- `.gitignore` from the start: `node_modules/`, `dist/`, `build/`, `.env`, `.env.local`, `*.log`, `.DS_Store`. Verify before first commit — never let `.env` slip into history (if it does, rotate the secret, don't just delete-and-recommit).
- Root `README.md` per `04_PROJECT_SUMMARY.md`/case-study requirements: setup, env vars, run locally, deploy, architecture summary, known limitations.

## Commit conventions

Conventional-commit style prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`. One logical change per commit — not one giant "initial commit" with the whole app, and not fifty micro-commits per file save. Target granularity: one commit per completed task from the agentic loop (see `skills/agentic-loop.md`).

Examples:
- `feat: add customer CRUD API with role guards`
- `fix: prevent negative stock on challan confirm`
- `docs: update changelog for products module`

## Branching

For a 48-hour solo build, trunk-based is fine (commit to `main` directly) — a full PR-review branching strategy is overhead a reviewer won't reward here. If you want to show branching discipline for bonus polish, use short-lived feature branches merged via PR with a one-line description, but don't let this eat build time.

## What "proper commits" (per case study spec) means to a reviewer

A commit history that tells the story of the build in order (schema → auth → each module → frontend → deploy), not a single squashed commit and not meaningless "wip" commits. This is one of the few things a reviewer can assess in 30 seconds, so don't skip it.

## Before final submission

- Confirm `.env.example` exists in both `backend/` and `frontend/` with all required keys, no real values.
- Confirm the repo is public or the reviewer has been given access.
- Tag or note the final commit hash in `04_PROJECT_SUMMARY.md` submission section.
