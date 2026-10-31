import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Try default location (current working directory)
dotenv.config();

// 2. Also check backend directory if running from repository root in local dev
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
} catch {
  // Ignored in serverless/bundled runtimes where process.env is injected by platform
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || '',
  DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'worktrack_fallback_secret_for_development_32chars',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  CRON_SECRET: process.env.CRON_SECRET || '',
  COOKIE_SAME_SITE: (process.env.COOKIE_SAME_SITE as 'lax' | 'none' | 'strict') || 'lax',
};

