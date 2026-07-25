# FinTrack — Complete Project Reference

> Generated from comprehensive analysis and 7 batches of fixes (31 total changes) + Google Auth.
> For Claude Code or any AI coding assistant working on this project.

---

## Project Overview

**FinTrack** is a personal finance tracking web application built with Next.js 16. It lets users track expenses, manage budgets, view financial reports, and get rule-based spending insights.

**Core value proposition**: Simple, fast, zero-cost financial tracking with no external API dependencies.

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | Next.js + React | 16.2.6 / 19.x | App routing & UI |
| **Styling** | Tailwind CSS | 4.3.3 | Design system |
| **Icons** | Lucide React | 1.16.0 | UI icons |
| **Charts** | Recharts | 3.9.2 | Data visualization |
| **Backend** | Next.js Server Actions | — | Business logic |
| **Auth** | Better Auth | 1.6.23 | Email/password + Google OAuth sessions |
| **Database** | Neon PostgreSQL | — | Data persistence |
| **ORM** | Drizzle ORM | 0.45.2 | Type-safe queries |
| **Validation** | Zod | 4.4.3 | Input validation |
| **Testing** | Vitest + Playwright | 4.1.10 / 1.61.1 | Unit & E2E tests |
| **Linting** | ESLint | 10.7.0 | Code quality |
| **TypeScript** | TypeScript | 5.7.3 | Type safety |
| **Deployment** | Vercel | — | CI/CD & hosting |

---

## Architecture

```
Client (Browser)          Server (Vercel Functions)        Data Layer
┌─────────────────┐      ┌──────────────────────┐      ┌──────────────┐
│ React 19        │      │ Server Actions        │      │ Drizzle ORM  │
│ Next.js 16      │──────│ (getUserId + DB)      │──────│              │
│ Tailwind CSS    │      │ Better Auth           │      │ Neon Postgres│
│ Recharts        │      │ (Session Management)  │      │ (Serverless) │
└─────────────────┘      └──────────────────────┘      └──────────────┘
```

**Key architectural decisions** (documented in `docs/adr/`):

1. **Better Auth over NextAuth** — Simpler session management, explicit database control, smaller bundle (~15kb vs ~50kb)
2. **Rule-based insights (not LLM)** — Zero API costs, instant results, deterministic. Cost decision, not oversight.
3. **Neon serverless Postgres** — Auto-scaling, built-in connection pooling (pgBouncer), no DB ops overhead
4. **Categories as plain strings** — Not a separate table. Deliberate choice to avoid unnecessary migration.

---

## Project Structure

