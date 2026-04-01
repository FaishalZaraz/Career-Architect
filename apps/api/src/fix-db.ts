import postgres from 'postgres';
import 'dotenv/config';

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('--- Fixing Jobs Table ---');
    
    // Add work_arrangement column
    console.log('Adding work_arrangement...');
    await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS work_arrangement text DEFAULT 'Remote'`;
    
    // Add team column
    console.log('Adding team...');
    await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS team text DEFAULT 'Engineering'`;

    console.log('--- Successfully Updated Jobs Table ---');

  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await sql.end();
  }
}

run();
