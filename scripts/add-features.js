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

async function add() {
  const env = loadEnv()
  const pool = new Pool({ connectionString: env.DATABASE_URL })

  try {
    // Add recurring fields to expense
    await pool.query('ALTER TABLE expense ADD COLUMN IF NOT EXISTS "isRecurring" boolean DEFAULT false')
    await pool.query('ALTER TABLE expense ADD COLUMN IF NOT EXISTS "recurringFrequency" text')
    await pool.query('ALTER TABLE expense ADD COLUMN IF NOT EXISTS "recurringEndDate" date')
    console.log('Added recurring fields to expense')

    // Add recurring fields to income
    await pool.query('ALTER TABLE income ADD COLUMN IF NOT EXISTS "isRecurring" boolean DEFAULT false')
    await pool.query('ALTER TABLE income ADD COLUMN IF NOT EXISTS "recurringFrequency" text')
    await pool.query('ALTER TABLE income ADD COLUMN IF NOT EXISTS "recurringEndDate" date')
    console.log('Added recurring fields to income')

    // Create goal table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS goal (
        id text PRIMARY KEY,
        "userId" text NOT NULL,
        name text NOT NULL,
        "targetAmount" numeric NOT NULL,
        "currentAmount" numeric DEFAULT '0',
        deadline date,
        category text,
        "createdAt" timestamp NOT NULL DEFAULT NOW(),
        "updatedAt" timestamp NOT NULL DEFAULT NOW()
      )
    `)
    console.log('Created goal table')

    // Verify
    const r = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")
    console.log('Tables:', r.rows.map(x => x.tablename).join(', '))

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await pool.end()
  }
}

add()
