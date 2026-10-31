import { db } from '../../db/index.js';
import { dailyActivities } from '../../db/schema.js';
import { sql, lt } from 'drizzle-orm';

/**
 * Calculates retention cutoffs and performs monthly purge of daily activities.
 *
 * Retention Rule:
 * When a new month begins, retain the previous month's final 7 days (e.g. Oct 25-31).
 * Delete activity records older than that cutoff.
 * Projects and Employees are permanent and NEVER touched.
 */
export async function runRetentionCleanup(dryRun: boolean = false) {
  // Use Asia/Kolkata timezone
  const now = new Date();
  const kolkataDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
  const [currentYear, currentMonth] = kolkataDateStr.split('-').map(Number);

  // Previous month calculation
  let prevYear = currentYear;
  let prevMonth = currentMonth - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }

  // Days in previous month
  const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
  // Cutoff date is 7 days before end of previous month
  const cutoffDay = Math.max(1, daysInPrevMonth - 6);
  const cutoffDateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(cutoffDay).padStart(2, '0')}`;

  // Count records that would be deleted (work_date < cutoffDateStr)
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(dailyActivities)
    .where(lt(dailyActivities.workDate, cutoffDateStr));

  const eligibleCount = Number(countResult?.count || 0);

  if (dryRun) {
    return {
      dryRun: true,
      currentDate: kolkataDateStr,
      cutoffDate: cutoffDateStr,
      recordsEligibleForDeletion: eligibleCount,
      retainedPeriod: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(cutoffDay).padStart(2, '0')} to present`,
    };
  }

  // Perform safe deletion
  if (eligibleCount > 0) {
    await db
      .delete(dailyActivities)
      .where(lt(dailyActivities.workDate, cutoffDateStr));
  }

  return {
    success: true,
    dryRun: false,
    currentDate: kolkataDateStr,
    cutoffDate: cutoffDateStr,
    recordsDeleted: eligibleCount,
    retainedPeriod: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(cutoffDay).padStart(2, '0')} to present`,
    message: `Retention policy applied. ${eligibleCount} historical activity record(s) older than ${cutoffDateStr} purged. Projects and employees remain permanent.`,
  };
}

export async function getRetentionStatus() {
  const now = new Date();
  const kolkataDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const [currentYear, currentMonth] = kolkataDateStr.split('-').map(Number);

  let prevYear = currentYear;
  let prevMonth = currentMonth - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }

  const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
  const cutoffDay = Math.max(1, daysInPrevMonth - 6);
  const cutoffDateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(cutoffDay).padStart(2, '0')}`;

  const [totalCountRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(dailyActivities);

  const [eligibleCountRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(dailyActivities)
    .where(lt(dailyActivities.workDate, cutoffDateStr));

  return {
    businessTimezone: 'Asia/Kolkata',
    currentDate: kolkataDateStr,
    retentionCutoffDate: cutoffDateStr,
    totalActivityRecords: Number(totalCountRow?.count || 0),
    eligibleForCleanup: Number(eligibleCountRow?.count || 0),
    policy: "At month start, retains previous month's final 7 days and purges older activity logs. Projects and users are permanent.",
  };
}

