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
    const r = await pool.query(`
      SELECT schemaname, tablename FROM pg_tables 
      WHERE tablename IN ('user','session','verification','account') 
      ORDER BY schemaname, tablename
    `)
    console.log('Auth tables:')
    r.rows.forEach(x => console.log(`  ${x.schemaname}.${x.tablename}`))

    // Also check which schema Better Auth will use
    const sp = await pool.query('SHOW search_path')
    console.log(`\nsearch_path: ${sp.rows[0].search_path}`)

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await pool.end()
  }
}

check()
