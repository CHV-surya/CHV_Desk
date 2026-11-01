import { Router } from 'express';
import { z } from 'zod';
import * as controller from './scheduler.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin } from '../../middleware/authorize.js';
import { validateBody } from '../../middleware/validate.js';

const router = Router();

// Strictly require authentication and Admin privileges for all scheduler operations
router.use(authenticate);
router.use(requireAdmin);

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(255, 'Title too long'),
  description: z.string().optional().or(z.literal('')),
  startDate: z.string().regex(dateRegex, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(dateRegex, 'End date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(timeRegex, 'Start time must be HH:MM').optional().or(z.literal('')),
  endTime: z.string().regex(timeRegex, 'End time must be HH:MM').optional().or(z.literal('')),
  status: z.enum(['pending', 'completed']).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().or(z.literal('')),
  startDate: z.string().regex(dateRegex).optional(),
  endDate: z.string().regex(dateRegex).optional(),
  startTime: z.string().regex(timeRegex).optional().or(z.literal('')),
  endTime: z.string().regex(timeRegex).optional().or(z.literal('')),
  status: z.enum(['pending', 'completed']).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'completed']),
});

router.get('/tasks', controller.getTasks);
router.get('/tasks/:id', controller.getTask);
router.post('/tasks', validateBody(createTaskSchema), controller.createTask);
router.patch('/tasks/:id', validateBody(updateTaskSchema), controller.updateTask);
router.patch('/tasks/:id/status', validateBody(updateStatusSchema), controller.updateTaskStatus);
router.delete('/tasks/:id', controller.deleteTask);

export default router;
