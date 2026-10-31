import { Router, Request, Response, NextFunction } from 'express';
import { runRetentionCleanup } from '../retention/retention.service.js';
import { env } from '../../config/env.js';
import { sendSuccess, sendError } from '../../utils/response.js';

const router = Router();

/**
 * Protected GET endpoint for Vercel Cron Jobs.
 * 
 * Vercel Cron automatically includes header:
 *   Authorization: Bearer <CRON_SECRET>
 * when CRON_SECRET is configured in Vercel environment variables.
 */
router.get('/retention', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const cronSecretHeader = req.headers['x-cron-secret'];
    const querySecret = (req.query['key'] || req.query['secret']) as string | undefined;

    const expectedSecret = env.CRON_SECRET || process.env.CRON_SECRET;

    // Security Verification: Require valid secret in production
    let isAuthorized = false;
    if (expectedSecret) {
      if (
        authHeader === `Bearer ${expectedSecret}` ||
        cronSecretHeader === expectedSecret ||
        querySecret === expectedSecret
      ) {
        isAuthorized = true;
      }
    } else if (!env.isProduction) {
      // In local development, permit access if no secret is set
      isAuthorized = true;
    }

    if (!isAuthorized) {
      sendError(res, 'Unauthorized: Missing or invalid CRON_SECRET token', 401);
      return;
    }

    // Determine current day in Asia/Kolkata timezone
    const kolkataFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = kolkataFormatter.format(new Date()).split('-');
    const currentYear = Number(parts[0]);
    const currentMonth = Number(parts[1]);
    const currentDay = Number(parts[2]);

    const forceRun = req.query['force'] === 'true';

    // The scheduled job runs at 18:35 UTC on the 28-31 of the month,
    // which corresponds to 00:05 AM IST on the 1st of the next month.
    // If not the 1st of the month and force is not specified, skip execution safely.
    if (currentDay !== 1 && !forceRun) {
      sendSuccess(res, {
        executed: false,
        skipped: true,
        reason: `Current date in Asia/Kolkata is day ${currentDay}. Monthly retention cleanup only executes on day 1 (00:05 IST).`,
        currentDateIST: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`,
        serverTimeUTC: new Date().toISOString(),
      }, 'Retention check completed (skipped: not 1st of month)');
      return;
    }

    // Run the actual idempotent cleanup
    const result = await runRetentionCleanup(false);

    sendSuccess(res, {
      executed: true,
      skipped: false,
      forced: forceRun,
      currentDateIST: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`,
      executedAtUTC: new Date().toISOString(),
      ...result,
    }, result.message || 'Monthly retention cleanup executed successfully');
  } catch (error) {
    next(error);
  }
});

export default router;

