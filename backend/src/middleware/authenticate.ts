import { Request, Response, NextFunction } from 'express';
import { verifyToken, AUTH_COOKIE_NAME, JwtPayload } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { isActive: boolean; fullName: string };
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token = req.cookies?.[AUTH_COOKIE_NAME];

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    if (!token) {
      sendError(res, 'Authentication required. Please log in.', 401);
      return;
    }

    let decoded: JwtPayload;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      sendError(res, 'Invalid or expired session. Please log in again.', 401);
      return;
    }

    // Verify user exists and is active in database
    const [userRecord] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!userRecord) {
      sendError(res, 'User account no longer exists.', 401);
      return;
    }

    if (!userRecord.isActive) {
      sendError(res, 'Your account has been deactivated. Contact an administrator.', 403);
      return;
    }

    req.user = {
      userId: userRecord.id,
      username: userRecord.username,
      role: userRecord.role,
      fullName: userRecord.fullName,
      isActive: userRecord.isActive,
    };

    next();
  } catch (error) {
    sendError(res, 'Authentication failed.', 500);
  }
}

