import { Router } from 'express';
import { z } from 'zod';
import * as controller from './employee.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin, requireManagerOrAdmin } from '../../middleware/authorize.js';
import { validateBody } from '../../middleware/validate.js';

const router = Router();

router.use(authenticate);

const createEmployeeSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z.string().min(4, 'Password must be at least 4 characters').optional(),
  role: z.enum(['admin', 'manager', 'employee']).optional(),
  assignedDepartments: z.array(z.string()).min(1, 'Employee must belong to at least one department'),
});

const updateEmployeeSchema = z.object({
  fullName: z.string().min(2).optional(),
  username: z.string().min(3).optional(),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(4).optional().or(z.literal('')),
  role: z.enum(['admin', 'manager', 'employee']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  assignedDepartments: z.array(z.string()).min(1).optional(),
});

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

// Admin and Manager can view employees (scoped in service)
router.get('/', requireManagerOrAdmin, controller.getEmployees);
router.get('/:id', requireManagerOrAdmin, controller.getEmployee);

// Admin-only management endpoints
router.post('/', requireAdmin, validateBody(createEmployeeSchema), controller.createEmployee);
router.patch('/:id', requireAdmin, validateBody(updateEmployeeSchema), controller.updateEmployee);
router.patch('/:id/status', requireAdmin, validateBody(updateStatusSchema), controller.updateEmployeeStatus);
router.post('/:id/reset-password', requireAdmin, controller.resetPassword);
router.delete('/:id', requireAdmin, controller.deleteEmployee);

export default router;

