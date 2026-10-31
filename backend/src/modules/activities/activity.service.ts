import { db } from '../../db/index.js';
import { dailyActivities, departments, users, projects, userDepartments } from '../../db/schema.js';
import { eq, and, sql, desc, or } from 'drizzle-orm';
import { getTodayDateString, calculateWorkingDuration, formatTime12h } from '../../utils/date.js';

export interface ActivityFilters {
  date?: string;
  month?: string; // YYYY-MM
  departmentId?: string;
  employeeId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  currentUserId: string;
  isAdmin: boolean;
}

export async function listActivities(filters: ActivityFilters) {
  const {
    date,
    month,
    departmentId,
    employeeId,
    status,
    search,
    page = 1,
    limit = 100,
    currentUserId,
    isAdmin,
  } = filters;

  const offset = (page - 1) * limit;
  const conditions = [];

  // Employee can only view their own activities
  if (!isAdmin) {
    conditions.push(eq(dailyActivities.employeeId, currentUserId));
  } else if (employeeId && employeeId !== 'all') {
    conditions.push(eq(dailyActivities.employeeId, employeeId));
  }

  if (date) {
    conditions.push(eq(dailyActivities.workDate, date));
  } else if (month) {
    // Filter by YYYY-MM
    conditions.push(sql`TO_CHAR(${dailyActivities.workDate}, 'YYYY-MM') = ${month}`);
  }

  if (departmentId && departmentId !== 'all') {
    conditions.push(eq(dailyActivities.departmentId, departmentId));
  }

  if (status && status !== 'all') {
    conditions.push(eq(dailyActivities.status, status as any));
  }

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    conditions.push(
      or(
        sql`LOWER(${users.fullName}) LIKE ${term}`,
        sql`LOWER(${dailyActivities.notes}) LIKE ${term}`,
        sql`LOWER(${departments.name}) LIKE ${term}`
      )
    );
  }

  const rows = await db
    .select({
      id: dailyActivities.id,
      employeeId: dailyActivities.employeeId,
      employeeName: users.fullName,
      employeeUsername: users.username,
      departmentId: dailyActivities.departmentId,
      departmentName: departments.name,
      departmentColor: departments.accentColor,
      projectId: dailyActivities.projectId,
      projectName: projects.name,
      workDate: dailyActivities.workDate,
      joinTime: dailyActivities.joinTime,
      endTime: dailyActivities.endTime,
      workingMinutes: dailyActivities.workingMinutes,
      notes: dailyActivities.notes,
      status: dailyActivities.status,
      createdAt: dailyActivities.createdAt,
      updatedAt: dailyActivities.updatedAt,
    })
    .from(dailyActivities)
    .innerJoin(users, eq(dailyActivities.employeeId, users.id))
    .innerJoin(departments, eq(dailyActivities.departmentId, departments.id))
    .leftJoin(projects, eq(dailyActivities.projectId, projects.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(dailyActivities.workDate), desc(dailyActivities.joinTime))
    .limit(limit)
    .offset(offset);

  return rows.map((r) => {
    const duration = calculateWorkingDuration(r.joinTime, r.endTime, r.status);
    return {
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.employeeName,
      employeeUsername: r.employeeUsername,
      departmentId: r.departmentId,
      departmentName: r.departmentName,
      departmentColor: r.departmentColor,
      projectId: r.projectId,
      projectName: r.projectName || 'General Task',
      date: r.workDate,
      joinTime: formatTime12h(r.joinTime),
      endTime: formatTime12h(r.endTime),
      joinTimestamp: r.joinTime?.toISOString() || null,
      endTimestamp: r.endTime?.toISOString() || null,
      workingMinutes: duration.minutes,
      workingHours: duration.formatted,
      status: r.status,
      notes: r.notes || '',
      updatedAt: r.updatedAt.toISOString(),
    };
  });
}

export async function getTodayActivityForEmployee(employeeId: string, departmentId?: string) {
  const today = getTodayDateString();

  const [act] = await db
    .select({
      id: dailyActivities.id,
      employeeId: dailyActivities.employeeId,
      employeeName: users.fullName,
      departmentId: dailyActivities.departmentId,
      departmentName: departments.name,
      projectId: dailyActivities.projectId,
      workDate: dailyActivities.workDate,
      joinTime: dailyActivities.joinTime,
      endTime: dailyActivities.endTime,
      workingMinutes: dailyActivities.workingMinutes,
      notes: dailyActivities.notes,
      status: dailyActivities.status,
      createdAt: dailyActivities.createdAt,
      updatedAt: dailyActivities.updatedAt,
    })
    .from(dailyActivities)
    .innerJoin(users, eq(dailyActivities.employeeId, users.id))
    .innerJoin(departments, eq(dailyActivities.departmentId, departments.id))
    .where(
      and(
        eq(dailyActivities.employeeId, employeeId),
        eq(dailyActivities.workDate, today)
      )
    )
    .limit(1);

  if (!act) {
    return null;
  }

  const duration = calculateWorkingDuration(act.joinTime, act.endTime, act.status);

  return {
    id: act.id,
    employeeId: act.employeeId,
    employeeName: act.employeeName,
    departmentId: act.departmentId,
    departmentName: act.departmentName,
    projectId: act.projectId,
    date: act.workDate,
    joinTime: formatTime12h(act.joinTime),
    endTime: formatTime12h(act.endTime),
    joinTimestamp: act.joinTime?.toISOString() || null,
    endTimestamp: act.endTime?.toISOString() || null,
    workingMinutes: duration.minutes,
    workingHours: duration.formatted,
    status: act.status,
    notes: act.notes || '',
    updatedAt: act.updatedAt.toISOString(),
  };
}

