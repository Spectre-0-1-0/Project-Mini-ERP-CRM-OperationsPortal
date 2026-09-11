# SKILL: Supabase (Postgres DB)

Applies to: DB hosting only. We are using Supabase purely as free managed Postgres — not its Auth, Storage, or Row Level Security features. Our own JWT auth (per `01_ARCHITECTURE.md`) is the full auth system.

## Setup

1. Create a new Supabase project (free tier). Note the project's Postgres password at creation time — it's shown once.
2. Get the connection string: Project Settings → Database → Connection String → use the **pooled connection (port 6543, pgbouncer)** for the app's `DATABASE_URL`, and the **direct connection (port 5432)** as `DIRECT_URL` for running Prisma migrations (Prisma migrate needs a non-pooled connection).

`backend/.env`:
```
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

`prisma/schema.prisma` datasource block:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## Row Level Security (RLS)

Supabase enables RLS by default on tables created through its dashboard UI, but tables created via Prisma migrations do not get RLS enabled automatically — this is fine and expected here, since access control is fully handled in the Express API layer, not at the DB layer. Do not spend time configuring Supabase RLS policies for this project; it would be redundant with the role-middleware already specified in `01_ARCHITECTURE.md` §5 and is out of scope.

## Migrations workflow

```
npx prisma migrate dev --name init     # local dev, creates migration + applies it
npx prisma generate                    # regenerate client after schema changes
npx prisma db seed                     # run seed.ts (creates one user per role)
```

For production (Render), run `npx prisma migrate deploy` as part of the Render build/start command, not `migrate dev`.

## Common failure mode

Connection timeouts from serverless/free-tier cold starts — if Render's free tier spins down on inactivity, the first request after idle will be slow (~30-60s). This is expected on free hosting and worth noting honestly in `04_PROJECT_SUMMARY.md` known limitations, not something to "fix" within the 48h budget.

## Verification checklist

- [ ] `npx prisma migrate deploy` succeeds against the Supabase DB from Render's environment (not just locally)
- [ ] Seed script has run once in production so test credentials in the README actually work
