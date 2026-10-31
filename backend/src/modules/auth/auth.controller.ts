import { Request, Response, NextFunction } from 'express';
import { loginUser, getCurrentUserProfile, changeUserPassword } from './auth.service.js';
import { setAuthCookie, clearAuthCookie } from '../../utils/jwt.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password } = req.body;
    const { token, user } = await loginUser(username, password);

    setAuthCookie(res, token);
    sendSuccess(res, { user, token }, 'Logged in successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  clearAuthCookie(res);
  sendSuccess(res, null, 'Logged out successfully');
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }
    const userProfile = await getCurrentUserProfile(req.user.userId);
    sendSuccess(res, userProfile, 'User profile retrieved');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }
    const { currentPassword, newPassword } = req.body;
    await changeUserPassword(req.user.userId, currentPassword, newPassword);
    sendSuccess(res, null, 'Password updated successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

