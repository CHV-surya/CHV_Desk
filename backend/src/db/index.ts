import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';
import { env } from '../config/env.js';

if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

export const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql, { schema });

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT 1 as connected`;
    return result.length > 0 && result[0].connected === 1;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

