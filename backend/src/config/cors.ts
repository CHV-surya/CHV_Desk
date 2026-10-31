import { CorsOptions } from 'cors';
import { env } from './env.js';

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl or same-origin)
    if (!origin) return callback(null, true);
    
    // In development, allow localhost variations
    if (!env.isProduction) {
      if (
        origin === env.CLIENT_URL ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }
    }
    
    if (origin === env.CLIENT_URL) {
      return callback(null, true);
    }

    // Support Vercel Preview & Production Deployments
    if (
      (process.env.VERCEL || process.env.NODE_ENV === 'production') &&
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }

    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
};

