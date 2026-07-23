# Contributing to FinTrack

Thanks for considering contributing! This guide will help you get started.

## Setup for Contributors

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL 14+ (or Neon account)

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/fintrack.git
cd fintrack
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```
DATABASE_URL=postgresql://localhost/fintrack_dev
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
```

For local dev, create a PostgreSQL database:
```bash
createdb fintrack_dev
# Schema auto-creates on first `pnpm dev`
```

### 3. Run Locally

```bash
pnpm dev
# http://localhost:3000
```

## Development Workflow

### Before Starting

1. Check [issues](https://github.com/yourusername/fintrack/issues) for work in progress
2. Open an issue if adding a new feature (discuss approach first)

### Code Quality

```bash
# Type checking
pnpm type-check

# Linting (will auto-fix most issues)
pnpm lint --fix

# Tests (add tests for new features)
pnpm test
pnpm test:watch

# E2E tests (if touching auth/navigation)
pnpm test:e2e
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feat/your-feature-name

# Make changes, commit with clear messages
git commit -m "feat: add expense categories filter"

# Push and open PR
git push origin feat/your-feature-name
```

## Code Style

- **TypeScript**: Strict mode, no `any` unless necessary (use `@ts-expect-error` with reason)
- **Imports**: Absolute paths (`@/lib`, `@/components`)
- **Components**: Functional, server components by default (`'use server'`)
- **Naming**: camelCase functions, PascalCase components

### Example Server Action

```typescript
'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { headers } from 'next/headers'

export async function myAction(data: { amount: number }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')

  const userId = session.user.id
  // Query with userId filter
  return await db.select()...
}
```

### Example Client Component

```typescript
'use client'

import { useState } from 'react'
import { myAction } from '@/app/actions/my-action'

export function MyComponent() {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await myAction({ amount: parseFloat(data.get('amount')) })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

## Testing

### Unit Tests (Vitest)

Add tests to `__tests__/`:

```typescript
import { describe, it, expect } from 'vitest'
import { calculateSpentBudget } from '@/app/actions/budgets'

describe('calculateSpentBudget', () => {
  it('should sum all expenses for category', () => {
    const result = calculateSpentBudget(expenses, 'Groceries')
    expect(result).toBe(150)
  })
})
```

### E2E Tests (Playwright)

Add to `e2e/`:

```typescript
import { test, expect } from '@playwright/test'

test('user can add expense', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await page.click('[data-testid="add-expense"]')
  await page.fill('input[name="amount"]', '50')
  await page.click('[data-testid="submit"]')
  await expect(page).toContainText('$50')
})
```

## PR Guidelines

- Clear description of changes
- Linked issue(s) if applicable
- All tests passing (`pnpm test`, `pnpm lint`)
- No console warnings/errors in dev
- Updated docs if needed (README, TESTING.md, etc.)

## Project Structure

```
app/                    # Next.js routes + server actions
lib/                    # Shared utilities (auth, db, constants)
components/             # React components
__tests__/              # Unit tests
e2e/                    # E2E tests
docs/adr/               # Architecture decisions
.github/workflows/      # CI/CD
```

## Architecture Quick Ref

- **All data ops**: Server actions (`app/actions/`)
- **Session check**: `auth.api.getSession({ headers: await headers() })`
- **User scoping**: Filter by `userId` in every query
- **Insights**: Rule-based in `app/actions/insights.ts` (no APIs)
- **Auth**: Better Auth with Postgres sessions

See [docs/adr/](./docs/adr/) for decisions.

## Questions?

- 📖 Read [TESTING.md](./TESTING.md) for test patterns
- 🏗️ Check [docs/adr/](./docs/adr/) for architecture questions
- 🐛 Open an issue for bugs
- 💬 Start a discussion for ideas

---

Made with ❤️ — thanks for contributing!
