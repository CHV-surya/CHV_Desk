import type { Request, Response } from 'express';
import { createApp } from '../backend/src/app.js';

// Initialize the Express app once in module scope so it is reused across warm Vercel invocations
const app = createApp();

/**
 * Vercel Serverless Function entry point.
 * Forwards all incoming HTTP requests to the WorkTrack Express application.
 */
export default function handler(req: Request, res: Response) {
  return app(req, res);
}

