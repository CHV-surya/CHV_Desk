import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { env } from '../config/env.js';

export const AUTH_COOKIE_NAME = 'worktrack_token';

export interface JwtPayload {
  userId: string;
  username: string;
  role: 'admin' | 'employee';
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function setAuthCookie(res: Response, token: string): void {
  const sameSite = env.COOKIE_SAME_SITE || 'lax';
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProduction || sameSite === 'none',
    sameSite: sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

export function clearAuthCookie(res: Response): void {
  const sameSite = env.COOKIE_SAME_SITE || 'lax';
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.isProduction || sameSite === 'none',
    sameSite: sameSite,
    path: '/',
  });
}

