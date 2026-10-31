import { Request, Response, NextFunction } from 'express';
import * as activityService from './activity.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export async function getActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { date, month, departmentId, employeeId, status, search, page, limit } = req.query;
    const currentUserId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const activities = await activityService.listActivities({
      date: date as string,
      month: month as string,
      departmentId: departmentId as string,
      employeeId: employeeId as string,
      status: status as string,
      search: search as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 100,
      currentUserId,
      isAdmin,
    });

    sendSuccess(res, activities, 'Activities retrieved successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function getTodayActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const departmentId = req.query.departmentId as string | undefined;

    const activity = await activityService.getTodayActivityForEmployee(userId, departmentId);
    sendSuccess(res, activity, 'Today activity retrieved');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function join(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { departmentId } = req.body;
    const userId = req.user!.userId;

    const activity = await activityService.joinToday(userId, departmentId);
    sendSuccess(res, activity, 'Clocked in successfully for today!');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function end(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { departmentId } = req.body;
    const userId = req.user!.userId;

    const activity = await activityService.endToday(userId, departmentId);
    sendSuccess(res, activity, 'Session clocked out. Working duration recorded.');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function updateNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { notes } = req.body;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const result = await activityService.updateDailyNotes(req.params.id, notes, userId, isAdmin);
    sendSuccess(res, result, 'Daily notes saved successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function saveTodayNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { departmentId, notes } = req.body;
    const userId = req.user!.userId;

    const result = await activityService.saveNotesForToday(userId, departmentId, notes);
    sendSuccess(res, result, 'Notes saved successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function getMyRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { month } = req.query;

    const records = await activityService.listActivities({
      employeeId: userId,
      currentUserId: userId,
      month: month as string,
      isAdmin: false,
      limit: 100,
    });

    sendSuccess(res, records, 'Historical records retrieved');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

