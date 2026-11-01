import { db } from '../../db/index.js';
import { schedulerTasks, users } from '../../db/schema.js';
import { eq, and, sql, desc, asc, lte, gte, or } from 'drizzle-orm';
import { getTodayDateString } from '../../utils/date.js';

export interface SchedulerTaskFilter {
  startDate?: string;
  endDate?: string;
  status?: string;
  month?: number; // 1-12
  year?: number; // e.g. 2026
}

export interface TaskClassification {
  isUpcoming: boolean;
  isOngoing: boolean;
  isOverdue: boolean;
  isCompleted: boolean;
  classification: 'upcoming' | 'ongoing' | 'overdue' | 'completed';
}

export function classifyTask(
  startDate: string,
  endDate: string,
  status: string,
  today: string
): TaskClassification {
  const isCompleted = status === 'completed';

  if (isCompleted) {
    return {
      isUpcoming: false,
      isOngoing: false,
      isOverdue: false,
      isCompleted: true,
      classification: 'completed',
    };
  }

  // Pending tasks
  if (endDate < today) {
    return {
      isUpcoming: false,
      isOngoing: false,
      isOverdue: true,
      isCompleted: false,
      classification: 'overdue',
    };
  }

  if (startDate <= today && endDate >= today) {
    return {
      isUpcoming: false,
      isOngoing: true,
      isOverdue: false,
      isCompleted: false,
      classification: 'ongoing',
    };
  }

  return {
    isUpcoming: true,
    isOngoing: false,
    isOverdue: false,
    isCompleted: false,
    classification: 'upcoming',
  };
}

export async function listSchedulerTasks(filter: SchedulerTaskFilter = {}) {
  const today = getTodayDateString();
  const conditions = [];

  if (filter.month && filter.year) {
    const padMonth = String(filter.month).padStart(2, '0');
    // Start of month
    const startOfMonth = `${filter.year}-${padMonth}-01`;
    // End of month
    const lastDay = new Date(filter.year, filter.month, 0).getDate();
    const endOfMonth = `${filter.year}-${padMonth}-${String(lastDay).padStart(2, '0')}`;

    // Overlap condition: task.start_date <= endOfMonth AND task.end_date >= startOfMonth
    conditions.push(
      and(
        lte(schedulerTasks.startDate, endOfMonth),
        gte(schedulerTasks.endDate, startOfMonth)
      )
    );
  } else if (filter.startDate && filter.endDate) {
    conditions.push(
      and(
        lte(schedulerTasks.startDate, filter.endDate),
        gte(schedulerTasks.endDate, filter.startDate)
      )
    );
  } else if (filter.startDate) {
    conditions.push(gte(schedulerTasks.endDate, filter.startDate));
  } else if (filter.endDate) {
    conditions.push(lte(schedulerTasks.startDate, filter.endDate));
  }

  if (filter.status && filter.status !== 'all') {
    conditions.push(eq(schedulerTasks.status, filter.status));
  }

  const rows = await db
    .select({
      id: schedulerTasks.id,
      title: schedulerTasks.title,
      description: schedulerTasks.description,
      startDate: schedulerTasks.startDate,
      endDate: schedulerTasks.endDate,
      startTime: schedulerTasks.startTime,
      endTime: schedulerTasks.endTime,
      status: schedulerTasks.status,
      createdBy: schedulerTasks.createdBy,
      createdByName: users.fullName,
      createdAt: schedulerTasks.createdAt,
      updatedAt: schedulerTasks.updatedAt,
    })
    .from(schedulerTasks)
    .leftJoin(users, eq(schedulerTasks.createdBy, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(schedulerTasks.startDate), asc(schedulerTasks.startTime), desc(schedulerTasks.createdAt));

  return rows.map((task) => {
    const classification = classifyTask(task.startDate, task.endDate, task.status, today);
    return {
      ...task,
      ...classification,
    };
  });
}

export async function getSchedulerTaskById(id: string) {
  const today = getTodayDateString();
  const [task] = await db
    .select({
      id: schedulerTasks.id,
      title: schedulerTasks.title,
      description: schedulerTasks.description,
      startDate: schedulerTasks.startDate,
      endDate: schedulerTasks.endDate,
      startTime: schedulerTasks.startTime,
      endTime: schedulerTasks.endTime,
      status: schedulerTasks.status,
      createdBy: schedulerTasks.createdBy,
      createdByName: users.fullName,
      createdAt: schedulerTasks.createdAt,
      updatedAt: schedulerTasks.updatedAt,
    })
    .from(schedulerTasks)
    .leftJoin(users, eq(schedulerTasks.createdBy, users.id))
    .where(eq(schedulerTasks.id, id))
    .limit(1);

  if (!task) {
    throw { status: 404, message: 'Scheduled task not found' };
  }

  const classification = classifyTask(task.startDate, task.endDate, task.status, today);
  return {
    ...task,
    ...classification,
  };
}

export async function createSchedulerTask(data: {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  status?: 'pending' | 'completed';
  createdBy?: string;
}) {
  if (data.endDate < data.startDate) {
    throw { status: 400, message: 'End date cannot be earlier than start date' };
  }

  const [created] = await db
    .insert(schedulerTasks)
    .values({
      title: data.title.trim(),
      description: data.description?.trim() || null,
      startDate: data.startDate,
      endDate: data.endDate,
      startTime: data.startTime?.trim() || null,
      endTime: data.endTime?.trim() || null,
      status: data.status || 'pending',
      createdBy: data.createdBy || null,
    })
    .returning();

  return getSchedulerTaskById(created.id);
}

export async function updateSchedulerTask(
  id: string,
  data: {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    status?: 'pending' | 'completed';
  }
) {
  const existing = await getSchedulerTaskById(id);

  const startDate = data.startDate || existing.startDate;
  const endDate = data.endDate || existing.endDate;

  if (endDate < startDate) {
    throw { status: 400, message: 'End date cannot be earlier than start date' };
  }

  const updatePayload: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (data.title !== undefined) updatePayload.title = data.title.trim();
  if (data.description !== undefined) updatePayload.description = data.description?.trim() || null;
  if (data.startDate !== undefined) updatePayload.startDate = data.startDate;
  if (data.endDate !== undefined) updatePayload.endDate = data.endDate;
  if (data.startTime !== undefined) updatePayload.startTime = data.startTime?.trim() || null;
  if (data.endTime !== undefined) updatePayload.endTime = data.endTime?.trim() || null;
  if (data.status !== undefined) updatePayload.status = data.status;

  await db
    .update(schedulerTasks)
    .set(updatePayload)
    .where(eq(schedulerTasks.id, id));

  return getSchedulerTaskById(id);
}

export async function updateSchedulerTaskStatus(id: string, status: 'pending' | 'completed') {
  await getSchedulerTaskById(id);

  await db
    .update(schedulerTasks)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(schedulerTasks.id, id));

  return getSchedulerTaskById(id);
}

export async function deleteSchedulerTask(id: string) {
  const existing = await getSchedulerTaskById(id);

  await db.delete(schedulerTasks).where(eq(schedulerTasks.id, id));

  return { id: existing.id, title: existing.title, deleted: true };
}
