# ADR 001: Better Auth Over NextAuth

## Status
✅ Accepted

## Context
FinTrack needs a session-based authentication system for email/password signup/login. The main candidates were Better Auth and NextAuth.js v5.

## Decision
Use **Better Auth** for session management.

## Rationale

| Factor | Better Auth | NextAuth.js |
|--------|-------------|------------|
| **DB Control** | Direct + explicit | Abstracted |
| **Session Storage** | Any DB schema | Fixed schema |
| **Type Safety** | Type-safe client SDK | Limited |
| **Session Validation** | Simple per-request check | Per-request middleware |
| **Config** | Minimal | Config heavy |
| **Bundle Size** | ~15kb | ~50kb |

## Trade-offs

**Pros:**
- Direct database control—no vendor lock-in
- Sessions table is your own schema
- Type-safe client: `authClient.signIn()` knows your session structure
- Minimal configuration

**Cons:**
- Smaller ecosystem (fewer plugins than NextAuth)
- No built-in OAuth/OIDC (not needed for MVP)
- Manual session management per action

## Consequences
- All server actions manually check `auth.api.getSession()`
- Sessions persisted in `session` table, survives server restarts
- Client-side auth state via `authClient` module
