import postgres from 'postgres';
import 'dotenv/config';

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'jobs'
    `;
    console.log('--- JOBS COLUMNS ---');
    columns.forEach(c => console.log(`${c.column_name}: ${c.data_type}`));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

run();
