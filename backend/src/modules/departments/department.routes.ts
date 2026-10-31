import { Router } from 'express';
import { z } from 'zod';
import * as controller from './department.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin } from '../../middleware/authorize.js';
import { validateBody } from '../../middleware/validate.js';

const router = Router();

// Everyone authenticated can list and get department details (filtered by access in service)
router.use(authenticate);

const createDeptSchema = z.object({
  name: z.string().min(2, 'Department name is required'),
  description: z.string().optional(),
  slug: z.string().optional(),
  color: z.string().optional(),
});

const updateDeptSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  slug: z.string().optional(),
  color: z.string().optional(),
});

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

router.get('/', controller.getDepartments);
router.get('/:id', controller.getDepartment);

// Admin-only management endpoints
router.post('/', requireAdmin, validateBody(createDeptSchema), controller.createDepartment);
router.patch('/:id', requireAdmin, validateBody(updateDeptSchema), controller.updateDepartment);
router.patch('/:id/status', requireAdmin, validateBody(updateStatusSchema), controller.updateDepartmentStatus);
router.delete('/:id', requireAdmin, controller.deleteDepartment);

export default router;

