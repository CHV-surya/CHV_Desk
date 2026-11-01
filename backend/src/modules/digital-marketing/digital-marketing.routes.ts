import { Router } from 'express';
import { z } from 'zod';
import * as controller from './digital-marketing.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateBody } from '../../middleware/validate.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation Schemas
const createMonthSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

const updateTargetsSchema = z.object({
  videoTarget: z.number().int().min(0).optional(),
  posterTarget: z.number().int().min(0).optional(),
});

const addEntrySchema = z.object({
  contentType: z.enum(['video', 'poster']),
  contentName: z.string().min(1, 'Content name is required'),
  videoShoot: z.boolean().nullable().optional(),
  editing: z.boolean().nullable().optional(),
  clientConfirmation: z.boolean().nullable().optional(),
  scheduled: z.boolean().nullable().optional(),
  scheduledDate: z.string().nullable().optional(),
  adCampaignReportUrl: z.string().nullable().optional(),
});

const updateEntrySchema = z.object({
  contentName: z.string().min(1).optional(),
  videoShoot: z.boolean().nullable().optional(),
  editing: z.boolean().nullable().optional(),
  clientConfirmation: z.boolean().nullable().optional(),
  scheduled: z.boolean().nullable().optional(),
  scheduledDate: z.string().nullable().optional(),
  adCampaignReportUrl: z.string().nullable().optional(),
});

const updateAssignmentsSchema = z.object({
  userIds: z.array(z.string().uuid('Valid user ID is required')),
});

// Video Editors for assignment
router.get('/video-editors', controller.getVideoEditors);

// Projects
router.get('/projects', controller.getProjects);
router.get('/projects/:projectId/months', controller.getProjectMonths);
router.get('/projects/:projectId/months/:year/:month', controller.getProjectMonth);
router.post(
  '/projects/:projectId/months',
  validateBody(createMonthSchema),
  controller.createProjectMonth
);
router.get('/projects/:projectId/assignments', controller.getProjectAssignments);
router.put(
  '/projects/:projectId/assignments',
  validateBody(updateAssignmentsSchema),
  controller.setProjectAssignments
);

// Monthly Targets & Entries
router.patch(
  '/months/:monthId/targets',
  validateBody(updateTargetsSchema),
  controller.updateMonthTargets
);
router.get('/months/:monthId/entries', controller.getMonthEntries);
router.post(
  '/months/:monthId/entries',
  validateBody(addEntrySchema),
  controller.addEntry
);

// Single Entry Management
router.patch(
  '/entries/:entryId',
  validateBody(updateEntrySchema),
  controller.updateEntry
);
router.delete('/entries/:entryId', controller.deleteEntry);

// Excel Export (Supports both GET and POST)
router.get('/months/:monthId/export', controller.exportMonthlyReport);
router.post('/months/:monthId/export', controller.exportMonthlyReport);

export default router;

