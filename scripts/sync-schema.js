// Manually sync database schema to match Drizzle schema
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

async function sync() {
  const env = loadEnv()
  const pool = new Pool({ connectionString: env.DATABASE_URL })

  try {
    // 1. Add missing columns to user table
    console.log('Syncing user table...')
    const userCols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'user' AND table_schema = 'public'
    `)
    const userColNames = userCols.rows.map(r => r.column_name)

    if (!userColNames.includes('currency')) {
      await pool.query('ALTER TABLE public."user" ADD COLUMN currency text DEFAULT \'USD\'')
      console.log('  Added currency column')
    }
    if (!userColNames.includes('notificationPreferences')) {
      await pool.query(`ALTER TABLE public."user" ADD COLUMN "notificationPreferences" jsonb DEFAULT '{"budgetAlerts":true,"weeklySummary":true,"aiInsights":false}'::jsonb`)
      console.log('  Added notificationPreferences column')
    }

    // 2. Ensure account table exists with correct schema
    console.log('Checking account table...')
    const accountExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'account'
      )
    `)

    if (!accountExists.rows[0].exists) {
      console.log('  Creating account table...')
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
    } else {
      // Check if accountId column exists
      const accountCols = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'account' AND table_schema = 'public'
      `)
      const accountColNames = accountCols.rows.map(r => r.column_name)
      
      if (!accountColNames.includes('accountId')) {
        await pool.query('ALTER TABLE public.account ADD COLUMN "accountId" text NOT NULL DEFAULT \'\'')
        console.log('  Added accountId column to account')
      }
      if (!accountColNames.includes('providerId')) {
        await pool.query('ALTER TABLE public.account ADD COLUMN "providerId" text NOT NULL DEFAULT \'\'')
        console.log('  Added providerId column to account')
      }
    }

    // 3. Verify all tables match schema
    console.log('\n=== Final Schema Check ===')
    const tables = await pool.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `)
    console.log('Tables:', tables.rows.map(r => r.tablename).join(', '))

    // Check user columns
    const finalUserCols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'user' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    console.log('user columns:', finalUserCols.rows.map(r => r.column_name).join(', '))

    // Check account columns
    const finalAccountCols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'account' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    console.log('account columns:', finalAccountCols.rows.map(r => r.column_name).join(', '))

    console.log('\nDone! Restart dev server and try Google sign-in.')

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await pool.end()
  }
}

sync()
