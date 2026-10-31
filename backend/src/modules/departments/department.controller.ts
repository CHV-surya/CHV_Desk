import { Request, Response, NextFunction } from 'express';
import * as deptService from './department.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export async function getDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const isAdmin = req.user?.role === 'admin';
    const userId = req.user?.userId;
    const depts = await deptService.listDepartments(userId, isAdmin);
    sendSuccess(res, depts, 'Departments retrieved successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function getDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dept = await deptService.getDepartmentById(req.params.id);
    sendSuccess(res, dept, 'Department details retrieved');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dept = await deptService.createDepartment(req.body);
    sendSuccess(res, dept, 'Department created successfully', 201);
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function updateDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dept = await deptService.updateDepartment(req.params.id, req.body);
    sendSuccess(res, dept, 'Department updated successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function updateDepartmentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { isActive } = req.body;
    const dept = await deptService.setDepartmentStatus(req.params.id, Boolean(isActive));
    sendSuccess(res, dept, `Department ${isActive ? 'activated' : 'deactivated'}`);
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function deleteDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await deptService.deleteDepartment(req.params.id);
    sendSuccess(res, result, result.message);
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

