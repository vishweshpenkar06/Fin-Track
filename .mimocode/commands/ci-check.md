---
description: Run the full CI verification suite (type-check, lint, test, build) in the correct order. Set env vars automatically if needed.
---

# CI Verification Suite

Run the project's full verification pipeline in the correct order. Stops on first failure and reports what went wrong.

## Procedure

Detect the project type from the working directory, then run:

### For Next.js / Node.js projects (pnpm):

```powershell
# 1. Type check
$env:BETTER_AUTH_SECRET = "test-secret-at-least-32-characters-long"
pnpm type-check 2>&1

# 2. Lint
pnpm lint 2>&1

# 3. Tests
pnpm test 2>&1

# 4. Build (with required env vars)
$env:BETTER_AUTH_SECRET = "test-secret-at-least-32-characters-long"
pnpm build 2>&1
```

### For Node.js projects (npm):

```bash
npx tsc --noEmit 2>&1
npx eslint . 2>&1
npm test 2>&1
npm run build 2>&1
```

### For Python projects:

```bash
mypy . 2>&1
ruff check . 2>&1
pytest 2>&1
```

## Rules

- Show actual command output for each step — never claim success without evidence
- If a step fails, stop and report the error before continuing
- If env vars are needed (e.g., `BETTER_AUTH_SECRET`, `DATABASE_URL`), set them before running
- Don't suppress type errors or lint warnings — surface them all
