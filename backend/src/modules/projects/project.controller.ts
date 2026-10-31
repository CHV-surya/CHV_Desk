import { Request, Response, NextFunction } from 'express';
import * as projectService from './project.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export async function getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { departmentId, search, page, limit } = req.query;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const projects = await projectService.listProjects({
      departmentId: departmentId as string,
      search: search as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 100,
      userId,
      isAdmin,
    });

    sendSuccess(res, projects, 'Projects retrieved successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function getProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';
    const project = await projectService.getProjectById(req.params.id, userId, isAdmin);
    sendSuccess(res, project, 'Project details retrieved');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, departmentId, description } = req.body;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const project = await projectService.createProject({
      name,
      departmentId,
      description,
      userId,
      isAdmin,
    });

    sendSuccess(res, project, 'Project created successfully', 201);
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const project = await projectService.updateProject(
      req.params.id,
      req.body,
      userId,
      isAdmin
    );

    sendSuccess(res, project, 'Project updated successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const isAdmin = req.user!.role === 'admin';
    const result = await projectService.deleteProject(req.params.id, isAdmin);
    sendSuccess(res, result, result.message);
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

