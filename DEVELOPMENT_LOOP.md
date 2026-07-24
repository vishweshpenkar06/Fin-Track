# DEVELOPMENT_LOOP.md — FinTrack Continuous Improvement System

> Companion to `AGENTS.md`. `AGENTS.md` governs *how you write code* (lazy, minimal, root-cause). This file governs *the cycle you run* to keep improving the product safely, indefinitely. Any agent working on this repo should read both before starting.

---

## 0. What "100x better" actually means here

"100x" as a vibe is meaningless and produces AI slop — this document rejects that framing in favor of measurable targets. Starting baseline (verified from the actual repo, not assumed):

| Dimension | Current baseline | Target |
|---|---|---|
| Test count | 80 unit tests, 3 E2E, 0% coverage measurement | Coverage tracked and reported per PR; every new server action ships with tests in the same commit |
| CI honesty | Job named "Lint, Type Check, Test, and Build" but doesn't run lint | CI job names match exactly what they run — no more, no less |
| Known bugs | 0 open (last audit: 31 fixes across 7 batches, all verified) | Stays at 0 — new features can't ship with a known regression |
| Accessibility | 48+ issues fixed in a past pass | Automated a11y check (axe-core) in CI so this can't silently regress again |
| Dependabot PRs | 9 open, unreviewed | Triaged weekly, not left to accumulate |
| Feature completeness | Currency, notifications, profile save, data export all fixed from no-ops to real | No feature ships in a "looks done but isn't" state — this is the #1 failure mode to prevent going forward |
| Performance | N+1 fixed, indexes added, dashboard scoped to current month | Real Lighthouse/Web Vitals numbers tracked, not assumed |

"100x better" = **the gap between what the UI implies and what the code actually does shrinks to zero, continuously, while genuinely new customer-facing value gets added on top.** Not more code. Not more features for their own sake. A customer should never be able to click something and have it silently do nothing — that single failure mode has already happened multiple times in this project's history and is the highest-priority thing this loop exists to prevent from recurring.

---

## 1. Idea Generation & Scoping

New feature/improvement ideas are evaluated against this filter before any code is written — this directly extends the `AGENTS.md` YAGNI ladder:

1. **Does a real user need this, or does it just sound impressive?** ("AI insights dashboard v2" sounds impressive; "the delete button actually deletes the row" is what a real user needs.)
2. **Does it already exist?** Check `app/actions/`, `lib/`, and `docs/adr/` before proposing anything — this repo has already made deliberate choices (rule-based insights, no separate categories table, no FK constraints) that shouldn't be silently reversed.
3. **Can it be validated cheaply before building?** Prefer a fake-door test (a button that logs interest before the feature is built) over building something nobody asked for.
4. **What's the smallest version that delivers the value?** Per `AGENTS.md`: shortest working diff wins, but only once the problem is understood.

Sources of ideas, in priority order:
- **Bug/gap audits** (see Section 2) — fixing what's broken beats adding what's new, always, until the known-bug count is zero.
- **Dependabot PRs** — security/dependency updates are not optional busywork; triage weekly.
- **Direct user feedback** (once there are real users) — highest-signal source, always beats internal speculation.
- **Agent-proposed improvements** — allowed, but must be logged as a *proposal* first (see Section 3, Step 1) not silently implemented, especially for anything adding a dependency, a table, or an external API.

---

## 2. Development Phase

Every change, whether bug fix or new feature, follows the `AGENTS.md` ladder and this sequence:

1. Read the actual code path end to end before touching anything — trace it, don't assume it.
2. Check `docs/adr/` for any relevant prior decision.
3. Make the smallest correct change. No speculative abstractions, no new dependencies unless nothing installed already solves it.
4. If the change touches a shared helper (e.g. `lib/auth-utils.ts`, `lib/date-utils.ts`), fix the root cause there once — don't patch each call site.
5. Any intentional shortcut gets a `ponytail:` comment naming the ceiling and the upgrade path, per existing repo convention.
6. Non-trivial logic ships with exactly one runnable check in the same commit — this loop treats "code without a test" as **unfinished**, not "done, tests later."

---

## 3. Automated Self-Check — The Actual Loop

This is the part that runs every single time, for every change, autonomous or human-driven.

### Step 1 — Pre-flight (before writing code)
- State the issue/feature in one sentence and which files it touches.
- If it's a new dependency, new table, or new external API: log it as a proposal in `IMPROVEMENT_LOG.md` and wait for explicit approval rather than implementing it directly.

### Step 2 — Implement
Per Section 2 above.

