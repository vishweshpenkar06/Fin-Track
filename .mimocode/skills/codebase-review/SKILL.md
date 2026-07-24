---
name: codebase-review
description: Systematically analyze an entire codebase for bugs, security issues, architecture problems, and best practice violations. Reads every source file, identifies issues, fixes them, and verifies.
---

# Codebase Deep Review

Perform a thorough, systematic review of the entire codebase. This workflow has been validated across 8+ sessions on 6+ projects (fin-track, AppForge, meetingmind, AI Customer Review Analyzer, AI Smart Exam Manager, OmniRegistrarAI).

## Procedure

### Phase 1: Discover structure

1. `glob **/*.{ts,tsx,js,jsx,json,md,py,jsx}` to find all source files
2. `read package.json` (or `requirements.txt` / `pyproject.toml`) to understand the stack
3. `read` the project root directory for top-level files (README, config, etc.)
4. `glob **/*.config.*` and `glob **/tsconfig*.json` for build/lint config

### Phase 2: Read everything

Read every source file. Prioritize in this order:
1. Entry points (`app/page.tsx`, `src/main.*`, `app.py`, `index.*`)
2. Config/schema files (`schema.ts`, `db.ts`, `models.py`, `*.prisma`)
3. Auth and security (`auth.ts`, `middleware.ts`, `auth-context.*`)
4. API routes / server actions (`app/api/**/*.ts`, `app/actions/*.ts`, `routes/*.py`)
5. Business logic / services (`lib/*.ts`, `src/lib/*`, `services/*.py`)
6. UI components (`components/**/*.tsx`, `src/components/*`)
7. Tests (`__tests__/*`, `*.test.*`, `tests/*`)
8. Remaining files

### Phase 3: Analyze and categorize issues

For each file, check for:

**Security:**
- Missing input validation at trust boundaries
- SQL injection / NoSQL injection
- Missing auth checks on protected routes/actions
- Exposed secrets or credentials
- XSS vulnerabilities
- CSRF missing protections

**Correctness:**
- Type errors or unsafe casts
- Missing null/undefined checks
- Race conditions
- Error swallowing (empty catch blocks)
- Silent no-ops (function returns without doing anything)
- Off-by-one errors, timezone bugs

**Architecture:**
- Server/client import mixing (Next.js: files importing `next/headers` or DB being imported in client code)
- Circular dependencies
- Duplicated logic that should be shared
- God modules (files doing too many things)

**Best practices:**
- Missing error handling
- Inconsistent patterns across similar files
- Unused imports/variables
- Missing tests for critical paths

### Phase 4: Fix issues

- Fix one issue at a time
- For each fix, explain what was wrong and why the fix is correct
- Prefer fixing at the source (shared function) over patching individual callers
- After each batch of related fixes, run verification (see Phase 5)

### Phase 5: Verify

Run the project's verification commands in this order:
1. Type check: `pnpm type-check` or `npx tsc --noEmit` (or `mypy` for Python)
2. Lint: `pnpm lint` or `eslint .`
3. Tests: `pnpm test` or `pytest`
4. Build: `pnpm build` (set required env vars first if needed)

If any step fails, fix the error and re-run that step.

### Phase 6: Report

Produce a summary:
- Total files reviewed
- Issues found by category (security / correctness / architecture / best practices)
- Issues fixed vs deferred (with reason)
- Verification results (pass/fail per step)

## Rules

- Never claim something passed without showing the actual command output
- Never silently work around a broken tool (disabling linter, suppressing type errors)
- Keep fixes scoped — don't refactor unrelated code
- Search for existing code/patterns before writing duplicates
- If the project has an AGENTS.md or MEMORY.md, read it first for project-specific constraints
