import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// For Vercel serverless, use the pooling URL from Neon
// Neon provides a pooled connection string at: DATABASE_URL + ?sslmode=require
// For local dev, DATABASE_URL works as-is
const connectionString = process.env.DATABASE_URL || ''

// Create pool with serverless-optimized settings
export const pool = new Pool({
  connectionString: connectionString || 'postgresql://localhost/fintrack',
  // Optimize for serverless: reuse connections, shorter idle timeout
  max: 1, // Minimal connections in serverless
  idleTimeoutMillis: 30000,
})

export const db = drizzle(pool, { schema })
