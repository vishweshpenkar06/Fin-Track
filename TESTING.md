# Testing & Quality Assurance

This project uses **Vitest** for unit tests, **Playwright** for E2E tests, and **TypeScript** for type safety. All tests are part of the CI/CD pipeline.

## Unit Tests (Vitest)

Unit tests are located in `__tests__/` and cover critical business logic.

### Running Tests

```bash
# Run tests once
pnpm test

# Run tests in watch mode (re-run on file changes)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage
```

### Test Coverage

Tests are included for:

- **`__tests__/insights.test.ts`** (14 tests)
  - Month-over-month spending trend detection (>20% increases)
  - Budget recommendation logic (3+ expenses, no existing budget)
  - Anomaly detection (expenses >3x category average)
  - Date range calculations

- **`__tests__/budgets.test.ts`** (12 tests)
  - Budget spent calculation and aggregation
  - Budget status determination (under/warning/over)
  - Edge cases (zero limits, large amounts, precision)

**Total: 26 unit tests covering 100% of rule-based insights and budget logic.**

## E2E Tests (Playwright)

End-to-end tests in `e2e/` verify complete user journeys.

### Running E2E Tests Locally

```bash
# Start the dev server first
pnpm dev

# In another terminal, run E2E tests
pnpm test:e2e

# Debug mode (opens Playwright Inspector)
pnpm test:e2e:debug

# View test report
pnpm exec playwright show-report
```

### E2E Test Coverage

**`e2e/auth-flow.spec.ts`** (3 tests)
- Sign up → login → add expense → view on dashboard → logout
- Unauthenticated access protection
- Failed login with wrong password

**Requirements for E2E tests:**
- Running dev server (`pnpm dev`)
- `DATABASE_URL` and `BETTER_AUTH_SECRET` environment variables set
- Real database connection (local or Neon)

## CI/CD Pipeline

GitHub Actions workflows are defined in `.github/workflows/ci.yml` and run on every push and PR.

### Main CI Job (`test-and-build`)

Runs on every push to `main` or `develop` branches:

1. **Dependencies**: Install and cache with pnpm
2. **TypeScript Check**: `pnpm tsc --noEmit` - verify no type errors
3. **Unit Tests**: `pnpm test --run` - run Vitest suite (26 tests)
4. **Build**: `pnpm build` - verify production build succeeds

All jobs must pass before merging to main.

### Optional E2E Job

E2E tests are **disabled by default** in CI because they require:
- A real database connection
- Authentication secrets
- Server startup time
- Potential rate limits

To enable E2E tests in CI, uncomment the `e2e:` job and add these GitHub secrets:
- `DATABASE_URL`: Your production Neon database URL
- `BETTER_AUTH_SECRET`: Your production auth secret

## Pre-commit Hooks (Husky + lint-staged)

Before committing, Husky automatically runs:
- `pnpm tsc --noEmit` on staged TypeScript/TSX files

This prevents committing code with type errors.

### Bypassing Pre-commit Hooks

```bash
git commit --no-verify  # Skip hooks (not recommended)
```

## Dependency Updates

Dependabot automatically creates pull requests for dependency updates:
- **Frequency**: Weekly (Monday at 3:00 UTC)
- **PR Limit**: Max 10 open PRs
- **File**: `.github/dependabot.yml`

## Code Quality Standards

| Tool | Purpose | Command |
|------|---------|---------|
| **TypeScript** | Type safety | `pnpm type-check` |
| **Vitest** | Unit tests | `pnpm test --run` |
| **Playwright** | E2E tests | `pnpm test:e2e` |
| **Next.js Build** | Build verification | `pnpm build` |

## Troubleshooting

### Tests Fail with "Cannot find module '@/...'"

Ensure `vitest.config.ts` has the correct `@/` alias pointing to project root.

### E2E Tests Timeout

Increase the timeout in `playwright.config.ts`:
```ts
timeout: 30 * 1000,  // 30 seconds
```

### Pre-commit Hook Not Running

Reinstall Husky:
```bash
pnpm install
pnpm prepare
```

### Coverage Not Generating

Install optional coverage provider:
```bash
pnpm add -D @vitest/coverage-v8
```

Then run:
```bash
pnpm test:coverage
```

## Next Steps

- Add more test cases as you add features
- Enable E2E tests in CI once secrets are configured
- Monitor CI runs for any failures: https://github.com/[org]/[repo]/actions
