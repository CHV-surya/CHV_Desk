import { Router } from 'express';
import { z } from 'zod';
import * as controller from './activity.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateBody } from '../../middleware/validate.js';

const router = Router();

router.use(authenticate);

const joinSchema = z.object({
  departmentId: z.string().uuid('Valid department ID is required'),
});

const endSchema = z.object({
  departmentId: z.string().uuid().optional(),
});

const notesSchema = z.object({
  notes: z.string(),
});

const saveTodayNotesSchema = z.object({
  departmentId: z.string().uuid('Valid department ID is required'),
  notes: z.string(),
});

router.get('/', controller.getActivities);
router.get('/today', controller.getTodayActivity);
router.get('/my-records', controller.getMyRecords);
router.post('/join', validateBody(joinSchema), controller.join);
router.post('/end', validateBody(endSchema), controller.end);
router.post('/save-notes', validateBody(saveTodayNotesSchema), controller.saveTodayNotes);
router.patch('/:id/notes', validateBody(notesSchema), controller.updateNotes);

export default router;

