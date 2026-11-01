import { Router } from 'express';
import { z } from 'zod';
import * as controller from './project.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin } from '../../middleware/authorize.js';
import { validateBody } from '../../middleware/validate.js';

const router = Router();

router.use(authenticate);

const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name is required'),
  departmentId: z.string().uuid('Valid department ID is required'),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
});

const setAssignmentsSchema = z.object({
  userIds: z.array(z.string().uuid()),
});

router.get('/', controller.getProjects);
router.get('/:id', controller.getProject);
router.post('/', validateBody(createProjectSchema), controller.createProject);
router.patch('/:id', validateBody(updateProjectSchema), controller.updateProject);
router.delete('/:id', requireAdmin, controller.deleteProject);

// Project assignments management
router.get('/:id/assignable-employees', controller.getAssignableEmployees);
router.get('/:id/assignments', controller.getProjectAssignments);
router.put('/:id/assignments', validateBody(setAssignmentsSchema), controller.setProjectAssignments);

export default router;