### Step 3 — Automated Gate (must ALL pass before anything is considered "done")
```bash
pnpm lint          # must be added to CI — see gap found in Section 6
pnpm type-check
pnpm test --run
pnpm build
```
Plus, for anything touching a user-facing flow:
```bash
pnpm test:e2e      # run locally against a sandbox DB; see Section 4
```

**Pass/fail definition — no ambiguity allowed:**
- PASS = all four/five commands exit 0, with real pasted output as proof.
- FAIL = anything non-zero, OR a previously-passing test now fails (regression), OR a check was weakened/disabled to force a pass (this is an automatic FAIL regardless of exit code — this exact failure mode has happened before in this project and must never happen silently again).

### Step 4 — Regression-specific checks (beyond the standard suite)
- **No-op check**: for any UI element that saves/updates/deletes something, confirm by reloading the page or re-querying the DB that the change actually persisted — not just that the success toast appeared. (This is exactly the class of bug found in the last audit: profile save, notifications, currency, data export were all UI-complete but functionally no-ops.)
- **A11y check**: run axe-core (or equivalent) against any new/changed page. This wasn't automated last time — 48 issues were found in one manual pass, which means it can silently regress again without automation.
- **Auth boundary check**: any new protected route must redirect when logged out; any new server action must call `getUserId()` and be tested against a request with no session.

### Step 5 — Log
Append to `IMPROVEMENT_LOG.md`:
```markdown
## [date] — [one-line summary]
Status: SHIPPED | REVERTED | PROPOSED (awaiting approval)
Files: [list]
Gate results: lint=✅ type-check=✅ test=✅ build=✅ e2e=✅/skipped
No-op check: [what was verified end-to-end]
```

### Step 6 — Commit
One logical change per commit, per existing repo convention (see `git log` — this project already does this well: "fixing bugs", "performance and code quality fixes", etc. as separate commits). Never bundle an unrelated refactor into a bug-fix commit.

---

## 4. Staging / Pre-Production

- Every change lands on a feature branch first, never directly on `main` (branch protection should be turned on — GitHub already flagged this on the repo and it's still unaddressed).
- CI (`.github/workflows/ci.yml`) runs the full gate from Section 3, Step 3 automatically on every PR.
- **Gap found in current CI**: the job is named "Lint, Type Check, Test, and Build" but never actually runs `pnpm lint` — only type-check, test, and build. Fix: add a `pnpm lint` step to `ci.yml` so the job name matches reality, exactly the same class of bug as the earlier fake `lint` script — a name that overpromises what's actually checked.
- E2E tests are currently disabled in CI (`if: false`) because they need `DATABASE_URL`/`BETTER_AUTH_SECRET` secrets. Fix: add these as GitHub Actions secrets pointed at a disposable staging database (same pattern as the isolated sandbox from the earlier long-running-agent setup), then enable the E2E job for real pre-merge validation instead of leaving it permanently off.
- Merge to `main` requires: CI green (with lint actually included) + at least a self-review diff read, even solo — reading your own diff one more time catches things review-fatigue would otherwise let through.

## 5. Production Deployment

- `main` auto-deploys to Vercel (already configured).
- `DATABASE_URL` and `BETTER_AUTH_SECRET` live only in Vercel's environment variables, never committed (already correctly enforced — both throw on missing rather than falling back).
- No manual migration step needed currently (schema auto-creates), but if a real migration tool is introduced later, deploys must run migrations before the new code path that depends on them goes live, not after.
- Post-deploy: one manual smoke test on the live URL (signup → add expense → reload → logout) — this has caught real issues before that a passing build didn't.

## 6. Monitoring & Feedback Loop

- **Error tracking**: not yet added — Sentry (free tier) is the natural next addition, and should be the first "new infra" item this loop proposes, since right now a production error is invisible until a user reports it.
- **Dependabot**: 9 PRs currently open and unreviewed. This loop requires a weekly triage: read the changelog, run the gate from Section 3 against the updated dependency, merge or defer with a reason logged.
- **Usage feedback**: once there are real users, feedback becomes the top-priority input to Section 1's idea list, above internal speculation, always.
- **Loop review**: revisit this document itself periodically — if a category in Section 0's table stops being a real risk, remove it; if a new failure mode is discovered (like the no-op settings bugs were), add a permanent automated check for it here, not just a one-time fix.

---

## How This Actually Runs Day-to-Day

An agent (or you) picks up work by: reading `AGENTS.md` + this file → picking the highest-priority item from Section 0/6 → running the full Section 2–3 cycle → logging it → committing → letting CI (Section 4) confirm on the PR → merging → moving to the next item. No step is skipped because "it probably works" — every claim in this loop is required to be backed by pasted command output, because this project has already caught multiple cases of AI-reported "done" that wasn't, and the entire point of this file is to make that structurally harder to repeat.
