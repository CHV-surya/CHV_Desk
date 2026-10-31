import { Response } from 'express';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Operation completed successfully',
  statusCode: number = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(
  res: Response,
  message: string = 'Something went wrong',
  statusCode: number = 500,
  errors: any[] = []
): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

