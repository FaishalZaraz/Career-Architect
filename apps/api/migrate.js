import postgres from 'postgres';
import 'dotenv/config';

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found');
    return;
  }

  const sql = postgres(process.env.DATABASE_URL, {
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connected to Supabase');

    // Add columns if they don't exist
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='title') THEN
          ALTER TABLE "users" ADD COLUMN "title" text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='bio') THEN
          ALTER TABLE "users" ADD COLUMN "bio" text;
        END IF;
        
        -- Also check jobs table for recent additions just in case
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='source') THEN
          ALTER TABLE "jobs" ADD COLUMN "source" text DEFAULT 'Direct';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='interview_type') THEN
          ALTER TABLE "jobs" ADD COLUMN "interview_type" text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='interview_link') THEN
          ALTER TABLE "jobs" ADD COLUMN "interview_link" text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='deadline') THEN
          ALTER TABLE "jobs" ADD COLUMN "deadline" timestamp;
        END IF;
      END $$;
    `;

    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await sql.end();
  }
}

migrate();
