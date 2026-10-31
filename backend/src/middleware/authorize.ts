import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';
import { db } from '../db/index.js';
import { userDepartments } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  if (req.user.role !== 'admin') {
    sendError(res, 'Access denied. Administrator privileges required.', 403);
    return;
  }

  next();
}

export function requireEmployee(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  next();
}

export function requireDepartmentAccess(paramName: string = 'departmentId') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    // Admins have access to all departments
    if (req.user.role === 'admin') {
      return next();
    }

    const deptId = req.params[paramName] || req.body[paramName] || (req.query[paramName] as string);

    if (!deptId) {
      sendError(res, 'Department ID is required', 400);
      return;
    }

    // Check if user is assigned to this department
    const [assignment] = await db
      .select()
      .from(userDepartments)
      .where(
        and(
          eq(userDepartments.userId, req.user.userId),
          eq(userDepartments.departmentId, deptId)
        )
      )
      .limit(1);

    if (!assignment) {
      sendError(res, 'Access denied. You are not assigned to this department.', 403);
      return;
    }

    next();
  };
}

