import { db } from '../../db/index.js';
import { dailyActivities, users, departments, userDepartments } from '../../db/schema.js';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { getTodayDateString, calculateWorkingDuration, formatTime12h } from '../../utils/date.js';

export async function getTodayAttendance(
  filters: { departmentId?: string; status?: string; search?: string },
  currentUserId: string,
  isAdmin: boolean
) {
  const today = getTodayDateString();

  // 1. Get staff employees (exclude admin from attendance count)
  const staffUsersQuery = db
    .select({
      id: users.id,
      fullName: users.fullName,
      username: users.username,
      email: users.email,
    })
    .from(users)
    .where(and(eq(users.role, 'employee'), eq(users.isActive, true)));

  const allStaff = await staffUsersQuery;

  // 2. Get department assignments
  const userIds = allStaff.map((u) => u.id);
  let assignments: { userId: string; departmentId: string; departmentName: string }[] = [];
  if (userIds.length > 0) {
    assignments = await db
      .select({
        userId: userDepartments.userId,
        departmentId: departments.id,
        departmentName: departments.name,
      })
      .from(userDepartments)
      .innerJoin(departments, eq(userDepartments.departmentId, departments.id))
      .where(inArray(userDepartments.userId, userIds));
  }

  // 3. Get today's activity records
  const activities = await db
    .select({
      id: dailyActivities.id,
      employeeId: dailyActivities.employeeId,
      departmentId: dailyActivities.departmentId,
      joinTime: dailyActivities.joinTime,
      endTime: dailyActivities.endTime,
      workingMinutes: dailyActivities.workingMinutes,
      status: dailyActivities.status,
      notes: dailyActivities.notes,
    })
    .from(dailyActivities)
    .where(eq(dailyActivities.workDate, today));

  // Build unified attendance roster: every employee has a record for today (either from activity or not-joined)
  const roster = allStaff.map((emp) => {
    const act = activities.find((a) => a.employeeId === emp.id);
    const empDepts = assignments.filter((a) => a.userId === emp.id);
    const duration = act
      ? calculateWorkingDuration(act.joinTime, act.endTime, act.status)
      : { minutes: 0, formatted: null };

    const status = act ? act.status : 'not_joined';

    return {
      employeeId: emp.id,
      employeeName: emp.fullName,
      employeeUsername: emp.username,
      departmentIds: empDepts.map((d) => d.departmentId),
      departmentNames: empDepts.map((d) => d.departmentName),
      date: today,
      joinTime: act ? formatTime12h(act.joinTime) : null,
      endTime: act ? formatTime12h(act.endTime) : null,
      workingHours: duration.formatted,
      workingMinutes: duration.minutes,
      status: status === 'not_joined' ? 'not-joined' : status,
      notes: act?.notes || '',
    };
  });

  // If not admin, return only self
  let filtered = isAdmin ? roster : roster.filter((r) => r.employeeId === currentUserId);

  if (filters.departmentId && filters.departmentId !== 'all') {
    filtered = filtered.filter((r) => r.departmentIds.includes(filters.departmentId!));
  }

  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter((r) => r.status === filters.status);
  }

  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim().toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.employeeName.toLowerCase().includes(term) ||
        r.employeeUsername.toLowerCase().includes(term) ||
        r.departmentNames.some((d) => d.toLowerCase().includes(term))
    );
  }

  return filtered;
}

export async function getAttendanceSummary() {
  const today = getTodayDateString();

  // Total active staff (excluding admin)
  const [staffCountRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(and(eq(users.role, 'employee'), eq(users.isActive, true)));

  const totalEmployees = Number(staffCountRow?.count || 0);

  // Today's activities
  const todayActs = await db
    .select({
      id: dailyActivities.id,
      status: dailyActivities.status,
    })
    .from(dailyActivities)
    .innerJoin(users, eq(dailyActivities.employeeId, users.id))
    .where(
      and(
        eq(dailyActivities.workDate, today),
        eq(users.role, 'employee'),
        eq(users.isActive, true)
      )
    );

  const currentlyWorking = todayActs.filter((a) => a.status === 'working').length;
  const completedToday = todayActs.filter((a) => a.status === 'completed').length;
  const activeToday = currentlyWorking + completedToday;
  const notJoinedToday = Math.max(0, totalEmployees - activeToday);
  const attendanceRate = totalEmployees > 0 ? Math.round((activeToday / totalEmployees) * 100) : 0;

  return {
    totalEmployees,
    activeToday,
    currentlyWorking,
    completedToday,
    notJoinedToday,
    attendanceRate,
    donutData: [
      { name: 'Working', value: currentlyWorking, color: '#2563EB' },
      { name: 'Completed', value: completedToday, color: '#10B981' },
      { name: 'Not Joined', value: notJoinedToday, color: '#F59E0B' },
    ],
  };
}

