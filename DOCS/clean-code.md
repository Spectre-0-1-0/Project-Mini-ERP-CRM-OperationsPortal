# SKILL: Clean Code Rules (TypeScript / Node / React)

## Backend layering (strict)

`routes.ts` — only wires HTTP method+path to controller function, plus middleware (auth, role, validate).
`controller.ts` — parses `req`, calls one service function, formats the `res.json()` response. No business logic, no Prisma.
`service.ts` — all business logic, all Prisma calls, throws typed errors (`AppError(status, message)`), never touches `req`/`res`.

This isn't ceremony — it's what makes the codebase reviewable by someone who didn't write it, which matters because a human reviewer will judge this in a case study.

## Naming

- Files: `kebab-case.ts`. Types/interfaces: `PascalCase`. Variables/functions: `camelCase`. Constants that are truly fixed: `SCREAMING_SNAKE_CASE`.
- Boolean variables/props read as a question: `isLoading`, `hasError`, `canEdit` — not `loading`, `error`, `editable` alone.
- No abbreviations that aren't universally obvious (`qty` is fine, `cst` for customer is not).

## Error handling

- Backend: one central error-handling middleware. Services throw `AppError`; controllers don't try/catch business errors, they let them bubble to the error middleware. Only try/catch where you need to translate a specific error (e.g. Prisma unique constraint → 409).
- Frontend: every mutation (React Query `useMutation`) has `onError` that surfaces a toast with the server's error message, not a generic "Something went wrong" unless the server gave nothing useful.
- Never swallow an error silently (empty catch block). Never `console.log` an error and continue as if nothing happened.

## Validation

- Zod schemas live next to the route that uses them, exported so tests (or the frontend, via a shared types package if time allows) can reuse the inferred type.
- Validate at the boundary (route middleware), not scattered checks inside service logic. Service logic can assume input is already valid.

## Typing discipline

- `strict: true` in tsconfig. No `any`. If a type is genuinely unknown (e.g. raw third-party JSON), use `unknown` and narrow it.
- Prisma-generated types are the source of truth for DB shapes — don't hand-write duplicate interfaces for the same entity.
- API response envelope typed once (`ApiResponse<T>`), reused everywhere, not re-declared per endpoint.

## React specifics

- One component = one responsibility. If a component's JSX needs its own scroll to read, split it.
- Data fetching via React Query hooks in `api/` files, never a raw `useEffect` + `fetch` in a component.
- Derived state is computed at render, not duplicated into `useState` + synced with another `useEffect`.
- Props typed with explicit `interface XProps`, not inline object types repeated across files.

## DRY, but not premature

Extract a shared function/component after the second duplication, not preemptively before the first. Don't build a generic "form builder" abstraction for a 48-hour project — write the three forms directly.

## Comments

Comment *why*, not *what* — the code should say what it does. Comment business-rule reasoning that isn't obvious from reading the line (e.g. "// transaction required: stock check + decrement must be atomic, see ARCHITECTURE.md §3").

## Commit hygiene (ties to `skills/github.md`)

One logical change per commit. Don't commit commented-out code. Don't commit `.env`, `node_modules`, build output — verify `.gitignore` before the first commit.
