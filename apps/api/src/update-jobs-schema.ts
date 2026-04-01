import postgres from 'postgres';
import 'dotenv/config';

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('--- Updating Jobs Table Schema ---');
    
    // Add interview_type column
    console.log('Adding interview_type...');
    await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS interview_type text`;
    
    // Add interview_link column
    console.log('Adding interview_link...');
    await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS interview_link text`;

    console.log('--- Successfully Updated Jobs Table Schema ---');

  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await sql.end();
  }
}

run();
