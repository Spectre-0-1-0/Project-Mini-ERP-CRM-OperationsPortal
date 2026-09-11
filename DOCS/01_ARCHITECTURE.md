# ARCHITECTURE.md — Source of Truth

**Project:** Mini ERP + CRM Operations Portal
**Status:** Pre-build / handoff to build agent
**This doc is the single source of truth for schema, API contract, and business rules.** Any code that contradicts this doc is wrong; update this doc first, then code, never the reverse.

---

## 1. Stack (locked, do not deviate without updating this doc)

| Layer | Choice | Why |
|---|---|---|
| Backend runtime | Node.js 20 + TypeScript | required |
| Backend framework | Express.js | fastest to ship in 48h vs Nest's DI overhead |
| ORM | Prisma | fastest schema-to-migration-to-typed-client loop |
| DB | PostgreSQL via Supabase (free tier) | managed, free, gives instant connection string |
| Validation | Zod | schema validation matches Prisma models cleanly |
| Auth | JWT (jsonwebtoken) + bcrypt | "simple JWT" explicitly acceptable per spec |
| Frontend | React + Vite + TypeScript | fastest dev loop |
| Styling | Tailwind CSS | fastest to get "clean admin UI" without design debt |
| State/data fetching | TanStack Query (React Query) | handles loading/error/cache without hand-rolled fetch logic |
| Forms | React Hook Form + Zod resolver | shared validation schemas with backend where possible |
| Frontend deploy | Vercel | free, zero-config for Vite |
| Backend deploy | **Supabase Edge Functions** | consolidates DB + backend on one platform (per project decision); Deno-based, TypeScript/npm-compatible runtime — see §1a for the tradeoff this introduces and the fallback plan |
| DB host | Supabase | free Postgres, gives pooled connection string, same project as the Edge Functions above |

Do not introduce NestJS, GraphQL, MongoDB, or any framework not listed here without updating this table.

### 1a. The Supabase-for-backend tradeoff — read before Prompt 1

Supabase Edge Functions run on **Deno**, not Node, via the Supabase Edge Runtime. This matters for two things already baked into this doc set:

