import { Router } from 'express';
import { z } from 'zod';
import * as controller from './employee.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin } from '../../middleware/authorize.js';
import { validateBody } from '../../middleware/validate.js';

const router = Router();

// All employee management routes require Admin privileges
router.use(authenticate, requireAdmin);

const createEmployeeSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z.string().min(4, 'Password must be at least 4 characters').optional(),
  role: z.enum(['admin', 'employee']).optional(),
  assignedDepartments: z.array(z.string()).min(1, 'Employee must belong to at least one department'),
});

const updateEmployeeSchema = z.object({
  fullName: z.string().min(2).optional(),
  username: z.string().min(3).optional(),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(4).optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).optional(),
  assignedDepartments: z.array(z.string()).min(1).optional(),
});

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

router.get('/', controller.getEmployees);
router.get('/:id', controller.getEmployee);
router.post('/', validateBody(createEmployeeSchema), controller.createEmployee);
router.patch('/:id', validateBody(updateEmployeeSchema), controller.updateEmployee);
router.patch('/:id/status', validateBody(updateStatusSchema), controller.updateEmployeeStatus);
router.post('/:id/reset-password', controller.resetPassword);
router.delete('/:id', controller.deleteEmployee);

export default router;