```
fintrack/
├── app/
│   ├── (app)/                    # Protected app routes
│   │   ├── dashboard/page.tsx    # Overview + insights + recent transactions
│   │   ├── expenses/page.tsx     # Expense CRUD with search/filter
│   │   ├── budgets/page.tsx      # Budget management with progress bars
│   │   ├── reports/page.tsx      # Charts + analytics (pie, line, bar)
│   │   ├── settings/page.tsx     # User profile, notifications, data export/delete
│   │   ├── layout.tsx            # Sidebar navigation + theme toggle
│   │   └── error.tsx             # App-level error boundary
│   ├── api/auth/[...all]/route.ts # Better Auth handler
│   ├── login/signup/page.tsx     # Public auth pages
│   ├── onboarding/page.tsx       # Post-signup flow (currency + budget)
│   ├── actions/                  # Server actions (all user-scoped)
│   │   ├── expenses.ts           # getExpenses, addExpense, updateExpense, deleteExpense
│   │   ├── budgets.ts            # getBudgets, addBudget, updateBudget, deleteBudget
│   │   ├── income.ts             # getIncome, addIncome, updateIncome, deleteIncome
│   │   ├── insights.ts           # Rule-based insights (0 API calls)
│   │   ├── reports.ts            # Chart data aggregations
│   │   └── settings.ts           # Profile, currency, notifications, export, delete
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout (theme, analytics)
│   └── error.tsx                 # Global error boundary
├── components/
│   ├── auth-form.tsx             # Shared sign-in/up form
│   ├── google-sign-in.tsx        # Google OAuth sign-in button
│   ├── error-boundary.tsx        # Reusable error UI component
│   ├── theme-toggle.tsx          # Light/dark mode toggle
│   └── ui/button.tsx             # shadcn button component
├── lib/
│   ├── auth.ts                   # Better Auth server config
│   ├── auth-client.ts            # Better Auth client
│   ├── auth-utils.ts             # Shared getUserId() helper
│   ├── date-utils.ts             # formatLocalDate(), getCurrentMonth()
│   ├── chart-colors.ts           # CHART_COLORS, TOOLTIP_STYLE
│   ├── categories.ts             # Expense category constants + colors
│   ├── types.ts                  # Expense, Budget, Income, Transaction interfaces
│   └── db/
│       ├── index.ts              # Drizzle + pg Pool (serverless-optimized)
│       └── schema.ts             # All tables with indexes
├── __tests__/                    # Unit tests (80 tests)
│   ├── budgets.test.ts           # 12 tests - budget calculations
│   ├── insights.test.ts          # 14 tests - insights engine
│   ├── expenses.test.ts          # 15 tests - categories, dates, filtering
│   ├── income.test.ts            # 12 tests - income calculations
│   ├── validation.test.ts        # 16 tests - Zod schemas
│   └── server-actions.test.ts    # 11 tests - auth, DB patterns, data shapes
├── e2e/                          # E2E tests (Playwright)
├── docs/adr/                     # Architecture decisions
│   ├── 001-better-auth-over-nextauth.md
│   ├── 002-rule-based-insights-over-llm-api.md
│   └── 003-neon-serverless-postgres.md
├── lib/chart-colors.ts           # Shared chart color palette
├── lib/types.ts                  # Shared TypeScript interfaces
├── vitest.config.ts              # Vitest config (excludes .mimocode/)
├── eslint.config.mjs             # ESLint v10 config
├── tsconfig.json                 # TypeScript config (strict mode enabled)
├── next.config.mjs               # Next.js config + security headers
└── package.json                  # Dependencies and scripts
```

---

## Database Schema

### Better Auth Tables

- **user** — id, name, email, emailVerified, image, currency, notificationPreferences, createdAt, updatedAt
- **session** — id, expiresAt, token, ipAddress, userAgent, userId (FK), createdAt, updatedAt
- **account** — id, accountId, providerId, userId (FK), tokens, password, createdAt, updatedAt
- **verification** — id, identifier, value, expiresAt, createdAt, updatedAt

### App Tables

- **expense** — id, userId, amount, category, description, date, paymentMethod, receipt, createdAt, updatedAt
- **budget** — id, userId, category, limit, spent, month, alerts, createdAt, updatedAt
- **income** — id, userId, amount, source, date, description, createdAt, updatedAt

### Indexes

- `expense(userId, date)` — for date-range queries
- `expense(userId, category)` — for category filtering
- `budget(userId, month)` — for monthly budget lookups
- `income(userId, date)` — for date-range queries

### Key Schema Notes

