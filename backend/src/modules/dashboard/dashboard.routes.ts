import { Router } from 'express';
import * as controller from './dashboard.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.get('/admin', requireAdmin, controller.getAdminDashboard);
router.get('/employee', controller.getEmployeeDashboard);

export default router;

