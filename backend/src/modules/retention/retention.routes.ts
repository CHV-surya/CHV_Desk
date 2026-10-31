import { Router, Request, Response, NextFunction } from 'express';
import { runRetentionCleanup, getRetentionStatus } from './retention.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin } from '../../middleware/authorize.js';
import { sendSuccess, sendError } from '../../utils/response.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await getRetentionStatus();
    sendSuccess(res, status, 'Retention policy status retrieved');
  } catch (error) {
    next(error);
  }
});

router.post('/run', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dryRun = Boolean(req.body?.dryRun);
    const result = await runRetentionCleanup(dryRun);
    sendSuccess(res, result, result.message || 'Retention check completed');
  } catch (error: any) {
    if (error.status) {
      sendError(res, error.message, error.status);
    } else {
      next(error);
    }
  }
});

export default router;

