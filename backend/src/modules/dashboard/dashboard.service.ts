import { db } from '../../db/index.js';
import { users, departments, projects, dailyActivities, userDepartments } from '../../db/schema.js';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { getTodayDateString, calculateWorkingDuration, formatTime12h } from '../../utils/date.js';
import { getAttendanceSummary } from '../attendance/attendance.service.js';
import { listActivities, getTodayActivityForEmployee } from '../activities/activity.service.js';

export async function getAdminDashboardData() {
  const today = getTodayDateString();

  // 1. Attendance & KPI Summary
  const attendance = await getAttendanceSummary();

  // 2. Total projects count
  const [projectCountRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects);
  const totalProjects = Number(projectCountRow?.count || 0);

  // 3. Departments count and list
  const depts = await db
    .select()
    .from(departments)
    .orderBy(desc(departments.createdAt));
  const totalDepartments = depts.length;

  // 4. Department cards operational metrics
  const deptIds = depts.map((d) => d.id);

  // Department employees
  const deptEmployeeAssignments = await db
    .select({
      departmentId: userDepartments.departmentId,
      userId: users.id,
      fullName: users.fullName,
      username: users.username,
      email: users.email,
    })
    .from(userDepartments)
    .innerJoin(users, eq(userDepartments.userId, users.id))
    .where(and(eq(users.role, 'employee'), eq(users.isActive, true)));

  // Department projects
  const deptProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      departmentId: projects.departmentId,
    })
    .from(projects);

  // Department active activities today
  const todayWorkingActivities = await db
    .select({
      id: dailyActivities.id,
      departmentId: dailyActivities.departmentId,
      notes: dailyActivities.notes,
      status: dailyActivities.status,
    })
    .from(dailyActivities)
    .where(and(eq(dailyActivities.workDate, today), eq(dailyActivities.status, 'working')));

  // Department latest notes today
  const todayNotes = await db
    .select({
      departmentId: dailyActivities.departmentId,
      notes: dailyActivities.notes,
    })
    .from(dailyActivities)
    .where(
      and(
        eq(dailyActivities.workDate, today),
        sql`${dailyActivities.notes} IS NOT NULL AND ${dailyActivities.notes} != ''`
      )
    )
    .orderBy(desc(dailyActivities.updatedAt));

  const departmentCards = depts.map((dept) => {
    const assignedEmps = deptEmployeeAssignments.filter((a) => a.departmentId === dept.id);
    const assignedProjs = deptProjects.filter((p) => p.departmentId === dept.id);
    const workingCount = todayWorkingActivities.filter((a) => a.departmentId === dept.id).length;
    const latestNote = todayNotes.find((n) => n.departmentId === dept.id)?.notes;

    return {
      id: dept.id,
      name: dept.name,
      slug: dept.slug,
      description: dept.description || '',
      color: dept.accentColor,
      employeeCount: assignedEmps.length,
      projectCount: assignedProjs.length,
      currentlyWorkingCount: workingCount,
      recentActivityNote: latestNote,
      projectTags: assignedProjs.map((p) => p.name),
      departmentEmployees: assignedEmps.map((e) => ({
        id: e.userId,
        fullName: e.fullName,
        username: e.username,
        email: e.email || '',
      })),
    };
  });

  // 5. Recent workforce activities (last 10)
  const recentActivities = await listActivities({
    limit: 10,
    currentUserId: '',
    isAdmin: true,
  });

  return {
    kpis: {
      totalEmployees: attendance.totalEmployees,
      activeToday: attendance.activeToday,
      currentlyWorking: attendance.currentlyWorking,
      completedToday: attendance.completedToday,
      notJoinedToday: attendance.notJoinedToday,
      attendanceRate: attendance.attendanceRate,
      totalProjects,
      totalDepartments,
    },
    donutData: attendance.donutData,
    departments: departmentCards,
    recentActivities,
  };
}

export async function getEmployeeDashboardData(userId: string) {
  // 1. User's assigned departments
  const assignedDepts = await db
    .select({
      id: departments.id,
      name: departments.name,
      slug: departments.slug,
      description: departments.description,
      color: departments.accentColor,
    })
    .from(userDepartments)
    .innerJoin(departments, eq(userDepartments.departmentId, departments.id))
    .where(and(eq(userDepartments.userId, userId), eq(departments.isActive, true)));

  // 2. Today's activity
  const todayActivity = await getTodayActivityForEmployee(userId);

  // 3. User's projects (strictly created by this employee)
  const myProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      departmentId: projects.departmentId,
      departmentName: departments.name,
      description: projects.description,
      status: projects.status,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .innerJoin(departments, eq(projects.departmentId, departments.id))
    .where(eq(projects.createdBy, userId))
    .orderBy(desc(projects.createdAt))
    .limit(10);

  // 4. User's recent activities
  const recentActivities = await listActivities({
    employeeId: userId,
    currentUserId: userId,
    isAdmin: false,
    limit: 7,
  });

  return {
    assignedDepartments: assignedDepts,
    todayActivity,
    myProjects,
    recentActivities,
  };
}

