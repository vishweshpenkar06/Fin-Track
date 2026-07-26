// Recreate ALL auth tables with correct Better Auth schema
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const env = {}
  content.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=')
    if (key && rest.length) env[key.trim()] = rest.join('=').trim()
  })
  return env
}

async function fix() {
  const env = loadEnv()
  const pool = new Pool({ connectionString: env.DATABASE_URL })

  try {
    // Drop all auth tables (they'll be recreated)
    console.log('Dropping auth tables...')
    await pool.query('DROP TABLE IF EXISTS public.account CASCADE')
    await pool.query('DROP TABLE IF EXISTS public.session CASCADE')
    await pool.query('DROP TABLE IF EXISTS public.verification CASCADE')
    // Don't drop user - it has data
    // await pool.query('DROP TABLE IF EXISTS public."user" CASCADE')

    // Recreate user table with all columns
    console.log('Recreating user table...')
    // First, back up existing users
    const users = await pool.query('SELECT * FROM public."user"')
    console.log(`Backed up ${users.rows.length} users`)

    await pool.query('DROP TABLE IF EXISTS public."user" CASCADE')

    await pool.query(`
      CREATE TABLE public."user" (
        id text PRIMARY KEY,
        name text,
        email text NOT NULL UNIQUE,
        "emailVerified" boolean NOT NULL DEFAULT false,
        image text,
        currency text DEFAULT 'USD',
        "notificationPreferences" jsonb DEFAULT '{"budgetAlerts":true,"weeklySummary":true,"aiInsights":false}'::jsonb,
        "createdAt" timestamp NOT NULL DEFAULT NOW(),
        "updatedAt" timestamp NOT NULL DEFAULT NOW()
      )
    `)

    // Restore users
    for (const u of users.rows) {
      await pool.query(`
        INSERT INTO public."user" (id, name, email, "emailVerified", image, currency, "notificationPreferences", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [u.id, u.name, u.email, u.emailVerified, u.image, u.currency || 'USD', u.notificationPreferences || '{"budgetAlerts":true,"weeklySummary":true,"aiInsights":false}', u.createdAt, u.updatedAt])
    }
    console.log('Restored users.')

    // Create session table
    console.log('Creating session table...')
    await pool.query(`
      CREATE TABLE public.session (
        id text PRIMARY KEY,
        token text NOT NULL UNIQUE,
        "userId" text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
        expiresAt timestamp NOT NULL,
        "ipAddress" text,
        "userAgent" text,
        "createdAt" timestamp NOT NULL DEFAULT NOW(),
        "updatedAt" timestamp NOT NULL DEFAULT NOW()
      )
    `)

    // Create account table
    console.log('Creating account table...')
    await pool.query(`
      CREATE TABLE public.account (
        id text PRIMARY KEY,
        "accountId" text NOT NULL,
        "providerId" text NOT NULL,
        "userId" text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
        "accessToken" text,
        "refreshToken" text,
        "idToken" text,
        "accessTokenExpiresAt" timestamp,
        "refreshTokenExpiresAt" timestamp,
        "scope" text,
        "password" text,
        "createdAt" timestamp NOT NULL DEFAULT NOW(),
        "updatedAt" timestamp NOT NULL DEFAULT NOW()
      )
    `)

    // Create verification table
    console.log('Creating verification table...')
    await pool.query(`
      CREATE TABLE public.verification (
        id text PRIMARY KEY,
        identifier text NOT NULL,
        value text NOT NULL,
        "expiresAt" timestamp NOT NULL,
        "createdAt" timestamp DEFAULT NOW(),
        "updatedAt" timestamp DEFAULT NOW()
      )
    `)

    // Verify all tables
    console.log('\n=== Verification ===')
    const tables = await pool.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      ORDER BY tablename
    `)
    console.log('Tables:', tables.rows.map(r => r.tablename).join(', '))

    // Verify account columns
    const accountCols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'account' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    console.log('account columns:', accountCols.rows.map(r => r.column_name).join(', '))

    // Test query
    await pool.query('SELECT "accountId" FROM public.account LIMIT 0')
    console.log('SELECT "accountId": OK')

    console.log('\nDone! Restart dev server and try Google sign-in.')

  } catch (err) {
    console.error('Error:', err.message)
    console.error(err.stack)
  } finally {
    await pool.end()
  }
}

fix()
