import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DIRECT_URL or DATABASE_URL is not set.');
  process.exit(1);
}

async function runMigrations() {
  console.log('⏳ Running Drizzle migrations on Neon PostgreSQL...');
  try {
    const sql = neon(dbUrl!);
    const db = drizzle(sql);
    const migrationsFolder = path.resolve(__dirname, '../../drizzle');
    
    await migrate(db, { migrationsFolder });
    console.log('✅ Migrations applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
