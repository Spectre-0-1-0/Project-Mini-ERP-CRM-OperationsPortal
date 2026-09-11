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

## Backend hosting on Supabase Edge Functions (replaces Render — see `01_ARCHITECTURE.md` §1a)

This project hosts the API on Supabase Edge Functions, not a separate Node host. Setup:

```
npm install -g supabase          # CLI
supabase login
supabase link --project-ref <project-ref>
supabase functions new customers # scaffolds backend/supabase/functions/customers/index.ts
```

Each module (`auth`, `customers`, `products`, `challans`) is its own function. Inside each `index.ts`, use **Hono** as the in-function router (edge-native, npm-installable, far less friction than Express inside Deno):

```ts
import { Hono } from 'npm:hono'
const app = new Hono().basePath('/customers')
app.get('/', listCustomersController)
app.post('/', createCustomerController)
Deno.serve(app.fetch)
```

Import the same `*.controller.ts`/`*.service.ts` files built for the Express version — per §1a, they must stay platform-agnostic (no Express `Request`/`Response` types) so they work unmodified here.

**Prisma on Edge Functions:** do not use Prisma's default engine. Use the driver adapter:

```
npm install @prisma/adapter-pg pg
```

```ts
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
const adapter = new PrismaPg({ connectionString: Deno.env.get('DATABASE_URL') })
const prisma = new PrismaClient({ adapter })
```

Deploy: `supabase functions deploy customers --no-verify-jwt` (we verify JWTs ourselves in middleware per `01_ARCHITECTURE.md`'s own auth system, not Supabase Auth — hence `--no-verify-jwt`). Secrets (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`): `supabase secrets set JWT_SECRET=...`.

**Verification checklist:**
- [ ] Each function responds to a real HTTP request at its deployed URL, not just `supabase functions serve` locally
- [ ] `DATABASE_URL` secret is the **direct** (non-pooled) connection or a pooled one confirmed compatible with the `pg` driver adapter — test this explicitly, pooler quirks are a common edge-function gotcha
- [ ] CORS headers are set inside each Hono app (Supabase Edge Functions don't apply CORS for you) matching the live Vercel frontend URL

**If this setup isn't working within ~2 hours:** stop and use the Render fallback from `01_ARCHITECTURE.md` §1a. Log the decision in `03_CHANGELOG.md` either way.

## Common failure mode

Connection timeouts from serverless/free-tier cold starts — if Render's free tier spins down on inactivity, the first request after idle will be slow (~30-60s). This is expected on free hosting and worth noting honestly in `04_PROJECT_SUMMARY.md` known limitations, not something to "fix" within the 48h budget.

## Verification checklist

- [ ] `npx prisma migrate deploy` succeeds against the Supabase DB from Render's environment (not just locally)
- [ ] Seed script has run once in production so test credentials in the README actually work
