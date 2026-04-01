import postgres from 'postgres'
import 'dotenv/config'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const sql = postgres(databaseUrl)

async function migrate() {
  console.log('Adding deadline column to jobs table...')
  try {
    await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;`
    console.log('Successfully added deadline column.')
  } catch (err) {
    console.error('Migration failed:', err)
  } finally {
    await sql.end()
  }
}

migrate()
