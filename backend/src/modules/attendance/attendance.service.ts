import { db } from '../../db/index.js';
import { dailyActivities, users, departments, userDepartments } from '../../db/schema.js';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { getTodayDateString, calculateWorkingDuration, formatTime12h } from '../../utils/date.js';

export async function getTodayAttendance(
  filters: { departmentId?: string; status?: string; search?: string },
  currentUserId: string,
  isAdmin: boolean,
  userRole?: 'admin' | 'manager' | 'employee'
) {
  const today = getTodayDateString();

  // Manager department scope validation
  let managerDeptIds: string[] = [];
  if (userRole === 'manager' && !isAdmin) {
    const managerDepts = await db
      .select({ departmentId: userDepartments.departmentId })
      .from(userDepartments)
      .where(eq(userDepartments.userId, currentUserId));
    managerDeptIds = managerDepts.map((d) => d.departmentId);

    if (managerDeptIds.length === 0) {
      return [];
    }

    if (filters.departmentId && filters.departmentId !== 'all') {
      if (!managerDeptIds.includes(filters.departmentId)) {
        throw { status: 403, message: 'Access denied: You are not assigned to this department' };
      }
    }
  }

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

  let allStaff = await staffUsersQuery;

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

  // If manager, scope staff employees to manager's assigned departments
  if (userRole === 'manager' && !isAdmin) {
    const allowedUserIds = new Set(
      assignments.filter((a) => managerDeptIds.includes(a.departmentId)).map((a) => a.userId)
    );
    allStaff = allStaff.filter((u) => allowedUserIds.has(u.id));
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

export async function getAttendanceSummary(currentUserId?: string, userRole?: string) {
  const today = getTodayDateString();

  let managerDeptIds: string[] = [];
  if (userRole === 'manager' && currentUserId) {
    const managerDepts = await db
      .select({ departmentId: userDepartments.departmentId })
      .from(userDepartments)
      .where(eq(userDepartments.userId, currentUserId));
    managerDeptIds = managerDepts.map((d) => d.departmentId);

    if (managerDeptIds.length === 0) {
      return {
        totalEmployees: 0,
        activeToday: 0,
        currentlyWorking: 0,
        completedToday: 0,
        notJoinedToday: 0,
        attendanceRate: 0,
        donutData: [
          { name: 'Working', value: 0, color: '#2563EB' },
          { name: 'Completed', value: 0, color: '#10B981' },
          { name: 'Not Joined', value: 0, color: '#F59E0B' },
        ],
      };
    }
  }

  // Total active staff (excluding admin, scoped if manager)
  let totalEmployees = 0;
  if (userRole === 'manager' && managerDeptIds.length > 0) {
    const managerEmployees = await db
      .select({ userId: userDepartments.userId })
      .from(userDepartments)
      .innerJoin(users, eq(userDepartments.userId, users.id))
      .where(
        and(
          inArray(userDepartments.departmentId, managerDeptIds)!,
          eq(users.role, 'employee'),
          eq(users.isActive, true)
        )
      );
    totalEmployees = new Set(managerEmployees.map((e) => e.userId)).size;
  } else {
    const [staffCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.role, 'employee'), eq(users.isActive, true)));
    totalEmployees = Number(staffCountRow?.count || 0);
  }

  // Today's activities (scoped if manager)
  const actConditions = [
    eq(dailyActivities.workDate, today),
    eq(users.role, 'employee'),
    eq(users.isActive, true),
  ];

  if (userRole === 'manager' && managerDeptIds.length > 0) {
    actConditions.push(inArray(dailyActivities.departmentId, managerDeptIds)!);
  }

  const todayActs = await db
    .select({
      id: dailyActivities.id,
      status: dailyActivities.status,
    })
    .from(dailyActivities)
    .innerJoin(users, eq(dailyActivities.employeeId, users.id))
    .where(and(...actConditions));

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

