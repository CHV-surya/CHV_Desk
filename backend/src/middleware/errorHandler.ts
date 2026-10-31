import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Unhandled Application Error:', err);

  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  if (env.isProduction) {
    sendError(res, status === 500 ? 'An unexpected internal error occurred' : message, status);
  } else {
    sendError(res, message, status, err.stack ? [err.stack] : []);
  }
}

