import { Request, Response, NextFunction } from 'express';
import * as attendanceService from './attendance.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export async function getTodayAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { departmentId, status, search } = req.query;
    const currentUserId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const records = await attendanceService.getTodayAttendance(
      {
        departmentId: departmentId as string,
        status: status as string,
        search: search as string,
      },
      currentUserId,
      isAdmin
    );

    sendSuccess(res, records, "Today's attendance roster retrieved");
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const summary = await attendanceService.getAttendanceSummary();
    sendSuccess(res, summary, 'Attendance summary metrics retrieved');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

