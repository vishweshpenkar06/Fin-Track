# ADR 003: Neon Serverless Postgres

## Status
✅ Accepted

## Context
FinTrack is deployed to Vercel (serverless). Database choices:
1. Neon (serverless Postgres)
2. PlanetScale (serverless MySQL)
3. AWS Aurora Serverless
4. Supabase (Postgres + extras)

## Decision
Use **Neon PostgreSQL** with Drizzle ORM.

## Rationale

| Factor | Neon | PlanetScale | Aurora | Supabase |
|--------|------|-----------|--------|----------|
| **Serverless** | ✅ | ✅ | ✅ | ✅ |
| **SQL Dialect** | Postgres | MySQL | Postgres | Postgres |
| **Connection Pool** | ✅ pgBouncer | ✅ Built-in | ⚠️ Extra config | ✅ |
| **Free Tier** | Good | Good | Limited | Limited |
| **Regional** | Multiple | Limited | Multiple | Multiple |
| **RLS** | ✅ | ❌ | ✅ | ✅ |

## Trade-offs

**Neon:**
- ✅ Native Postgres—familiar SQL
- ✅ Auto-scaling, instant provisioning
- ✅ Built-in connection pooling (no extra charges)
- ❌ Vendor lock-in (but widely supported)

**Alternatives:**
- PlanetScale: MySQL drift, no RLS
- Aurora: Complex setup for serverless
- Supabase: Overkill for MVP (we don't use RLS/Auth)

## Consequences
- Database URL via Neon integration in Vercel
- Connection pooling handled transparently (pgBouncer)
- Schema migrations: None needed (auto-created on first run)
- Drizzle ORM ensures type safety for all queries
- User-scoped queries in application code (not RLS)