- `userId` columns do NOT have foreign key constraints (deliberate — easier schema iteration)
- Categories are plain string columns, not a separate table
- `currency` defaults to 'USD'
- `notificationPreferences` is JSONB with defaults: `{ budgetAlerts: true, weeklySummary: true, aiInsights: false }`

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon pooled URL) |
| `BETTER_AUTH_SECRET` | Yes | Auth secret (min 32 chars, generate with `openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth Client ID (from Google Cloud Console) |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth Client Secret (from Google Cloud Console) |
| `BETTER_AUTH_URL` | No | Base URL for auth (auto-detected from Vercel env vars) |
| `VERCEL_URL` | Auto | Set by Vercel deployment |
| `VERCEL_PROJECT_PRODUCTION_URL` | Auto | Set by Vercel deployment |

**`DATABASE_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` throw clear errors if missing** — no silent fallbacks.

---

## Scripts

```bash
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # ESLint
pnpm lint:fix         # ESLint with auto-fix
pnpm type-check       # TypeScript type checking
pnpm test             # Run unit tests (Vitest)
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report
pnpm test:e2e         # E2E tests (Playwright)
```

---

## All Changes Made (Batches 1-7)

### Batch 1: Security, No-Ops, Bugs (7 fixes)

1. **Hardcoded fallback secret** (`lib/auth.ts`) — Replaced `process.env.BETTER_AUTH_SECRET || 'dev-only-secret'` with a throw if missing
2. **Input validation** (`expenses.ts`, `budgets.ts`, `income.ts`) — Added Zod schemas for all server actions (amount>0, category enum, date format, field lengths)
3. **Budget date range bug** (`budgets.ts`) — Fixed hardcoded `b.month + '-31'` to use `endOfMonth(parseISO(monthStart))`
4. **Currency not persisted** — Added `currency` column to user schema, `updateUserCurrency` action, wired onboarding to save currency
5. **Notification preferences not saved** — Added `notificationPreferences` JSONB column, `updateNotificationPreferences` action, wired checkboxes to save on change
6. **Profile save no-op** (`settings.ts`) — Wired `handleSave` to call `updateUserName` via Better Auth's `updateUser` API
7. **Data export incomplete** — `handleExportData` now fetches expenses, budgets, and income via server actions

### Batch 2: Performance & Code Quality (8 fixes)

8. **N+1 query in getBudgets** — Replaced per-category expense fetch with single `GROUP BY category` + `SUM` query
9. **Reports fetch-all-then-filter** — Added `getDateRange()` helper; all 4 report functions now use `gte/lte` at DB level
10. **Missing DB indexes** — Added 4 indexes: `expense(userId, date)`, `expense(userId, category)`, `budget(userId, month)`, `income(userId, date)`
11. **Dashboard pulls full history** — Scoped expenses/incomes to `startOfMonth(new Date())`
12. **Duplicated getUserId()** — Extracted to `lib/auth-utils.ts`; removed from all 6 action files
13. **Replace any types** — Removed all `eslint-disable @typescript-eslint/no-explicit-any` and `as any` casts in `insights.ts`
14. **Inconsistent revalidation** — `addIncome`/`updateIncome`/`deleteIncome` now revalidate `/dashboard` + `/reports`
15. **Hardcoded month strings** — Created `lib/date-utils.ts` with `formatLocalDate()` + `getCurrentMonth()`

### Batch 3: Error Handling, UX, Tests, A11y (4 fixes)

16. **Error boundaries** — Created `components/error-boundary.tsx`, `app/error.tsx`, `app/(app)/error.tsx`
17. **Optimistic UI** — Added `saving` and `deletingId` states to expenses and budgets pages with Loader2 spinners
18. **Unit tests** — Added 3 new test files: `expenses.test.ts` (15), `income.test.ts` (12), `validation.test.ts` (16)
19. **Accessibility** — Fixed 48+ issues: focus-visible styles, aria-labels on icon-only buttons, role=dialog on modals, role=progressbar on progress bars, aria-pressed on filter buttons, sr-only label on search input

### Batch 4: Type Safety & Integration Tests (2 fixes)

20. **Replace remaining any types** — Created `lib/types.ts` with `Expense`, `Budget`, `Income`, `Transaction` interfaces. Replaced all `useState<any[]>` in client pages
21. **Integration tests** — Added `server-actions.test.ts` (11 tests) covering auth, DB patterns, data shapes, revalidation, error handling

### Batch 5: Config Cleanup & Polish (3 fixes)

22. **pnpm config warnings** — Fixed `prepare` script (`husky install` → `husky`), removed ignored `pnpm.overrides` field, replaced stale "Connected with Bank" placeholder
23. **Global focus styles** — Added `button { focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary }` in globals.css base layer
24. **TypeScript strictness** — Verified `strict: true` already enabled in tsconfig.json

### Batch 6: Placeholder UI, DB Hardening, Chart Colors (3 fixes)

25. **Remove placeholder UI** — Simplified onboarding from 3 steps to 2 (removed "Bank linking coming soon"), changed settings "Coming soon" buttons to disabled divs
26. **Harden DB connection** — Removed hardcoded fallback URL, now throws if `DATABASE_URL` is missing
27. **Extract chart colors** — Created `lib/chart-colors.ts` with `CHART_COLORS` and `CHART_COLORS_HEX` arrays

### Batch 7: Light Mode, Security, ESLint, Theming (4 fixes)

28. **Light mode support** — Added light mode CSS variables, `ThemeToggle` component with Sun/Moon icons + localStorage, root layout with flash-free theme loading
29. **Security headers** — Added to `next.config.mjs`: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, HSTS, Permissions-Policy
30. **Stricter ESLint** — Added `eqeqeq`, `no-var`, `prefer-const` rules. Fixed 4 unused imports
31. **Tooltip/chart theming** — Replaced all hardcoded hex colors with CSS variables, added `TOOLTIP_STYLE` to `chart-colors.ts`

---

## Key Files to Know

| File | Purpose | Notes |
|------|---------|-------|
| `lib/auth.ts` | Better Auth config | Email + Google OAuth, throws if secrets missing |
| `lib/auth-client.ts` | Better Auth client | Exposes `signIn`, `signUp`, `signOut`, `useSession` |
| `components/google-sign-in.tsx` | Google OAuth button | Social sign-in with Google logo |
| `lib/db/index.ts` | DB connection | Throws if `DATABASE_URL` missing |
| `lib/db/schema.ts` | All database tables | Includes indexes |
| `lib/auth-utils.ts` | Shared `getUserId()` | Server-only (imports `next/headers`) |
| `lib/date-utils.ts` | `formatLocalDate()`, `getCurrentMonth()` | Safe for client/server |
| `lib/types.ts` | Shared TypeScript interfaces | Expense, Budget, Income, Transaction |
| `lib/chart-colors.ts` | Chart color palette + tooltip styles | Theme-aware |
| `lib/categories.ts` | Category constants + colors | Used by expenses and budgets |
| `app/actions/*.ts` | Server actions | All use Zod validation, getUserId() |
| `app/globals.css` | Theme variables | Light + dark mode, button focus styles |
| `next.config.mjs` | Next.js config + security headers | X-Frame-Options, HSTS, etc. |

---

## Testing

**80 tests** across 6 test files:

| File | Tests | Coverage |
|------|-------|----------|
| `budgets.test.ts` | 12 | Budget calculations, status logic, edge cases |
| `insights.test.ts` | 14 | Spending trends, budget recommendations, anomaly detection |
| `expenses.test.ts` | 15 | Categories, date utilities, filtering, amount formatting |
| `income.test.ts` | 12 | Income calculations, balance, date filtering, aggregation |
| `validation.test.ts` | 16 | Zod schemas for expense/budget/income |
| `server-actions.test.ts` | 11 | Auth, DB patterns, data shapes, revalidation, errors |

---

## Common Patterns

### Server Action Pattern
```typescript
'use server'
import { z } from 'zod'
import { getUserId } from '@/lib/auth-utils'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function myAction(data: { amount: number }) {
  // 1. Validate with Zod
  const parsed = schema.safeParse(data)
  if (!parsed.success) throw new Error(message)

  // 2. Get authenticated user
  const userId = await getUserId()

  // 3. Query with userId filter
  await db.insert(table).values({ ...parsed.data, userId })

  // 4. Revalidate affected paths
  revalidatePath('/dashboard')
}
```

### Client Page Pattern
```typescript
'use client'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function Page() {
  const [data, setData] = useState<Type[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try { setData(await serverAction()) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try { await serverAction(data) }
    finally { setSaving(false) }
  }

  return (
    <div>
      {loading ? 'Loading...' : data.map(...)}
      <button onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="animate-spin" />}
        Save
      </button>
    </div>
  )
}
```

---

## Known Issues / Future Work

- Better Auth `baseURL` warning in build (cosmetic — auto-detected at runtime)
- No Plaid integration yet (placeholder removed from onboarding)
- No Two-Factor Authentication yet (placeholder in settings)
- No password change flow (shows "Managed via email" in settings)
- `pnpm.overrides` removed from package.json (pnpm v11 ignores it)

## Google OAuth Setup

- Credentials stored in `.env.local` (not committed to git)
- Callback URL: `http://localhost:3000/api/auth/callback/google` (local) / `https://your-domain.vercel.app/api/auth/callback/google` (production)
- Accounts stored in existing `account` table with `providerId: 'google'`
- Google sign-in button appears on both login and signup pages

---

## Deployment

1. Set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` in Vercel env vars
2. Connect Neon integration in Vercel
3. Add production callback URL to Google Cloud Console OAuth settings
4. Push to GitHub or run `vercel --prod`
5. Schema auto-creates on first request (no migrations needed)

---

*Last updated: 2026-07-25*
*Total changes: 31 fixes across 7 batches + Google OAuth*
*Test count: 80 tests, 6 test files*
