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

async function check() {
  const env = loadEnv()
  const pool = new Pool({ connectionString: env.DATABASE_URL })

  try {
    // Check user table structure
    console.log('=== user table ===')
    const userCols = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    userCols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}, nullable: ${r.is_nullable})`))

    // Check session table structure
    console.log('\n=== session table ===')
    const sessionCols = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'session' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    sessionCols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}, nullable: ${r.is_nullable})`))

    // Check if there are any rows in user table
    const userCount = await pool.query('SELECT COUNT(*) FROM public."user"')
    console.log(`\nUser count: ${userCount.rows[0].count}`)

    // List all users
    const users = await pool.query('SELECT id, email, name FROM public."user" LIMIT 5')
    console.log('Users:')
    users.rows.forEach(r => console.log(`  ${r.id} - ${r.email} (${r.name})`))

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await pool.end()
  }
}

check()
