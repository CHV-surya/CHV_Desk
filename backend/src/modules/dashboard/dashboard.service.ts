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

