import postgres from 'postgres'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL!
if (!connectionString) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const sql = postgres(connectionString)

async function main() {
  try {
    console.log('Adding "source" column to "jobs" table...')
    await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS source text DEFAULT 'Direct'`
    console.log('Successfully added "source" column.')
    process.exit(0)
  } catch (err) {
    console.error('Failed to add column:', err)
    process.exit(1)
  }
}

main()