1. **Prisma on Deno is not a plain drop-in.** Prisma's default query engine expects a Node runtime. The supported path for using Prisma from an Edge Function is a **driver adapter** (`@prisma/adapter-pg` over the `pg` npm package, which *is* importable in Edge Functions since they support npm packages and Node built-ins) instead of Prisma's default engine. Set this up explicitly — do not assume `prisma generate` output works unmodified in an Edge Function.
2. **Route structure changes.** Express's single `app.ts` with `app.use('/customers', router)` style mounting doesn't map 1:1 onto Edge Functions, which are deployed as individual functions (or one function handling multiple paths via a router inside it, e.g. using **Hono** — a lightweight, edge-native router — instead of Express as the in-function router). Recommendation: keep the `modules/<name>/*.controller.ts` / `*.service.ts` layering from §2 exactly as-is (that logic doesn't care what invokes it), but change the routing shell: one Edge Function per module (`customers`, `products`, `challans`, `auth`) using Hono internally for sub-routing within that module, rather than a single monolithic Express app.

**Fallback plan (do not silently skip this — decide explicitly and log it in `03_CHANGELOG.md`):** if the Prisma-driver-adapter setup or the Express→Hono routing conversion eats more than ~2 hours without a working result, fall back to the original plan — deploy the untouched Express+Prisma backend to **Render** instead, and keep Supabase for the database only. A fully working Render deployment beats a half-working Edge Functions migration. This is exactly the kind of call `skills/agentic-loop.md`'s "Blocked" guidance exists for — time-box it, don't grind.

---

## 2. Folder Structure (enforce exactly)

```
repo-root/
  backend/
    prisma/
      schema.prisma
      migrations/
      seed.ts
    src/
      config/          # env loading, constants
      middleware/       # auth.middleware.ts, error.middleware.ts, validate.middleware.ts
      modules/
        auth/           # auth.controller.ts, auth.service.ts, auth.routes.ts
        customers/
        products/
        stock/
        challans/
      lib/              # prisma client singleton, jwt helpers, response helpers
      app.ts            # express app assembly
      server.ts         # entrypoint, listen()
    .env.example
    package.json
    tsconfig.json
  frontend/
    src/
      api/              # one file per module, axios/fetch wrappers + React Query hooks
      components/
        ui/             # Button, Input, Table, Badge, Modal, etc — the design system
        layout/         # Sidebar, Topbar, AppShell
      features/
        auth/
        customers/
        products/
        challans/
        dashboard/
      routes/           # route definitions (React Router)
      lib/              # auth context, query client, utils
      App.tsx
      main.tsx
    .env.example
    package.json
    vite.config.ts
  docs/                 # this doc set
  postman/
    collection.json
  README.md
```

Module pattern for every backend module: `*.routes.ts` → `*.controller.ts` (parses req, calls service, sends response) → `*.service.ts` (business logic, calls Prisma) → no logic in routes, no Prisma calls in controllers.

**If deploying to Supabase Edge Functions per §1a:** `backend/supabase/functions/<module>/index.ts` replaces `*.routes.ts` as the entrypoint (uses Hono for sub-routing within that module) but still imports and calls the same `*.controller.ts`/`*.service.ts` files unchanged — the layering survives the hosting decision, only the outermost entrypoint differs. Keep `*.service.ts` and `*.controller.ts` platform-agnostic (no `req`/`res` from Express types leaking into services) specifically so this swap stays cheap.

---

## 3. Database Schema (Prisma models — implement exactly, then generate migration)

```prisma
enum Role {
  ADMIN
  SALES
  WAREHOUSE
  ACCOUNTS
}

enum CustomerType {
  RETAIL
  WHOLESALE
  DISTRIBUTOR
}

enum CustomerStatus {
  LEAD
  ACTIVE
  INACTIVE
}

enum StockMovementType {
  IN
  OUT
}

enum ChallanStatus {
  DRAFT
  CONFIRMED
  CANCELLED
}

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role
  createdAt    DateTime @default(now())
  challans     SalesChallan[]
  stockMoves   StockMovement[]
}

model Customer {
  id            String         @id @default(uuid())
  name          String
  mobile        String
  email         String?
  businessName  String?
  gstNumber     String?
  customerType  CustomerType
  address       String?
  status        CustomerStatus @default(LEAD)
  followUpDate  DateTime?
  notes         FollowUpNote[]
  challans      SalesChallan[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model FollowUpNote {
  id          String   @id @default(uuid())
  customer    Customer @relation(fields: [customerId], references: [id])
  customerId  String
  note        String
  createdAt   DateTime @default(now())
}

model Product {
  id           String   @id @default(uuid())
  name         String
  sku          String   @unique
  category     String?
  unitPrice    Decimal  @db.Decimal(10, 2)
  currentStock Int      @default(0)
  minStock     Int      @default(0)
  location     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  movements    StockMovement[]
  challanItems ChallanItem[]
}

model StockMovement {
  id          String            @id @default(uuid())
  product     Product           @relation(fields: [productId], references: [id])
  productId   String
  quantity    Int
  type        StockMovementType
  reason      String
  createdBy   User              @relation(fields: [createdById], references: [id])
  createdById String
  createdAt   DateTime          @default(now())
}

model SalesChallan {
  id            String         @id @default(uuid())
  challanNumber String         @unique   // auto-generated, e.g. CH-2026-0001
  customer      Customer       @relation(fields: [customerId], references: [id])
  customerId    String
  items         ChallanItem[]
  totalQuantity Int
  status        ChallanStatus  @default(DRAFT)
  createdBy     User           @relation(fields: [createdById], references: [id])
  createdById   String
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model ChallanItem {
  id              String       @id @default(uuid())
  challan         SalesChallan @relation(fields: [challanId], references: [id])
  challanId       String
  product         Product      @relation(fields: [productId], references: [id])
  productId       String
  // SNAPSHOT fields — required by spec: "store product snapshot, not only product ID"
  productNameSnap String
  skuSnap         String
  unitPriceSnap   Decimal      @db.Decimal(10, 2)
  quantity        Int
}
```

**Non-negotiable business rules baked into this schema:**
- `ChallanItem` stores `productNameSnap`, `skuSnap`, `unitPriceSnap` at the time of challan creation — never re-read live product data to render an existing challan.
- `challanNumber` generation: format `CH-{YYYY}-{4-digit sequence}`, sequence resets per year, generated server-side inside the same DB transaction as challan creation (avoid race conditions — use a `SELECT ... FOR UPDATE` or a Postgres sequence, not a naive count()).
- Stock decrement on challan confirm MUST be atomic with the challan status update — wrap in a Prisma `$transaction`. Check `currentStock >= requestedQty` for every line item inside the transaction before committing; if any line fails, roll back the whole transaction and return a 409 with the specific product(s) that are short.
- Stock must never go negative. This is enforced at the transaction level, not just the UI.
- Every stock change (including the one caused by challan confirmation) must produce a `StockMovement` row. Challan-confirm stock decrements get `reason: "Challan {challanNumber} confirmed"`.

---

## 4. API Contract

Base URL: `/api/v1`. All responses: `{ success: boolean, data?: ..., error?: { message: string, details?: any } }`. Auth via `Authorization: Bearer <jwt>` header, except `/auth/login`.

### Auth
| Method | Path | Role | Notes |
|---|---|---|---|
| POST | /auth/login | public | body: `{ email, password }` → `{ token, user }` |
| GET | /auth/me | any authenticated | returns current user |

### Customers
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | /customers | any | query: `page, limit, search, status, type` |
| GET | /customers/:id | any | includes notes[] |
| POST | /customers | Admin, Sales | |
| PUT | /customers/:id | Admin, Sales | |
| POST | /customers/:id/notes | Admin, Sales | body: `{ note }` |

### Products
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | /products | any | query: `page, limit, search, category, lowStock` (lowStock=true filters currentStock<=minStock) |
| GET | /products/:id | any | |
| POST | /products | Admin, Warehouse | |
| PUT | /products/:id | Admin, Warehouse | |
| POST | /products/:id/stock-movements | Admin, Warehouse | body: `{ quantity, type, reason }` — manual adjustment, not via challan |
| GET | /products/:id/stock-movements | any | movement history for one product |

### Challans
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | /challans | any | query: `page, limit, status, customerId` |
| GET | /challans/:id | any | |
| POST | /challans | Admin, Sales | body: `{ customerId, items: [{productId, quantity}] }` → created as DRAFT, status must be explicitly set |
| PUT | /challans/:id | Admin, Sales | only editable while DRAFT |
| POST | /challans/:id/confirm | Admin, Sales | triggers stock transaction described above; 409 if insufficient stock |
| POST | /challans/:id/cancel | Admin, Sales | only from DRAFT or CONFIRMED (confirmed cancel reverses stock — write matching IN movement) |

**Validation on every write endpoint:** Zod schema per route, 400 on failure with field-level messages. **Status codes:** 200/201 success, 400 validation, 401 no/bad token, 403 wrong role, 404 not found, 409 conflict (stock, duplicate SKU/email), 500 unhandled (never leak stack trace to client, log server-side).

---

## 5. Role Matrix

| Action | Admin | Sales | Warehouse | Accounts |
|---|:---:|:---:|:---:|:---:|
| Manage customers | ✅ | ✅ | ❌ | view only |
| Manage products | ✅ | view only | ✅ | view only |
| Manual stock movement | ✅ | ❌ | ✅ | ❌ |
| Create/edit challan | ✅ | ✅ | ❌ | view only |
| Confirm/cancel challan | ✅ | ✅ | ❌ | ❌ |

Enforce via `requireRole([...])` middleware on every route, not just frontend hiding.

---

## 6. Environment Variables

Backend `.env`: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `CORS_ORIGIN`
Frontend `.env`: `VITE_API_BASE_URL`

Never commit `.env`. `.env.example` ships with keys but no values.

---

## 7. Definition of Done (per module)

A module is done when: routes wired → Zod validation on every write → role middleware applied → Prisma calls in service layer only → returns correct status codes → frontend page consumes it with loading/error/empty states → manually tested via Postman → entry added to CHANGELOG.md.
