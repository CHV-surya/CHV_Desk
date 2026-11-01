import { Request, Response, NextFunction } from 'express';
import * as dmService from './digital-marketing.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * GET /api/digital-marketing/projects
 */
export async function getProjects(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const projects = await dmService.listDmProjects(userId, isAdmin);
    sendSuccess(res, projects, 'Digital marketing projects retrieved');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

/**
 * GET /api/digital-marketing/projects/:projectId/months
 */
export async function getProjectMonths(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const months = await dmService.listProjectMonths(projectId, userId, isAdmin);
    sendSuccess(res, months, 'Project monthly records retrieved');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

/**
 * GET /api/digital-marketing/projects/:projectId/months/:year/:month
 */
export async function getProjectMonth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId, year, month } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const parsedYear = parseInt(year, 10);
    const parsedMonth = parseInt(month, 10);

    if (isNaN(parsedYear) || isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      sendError(res, 'Valid year and month (1-12) are required', 400);
      return;
    }

    const data = await dmService.getOrCreateProjectMonth(
      projectId,
      parsedYear,
      parsedMonth,
      userId,
      isAdmin
    );

    sendSuccess(res, data, 'Monthly reporting workspace loaded');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

/**
 * POST /api/digital-marketing/projects/:projectId/months
 * Ensure or initialize a month
 */
export async function createProjectMonth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId } = req.params;
    const { year, month } = req.body;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const parsedYear = parseInt(year, 10);
    const parsedMonth = parseInt(month, 10);

    if (isNaN(parsedYear) || isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      sendError(res, 'Valid year and month (1-12) are required', 400);
      return;
    }

    const data = await dmService.getOrCreateProjectMonth(
      projectId,
      parsedYear,
      parsedMonth,
      userId,
      isAdmin
    );

    sendSuccess(res, data, 'Monthly reporting record ready', 201);
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

/**
 * PATCH /api/digital-marketing/months/:monthId/targets
 */
export async function updateMonthTargets(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { monthId } = req.params;
    const { videoTarget, posterTarget } = req.body;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const updated = await dmService.updateMonthlyTargets(
      monthId,
      { videoTarget, posterTarget },
      userId,
      isAdmin
    );

    sendSuccess(res, updated, 'Monthly targets updated successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

/**
 * GET /api/digital-marketing/months/:monthId/entries
 */
export async function getMonthEntries(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { monthId } = req.params;
    const { contentType } = req.query;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const entries = await dmService.getMonthEntries(
      monthId,
      contentType as 'video' | 'poster' | undefined,
      userId,
      isAdmin
    );

    sendSuccess(res, entries, 'Entries retrieved successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

/**
 * POST /api/digital-marketing/months/:monthId/entries
 */
export async function addEntry(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { monthId } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const created = await dmService.addEntry(monthId, req.body, userId, isAdmin);
    sendSuccess(res, created, 'Entry created successfully', 201);
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

/**
 * PATCH /api/digital-marketing/entries/:entryId
 */
export async function updateEntry(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { entryId } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const updated = await dmService.updateEntry(entryId, req.body, userId, isAdmin);
    sendSuccess(res, updated, 'Entry updated successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

/**
 * DELETE /api/digital-marketing/entries/:entryId
 */
export async function deleteEntry(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { entryId } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const result = await dmService.deleteEntry(entryId, userId, isAdmin);
    sendSuccess(res, result, result.message);
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

/**
 * GET or POST /api/digital-marketing/months/:monthId/export
 */
export async function exportMonthlyReport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { monthId } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const { buffer, fileName } = await dmService.exportMonthlyReportToExcel(
      monthId,
      userId,
      isAdmin
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-store');

    res.send(buffer);
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

/**
 * GET /api/digital-marketing/video-editors
 */
export async function getVideoEditors(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const editors = await dmService.listAssignableVideoEditors(userId, isAdmin);
    sendSuccess(res, editors, 'Assignable video editors retrieved');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

/**
 * GET /api/digital-marketing/projects/:projectId/assignments
 */
export async function getProjectAssignments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const assignments = await dmService.getProjectAssignments(
      projectId,
      userId,
      isAdmin
    );
    sendSuccess(res, assignments, 'Project assignments retrieved');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

/**
 * PUT /api/digital-marketing/projects/:projectId/assignments
 */
export async function setProjectAssignments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId } = req.params;
    const { userIds } = req.body;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const updated = await dmService.setProjectAssignments(
      projectId,
      userIds,
      userId,
      isAdmin
    );
    sendSuccess(res, updated, 'Project editor assignments updated successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

