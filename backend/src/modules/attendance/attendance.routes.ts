import { Router } from 'express';
import * as controller from './attendance.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/today', controller.getTodayAttendance);
router.get('/summary', controller.getSummary);

export default router;

