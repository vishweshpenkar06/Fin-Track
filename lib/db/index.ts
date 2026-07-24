import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    'DATABASE_URL environment variable is missing. ' +
    'Set it in .env.local or your deployment environment.'
  )
}

// Create pool with serverless-optimized settings
export const pool = new Pool({
  connectionString,
  // Optimize for serverless: reuse connections, shorter idle timeout
  max: 1, // Minimal connections in serverless
  idleTimeoutMillis: 30000,
})

export const db = drizzle(pool, { schema })
