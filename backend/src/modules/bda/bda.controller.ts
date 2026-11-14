import { Request, Response, NextFunction } from 'express';
import * as bdaService from './bda.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * GET /api/bda/summary
 */
export async function getSummary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const summary = await bdaService.getBdaSummary(userId, userRole);
    sendSuccess(res, summary, 'BDA summary statistics retrieved');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

/**
 * GET /api/bda/projects/search
 */
export async function searchProjects(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = req.query.query as string | undefined;
    const projects = await bdaService.searchProjects(query);
    sendSuccess(res, projects, 'Projects retrieved');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

/**
 * GET /api/bda/customers
 */
export async function listCustomers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const result = await bdaService.listCustomers(userId, userRole, {
      search: req.query.search as string,
      status: req.query.status as string,
      projectId: req.query.projectId as string,
      departmentId: req.query.departmentId as string,
      leadSource: req.query.leadSource as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    });

    sendSuccess(res, result, 'Customer directory retrieved');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

/**
 * GET /api/bda/customers/:customerId
 */
export async function getCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { customerId } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const customer = await bdaService.getCustomerById(customerId, userId, userRole);
    sendSuccess(res, customer, 'Customer record retrieved');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

/**
 * POST /api/bda/customers
 */
export async function createCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const customer = await bdaService.createCustomer(req.body, userId, userRole);
    sendSuccess(res, customer, 'Customer record created successfully', 201);
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

/**
 * PATCH /api/bda/customers/:customerId
 */
export async function updateCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { customerId } = req.params;
    const user = { id: req.user!.userId, role: req.user!.role };

    const updated = await bdaService.updateCustomer(customerId, req.body, user);
    sendSuccess(res, updated, 'Customer record updated successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

/**
 * DELETE /api/bda/customers/:customerId
 */
export async function deleteCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { customerId } = req.params;
    const user = { id: req.user!.userId, role: req.user!.role };

    const result = await bdaService.deleteCustomer(customerId, user);
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
 * GET or POST /api/bda/export
 */
export async function exportCustomers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const customerIds = (req.body?.customerIds as string[]) || undefined;
    const filterParams = {
      search: (req.query.search || req.body?.search) as string,
      status: (req.query.status || req.body?.status) as string,
      projectId: (req.query.projectId || req.body?.projectId) as string,
      leadSource: (req.query.leadSource || req.body?.leadSource) as string,
      startDate: (req.query.startDate || req.body?.startDate) as string,
      endDate: (req.query.endDate || req.body?.endDate) as string,
    };

    const workbook = await bdaService.generateCustomersExcel(userId, userRole, {
      customerIds,
      filterParams: customerIds && customerIds.length > 0 ? undefined : filterParams,
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `BDA_Customer_Directory_${dateStr}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.byteLength);
    res.setHeader('Cache-Control', 'no-store');

    res.send(Buffer.from(buffer));
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}

/**
 * POST /api/bda/import
 */
export async function importCustomers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = { id: req.user!.userId, role: req.user!.role };
    const { fileBase64 } = req.body;

    if (!fileBase64 || typeof fileBase64 !== 'string') {
      sendError(res, 'Missing or invalid file content. Please upload a valid Excel file.', 400);
      return;
    }

    const cleanBase64 = fileBase64.replace(/^data:.*?;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const summary = await bdaService.importCustomersExcel(buffer, user);
    sendSuccess(res, summary, 'Excel data processed and synchronized successfully');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
}