export async function joinToday(employeeId: string, departmentId: string) {
  const today = getTodayDateString();
  const now = new Date();

  // Validate employee belongs to department (or admin)
  const [assignment] = await db
    .select()
    .from(userDepartments)
    .where(
      and(
        eq(userDepartments.userId, employeeId),
        eq(userDepartments.departmentId, departmentId)
      )
    )
    .limit(1);

  const [user] = await db.select().from(users).where(eq(users.id, employeeId)).limit(1);
  if (!user) {
    throw { status: 404, message: 'Employee not found' };
  }

  if (user.role !== 'admin' && !assignment) {
    throw { status: 403, message: 'You are not assigned to this department' };
  }

  // Check if today's activity already exists
  const [existing] = await db
    .select()
    .from(dailyActivities)
    .where(
      and(
        eq(dailyActivities.employeeId, employeeId),
        eq(dailyActivities.workDate, today)
      )
    )
    .limit(1);

  if (existing && existing.joinTime) {
    throw {
      status: 400,
      message: `You have already joined today at ${formatTime12h(existing.joinTime)}. JOIN is permitted only once per day.`,
    };
  }

  let activityId: string;

  if (existing) {
    const [updated] = await db
      .update(dailyActivities)
      .set({
        departmentId,
        joinTime: now,
        status: 'working',
        updatedAt: now,
      })
      .where(eq(dailyActivities.id, existing.id))
      .returning();
    activityId = updated.id;
  } else {
    const [created] = await db
      .insert(dailyActivities)
      .values({
        employeeId,
        departmentId,
        workDate: today,
        joinTime: now,
        status: 'working',
        workingMinutes: 0,
        notes: '',
      })
      .returning();
    activityId = created.id;
  }

  return getTodayActivityForEmployee(employeeId);
}

export async function endToday(employeeId: string, departmentId?: string) {
  const today = getTodayDateString();
  const now = new Date();

  const [existing] = await db
    .select()
    .from(dailyActivities)
    .where(
      and(
        eq(dailyActivities.employeeId, employeeId),
        eq(dailyActivities.workDate, today)
      )
    )
    .limit(1);

  if (!existing || !existing.joinTime) {
    throw {
      status: 400,
      message: 'You have not joined today yet. Please click JOIN first.',
    };
  }

  // Calculate working minutes from joinTime to current end timestamp
  const duration = calculateWorkingDuration(existing.joinTime, now, 'completed');

  await db
    .update(dailyActivities)
    .set({
      endTime: now,
      status: 'completed',
      workingMinutes: duration.minutes,
      updatedAt: now,
    })
    .where(eq(dailyActivities.id, existing.id));

  return getTodayActivityForEmployee(employeeId);
}

export async function updateDailyNotes(
  activityId: string,
  notes: string,
  userId: string,
  isAdmin: boolean
) {
  const [existing] = await db
    .select()
    .from(dailyActivities)
    .where(eq(dailyActivities.id, activityId))
    .limit(1);

  if (!existing) {
    throw { status: 404, message: 'Activity record not found' };
  }

  if (!isAdmin && existing.employeeId !== userId) {
    throw { status: 403, message: 'You are not allowed to edit another employee’s notes' };
  }

  const [updated] = await db
    .update(dailyActivities)
    .set({
      notes: notes.trim(),
      updatedAt: new Date(),
    })
    .where(eq(dailyActivities.id, activityId))
    .returning();

  return {
    id: updated.id,
    notes: updated.notes,
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function saveNotesForToday(
  employeeId: string,
  departmentId: string,
  notes: string
) {
  const today = getTodayDateString();
  const now = new Date();

  const [existing] = await db
    .select()
    .from(dailyActivities)
    .where(
      and(
        eq(dailyActivities.employeeId, employeeId),
        eq(dailyActivities.workDate, today)
      )
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(dailyActivities)
      .set({
        notes: notes.trim(),
        updatedAt: now,
      })
      .where(eq(dailyActivities.id, existing.id))
      .returning();

    return {
      id: updated.id,
      notes: updated.notes,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // Create record if not joined yet
  const [created] = await db
    .insert(dailyActivities)
    .values({
      employeeId,
      departmentId,
      workDate: today,
      status: 'not_joined',
      workingMinutes: 0,
      notes: notes.trim(),
    })
    .returning();

  return {
    id: created.id,
    notes: created.notes,
    updatedAt: created.updatedAt.toISOString(),
  };
}

