import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export async function getAdminDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await dashboardService.getAdminDashboardData();
    sendSuccess(res, data, 'Admin dashboard metrics retrieved');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function getEmployeeDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const data = await dashboardService.getEmployeeDashboardData(userId);
    sendSuccess(res, data, 'Employee dashboard metrics retrieved');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

