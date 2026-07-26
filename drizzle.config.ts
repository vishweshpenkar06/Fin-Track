import { defineConfig } from 'drizzle-kit'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Read .env.local manually
function loadEnv(): Record<string, string> {
  try {
    const content = readFileSync(resolve(__dirname, '.env.local'), 'utf-8')
    const env: Record<string, string> = {}
    content.split('\n').forEach(line => {
      const [key, ...rest] = line.split('=')
      if (key && rest.length) env[key.trim()] = rest.join('=').trim()
    })
    return env
  } catch {
    return {}
  }
}

const env = loadEnv()

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL || process.env.DATABASE_URL!,
  },
})