export async function getManagerDashboardData(userId: string) {
  const today = getTodayDateString();

  // 1. Manager's assigned departments
  const assignedDepts = await db
    .select({
      id: departments.id,
      name: departments.name,
      slug: departments.slug,
      description: departments.description,
      color: departments.accentColor,
      isActive: departments.isActive,
    })
    .from(userDepartments)
    .innerJoin(departments, eq(userDepartments.departmentId, departments.id))
    .where(and(eq(userDepartments.userId, userId), eq(departments.isActive, true)));

  const deptIds = assignedDepts.map((d) => d.id);

  if (deptIds.length === 0) {
    return {
      kpis: {
        totalEmployees: 0,
        activeToday: 0,
        currentlyWorking: 0,
        completedToday: 0,
        notJoinedToday: 0,
        attendanceRate: 0,
        totalProjects: 0,
        totalDepartments: 0,
      },
      donutData: [
        { name: 'Working', value: 0, color: '#2563EB' },
        { name: 'Completed', value: 0, color: '#10B981' },
        { name: 'Not Joined', value: 0, color: '#F59E0B' },
      ],
      departments: [],
      recentActivities: [],
      assignedDepartments: [],
    };
  }

  // 2. Department staff employees (in manager's assigned departments)
  const deptEmployees = await db
    .select({
      departmentId: userDepartments.departmentId,
      userId: users.id,
      fullName: users.fullName,
      username: users.username,
      email: users.email,
    })
    .from(userDepartments)
    .innerJoin(users, eq(userDepartments.userId, users.id))
    .where(
      and(
        inArray(userDepartments.departmentId, deptIds)!,
        eq(users.role, 'employee'),
        eq(users.isActive, true)
      )
    );

  const uniqueEmployeeIds = Array.from(new Set(deptEmployees.map((e) => e.userId)));
  const totalEmployees = uniqueEmployeeIds.length;

  // 3. Projects in manager's assigned departments
  const deptProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      departmentId: projects.departmentId,
    })
    .from(projects)
    .where(inArray(projects.departmentId, deptIds)!);

  const totalProjects = deptProjects.length;

  // 4. Activities in manager's assigned departments today
  const todayActivities = await db
    .select({
      id: dailyActivities.id,
      employeeId: dailyActivities.employeeId,
      departmentId: dailyActivities.departmentId,
      status: dailyActivities.status,
      workingMinutes: dailyActivities.workingMinutes,
      notes: dailyActivities.notes,
    })
    .from(dailyActivities)
    .where(
      and(
        eq(dailyActivities.workDate, today),
        inArray(dailyActivities.departmentId, deptIds)!
      )
    );

  const activeTodayIds = new Set(
    todayActivities.filter((a) => a.status === 'working' || a.status === 'completed').map((a) => a.employeeId)
  );
  const currentlyWorkingIds = new Set(
    todayActivities.filter((a) => a.status === 'working').map((a) => a.employeeId)
  );
  const completedTodayIds = new Set(
    todayActivities.filter((a) => a.status === 'completed').map((a) => a.employeeId)
  );

  const activeToday = activeTodayIds.size;
  const currentlyWorking = currentlyWorkingIds.size;
  const completedToday = completedTodayIds.size;
  const notJoinedToday = Math.max(0, totalEmployees - activeToday);
  const attendanceRate = totalEmployees > 0 ? Math.round((activeToday / totalEmployees) * 100) : 0;

  // 5. Department cards for manager's assigned departments
  const departmentCards = assignedDepts.map((d) => {
    const dEmps = deptEmployees.filter((e) => e.departmentId === d.id);
    const dPrjs = deptProjects.filter((p) => p.departmentId === d.id);
    const dTodayActs = todayActivities.filter((a) => a.departmentId === d.id);
    const dWorking = dTodayActs.filter((a) => a.status === 'working').length;
    const latestNote = dTodayActs.find((a) => a.notes && a.notes.trim())?.notes || 'No activity notes logged yet today';

    return {
      id: d.id,
      name: d.name,
      slug: d.slug,
      color: d.color,
      totalEmployees: dEmps.length,
      activeToday: dWorking,
      totalProjects: dPrjs.length,
      latestNotes: latestNote,
    };
  });

  // 6. Recent activities in manager's assigned departments
  const recentActivities = await listActivities({
    departmentId: deptIds.length === 1 ? deptIds[0] : undefined,
    currentUserId: userId,
    isAdmin: false,
    userRole: 'manager',
    limit: 10,
  });

  return {
    kpis: {
      totalEmployees,
      activeToday,
      currentlyWorking,
      completedToday,
      notJoinedToday,
      attendanceRate,
      totalProjects,
      totalDepartments: assignedDepts.length,
    },
    donutData: [
      { name: 'Working', value: currentlyWorking, color: '#2563EB' },
      { name: 'Completed', value: completedToday, color: '#10B981' },
      { name: 'Not Joined', value: notJoinedToday, color: '#F59E0B' },
    ],
    departments: departmentCards,
    recentActivities,
    assignedDepartments: assignedDepts,
  };
}

