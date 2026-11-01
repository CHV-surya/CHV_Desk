import { Request, Response, NextFunction } from 'express';
import * as schedulerService from './scheduler.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export async function getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { startDate, endDate, status, month, year } = req.query;

    const tasks = await schedulerService.listSchedulerTasks({
      startDate: startDate as string,
      endDate: endDate as string,
      status: status as string,
      month: month ? parseInt(month as string, 10) : undefined,
      year: year ? parseInt(year as string, 10) : undefined,
    });

    sendSuccess(res, tasks, 'Scheduler tasks retrieved successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function getTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await schedulerService.getSchedulerTaskById(req.params.id);
    sendSuccess(res, task, 'Scheduler task retrieved successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const currentUserId = req.user!.userId;
    const task = await schedulerService.createSchedulerTask({
      ...req.body,
      createdBy: currentUserId,
    });
    sendSuccess(res, task, 'Scheduler task created successfully', 201);
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await schedulerService.updateSchedulerTask(req.params.id, req.body);
    sendSuccess(res, task, 'Scheduler task updated successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function updateTaskStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.body;
    const task = await schedulerService.updateSchedulerTaskStatus(req.params.id, status);
    sendSuccess(res, task, `Task marked as ${status}`);
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await schedulerService.deleteSchedulerTask(req.params.id);
    sendSuccess(res, result, 'Scheduler task deleted successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}
