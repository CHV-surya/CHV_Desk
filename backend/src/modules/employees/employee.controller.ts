import { Request, Response, NextFunction } from 'express';
import * as employeeService from './employee.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export async function getEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search, departmentId, status, page, limit } = req.query;
    const employees = await employeeService.listEmployees({
      search: search as string,
      departmentId: departmentId as string,
      status: status as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 50,
    });
    sendSuccess(res, employees, 'Employees retrieved successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function getEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    sendSuccess(res, employee, 'Employee details retrieved');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function createEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employee = await employeeService.createEmployee(req.body);
    sendSuccess(res, employee, 'Employee created successfully', 201);
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function updateEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employee = await employeeService.updateEmployee(req.params.id, req.body);
    sendSuccess(res, employee, 'Employee updated successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function updateEmployeeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { isActive } = req.body;
    const employee = await employeeService.setEmployeeStatus(req.params.id, Boolean(isActive));
    sendSuccess(res, employee, `Employee account ${isActive ? 'activated' : 'deactivated'}`);
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { password } = req.body;
    const result = await employeeService.resetEmployeePassword(req.params.id, password);
    sendSuccess(res, result, 'Employee password reset successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function deleteEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await employeeService.deleteEmployee(req.params.id);
    sendSuccess(res, result, result.message);
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

