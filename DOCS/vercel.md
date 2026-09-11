# SKILL: Vercel Deployment (Frontend)

Applies to: deploying the `frontend/` Vite+React app only. Backend does NOT go on Vercel (see rationale in `01_ARCHITECTURE.md` §1) — it goes on Render.

## Setup

1. Push repo to GitHub first (Vercel deploys from a connected repo).
2. In Vercel: New Project → import repo → set **Root Directory** to `frontend/` (critical — this is a monorepo, Vercel must not try to build from repo root).
3. Framework preset: Vite (auto-detected from `frontend/package.json`).
4. Build command: `npm run build` (default). Output directory: `dist` (default for Vite).

## Environment variables

Set in Vercel project settings → Environment Variables (not committed to repo):
- `VITE_API_BASE_URL` → the live Render backend URL (e.g. `https://mini-erp-api.onrender.com/api/v1`). **Note:** this must be set only after the backend is deployed and its URL is known — deploy order is DB → Backend → Frontend, per `00_AGENTS.md`.

Any `VITE_`-prefixed var is the only kind exposed to client-side code by Vite's build — never put a secret behind a `VITE_` prefix.

## SPA routing

React Router client-side routes will 404 on hard refresh unless Vercel rewrites all paths to `index.html`. Add `frontend/vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## CORS note

The backend's `CORS_ORIGIN` env var (on Render) must be set to the exact Vercel production URL once known, or requests will fail silently in the browser console with a CORS error — this is the single most common "frontend deployed fine but nothing loads" bug in this kind of split deploy.

## Verification checklist before moving to next step

- [ ] Production URL loads the login page (not a blank screen or 404)
- [ ] Login actually succeeds against the live backend (tests both Vercel→Render connectivity and CORS in one action)
- [ ] Hard-refreshing a nested route (e.g. `/customers/some-id`) does not 404
