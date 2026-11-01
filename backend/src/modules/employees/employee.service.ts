import { db } from '../../db/index.js';
import { users, userDepartments, departments, dailyActivities, projects } from '../../db/schema.js';
import { eq, and, like, or, sql, desc, asc, inArray, gte, lte } from 'drizzle-orm';
import { hashPassword } from '../../utils/password.js';
import ExcelJS from 'exceljs';
import { formatTime12h, calculateWorkingDuration } from '../../utils/date.js';

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export interface EmployeeFilters {
  search?: string;
  departmentId?: string;
  status?: string;
  page?: number;
  limit?: number;
  currentUserId?: string;
  userRole?: 'admin' | 'manager' | 'employee';
}

export async function listEmployees(filters: EmployeeFilters) {
  const { search, departmentId, status, page = 1, limit = 50, currentUserId, userRole } = filters;
  const offset = (page - 1) * limit;

  // Manager department scope validation
  let managerDeptIds: string[] = [];
  if (userRole === 'manager' && currentUserId) {
    const managerDepts = await db
      .select({ departmentId: userDepartments.departmentId })
      .from(userDepartments)
      .where(eq(userDepartments.userId, currentUserId));
    managerDeptIds = managerDepts.map((d) => d.departmentId);

    if (managerDeptIds.length === 0) {
      return [];
    }

    if (departmentId && departmentId !== 'all') {
      if (!managerDeptIds.includes(departmentId)) {
        throw { status: 403, message: 'Access denied: You are not assigned to this department' };
      }
    }
  }

  // Base conditions
  const conditions = [];

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    conditions.push(
      or(
        sql`LOWER(${users.fullName}) LIKE ${term}`,
        sql`LOWER(${users.username}) LIKE ${term}`,
        sql`LOWER(${users.email}) LIKE ${term}`
      )
    );
  }

  if (status && status !== 'all') {
    conditions.push(eq(users.isActive, status === 'active'));
  }

  // Get users
  const userQuery = db
    .select({
      id: users.id,
      fullName: users.fullName,
      username: users.username,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  const rawUsers = await userQuery;

  // Get department assignments for all fetched users
  const userIds = rawUsers.map((u) => u.id);
  let assignments: { userId: string; departmentId: string; departmentName: string; departmentColor: string }[] = [];

  if (userIds.length > 0) {
    assignments = await db
      .select({
        userId: userDepartments.userId,
        departmentId: departments.id,
        departmentName: departments.name,
        departmentColor: departments.accentColor,
      })
      .from(userDepartments)
      .innerJoin(departments, eq(userDepartments.departmentId, departments.id))
      .where(inArray(userDepartments.userId, userIds));
  }

  const results = rawUsers.map((u) => {
    const userDepts = assignments.filter((a) => a.userId === u.id);
    return {
      id: u.id,
      fullName: u.fullName,
      username: u.username,
      email: u.email || '',
      role: u.role,
      status: u.isActive ? 'active' : 'inactive',
      isActive: u.isActive,
      createdAt: u.createdAt,
      assignedDepartments: userDepts.map((d) => d.departmentId),
      departments: userDepts.map((d) => ({
        id: d.departmentId,
        name: d.departmentName,
        color: d.departmentColor,
      })),
    };
  });

  // If department filter specified, filter results
  if (departmentId && departmentId !== 'all') {
    return results.filter((u) => u.assignedDepartments.includes(departmentId));
  }

  // If manager, restrict to employees belonging to manager's assigned departments
  if (userRole === 'manager' && managerDeptIds.length > 0) {
    return results.filter((u) =>
      u.assignedDepartments.some((d) => managerDeptIds.includes(d))
    );
  }

  return results;
}

export async function getEmployeeById(
  id: string,
  currentUserId?: string,
  userRole?: 'admin' | 'manager' | 'employee'
) {
  const [user] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      username: users.username,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) {
    throw { status: 404, message: 'Employee not found' };
  }

  const depts = await db
    .select({
      id: departments.id,
      name: departments.name,
      slug: departments.slug,
      color: departments.accentColor,
    })
    .from(userDepartments)
    .innerJoin(departments, eq(userDepartments.departmentId, departments.id))
    .where(eq(userDepartments.userId, user.id));

  // If manager, verify that target employee shares at least one assigned department
  if (userRole === 'manager' && currentUserId) {
    const managerDepts = await db
      .select({ departmentId: userDepartments.departmentId })
      .from(userDepartments)
      .where(eq(userDepartments.userId, currentUserId));
    const managerDeptIds = managerDepts.map((d) => d.departmentId);

    const hasSharedDept = depts.some((d) => managerDeptIds.includes(d.id));
    if (!hasSharedDept) {
      throw {
        status: 403,
        message: 'Access denied: Employee does not belong to your assigned departments',
      };
    }
  }

  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email || '',
    role: user.role,
    status: user.isActive ? 'active' : 'inactive',
    isActive: user.isActive,
    createdAt: user.createdAt,
    assignedDepartments: depts.map((d) => d.id),
    departments: depts,
  };
}

export async function createEmployee(data: {
  fullName: string;
  username: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'manager' | 'employee';
  assignedDepartments: string[];
}) {
  const cleanUsername = data.username.trim().toLowerCase();

  // Check unique username
  const [existingUsername] = await db
    .select()
    .from(users)
    .where(eq(users.username, cleanUsername))
    .limit(1);

  if (existingUsername) {
    throw { status: 409, message: 'Username is already taken' };
  }

  if (data.email) {
    const [existingEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email.trim().toLowerCase()))
      .limit(1);

    if (existingEmail) {
      throw { status: 409, message: 'Email address is already in use' };
    }
  }

  const plainPassword = data.password && data.password.trim() ? data.password.trim() : 'worktrack123';
  const passwordHash = await hashPassword(plainPassword);

  const [newUser] = await db
    .insert(users)
    .values({
      fullName: data.fullName.trim(),
      username: cleanUsername,
      email: data.email ? data.email.trim().toLowerCase() : null,
      passwordHash,
      role: data.role || 'employee',
      isActive: true,
    })
    .returning();

  // Assign departments
  if (data.assignedDepartments && data.assignedDepartments.length > 0) {
    for (const deptId of data.assignedDepartments) {
      await db.insert(userDepartments).values({
        userId: newUser.id,
        departmentId: deptId,
      });
    }
  }

  return getEmployeeById(newUser.id);
}

export async function updateEmployee(
  id: string,
  data: {
    fullName?: string;
    username?: string;
    email?: string;
    password?: string;
    role?: 'admin' | 'manager' | 'employee';
    status?: 'active' | 'inactive';
    assignedDepartments?: string[];
  }
) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) {
    throw { status: 404, message: 'Employee not found' };
  }

  const updates: any = { updatedAt: new Date() };

  if (data.fullName !== undefined) updates.fullName = data.fullName.trim();
  if (data.status !== undefined) updates.isActive = data.status === 'active';
  if (data.role !== undefined) updates.role = data.role;

  if (data.username !== undefined) {
    const cleanUsername = data.username.trim().toLowerCase();
    if (cleanUsername !== user.username) {
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.username, cleanUsername))
        .limit(1);
      if (existing) {
        throw { status: 409, message: 'Username already in use' };
      }
      updates.username = cleanUsername;
    }
  }

  if (data.email !== undefined) {
    const cleanEmail = data.email.trim().toLowerCase();
    if (cleanEmail && cleanEmail !== user.email) {
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, cleanEmail))
        .limit(1);
      if (existing) {
        throw { status: 409, message: 'Email address already in use' };
      }
      updates.email = cleanEmail;
    } else if (!cleanEmail) {
      updates.email = null;
    }
  }

  if (data.password && data.password.trim()) {
    updates.passwordHash = await hashPassword(data.password.trim());
  }

  await db.update(users).set(updates).where(eq(users.id, id));

  // Update department assignments if provided
  if (data.assignedDepartments !== undefined) {
    // Delete existing assignments
    await db.delete(userDepartments).where(eq(userDepartments.userId, id));

    // Re-insert new assignments
    for (const deptId of data.assignedDepartments) {
      await db.insert(userDepartments).values({
        userId: id,
        departmentId: deptId,
      });
    }
  }

  return getEmployeeById(id);
}

export async function setEmployeeStatus(id: string, isActive: boolean) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) {
    throw { status: 404, message: 'Employee not found' };
  }

  await db
    .update(users)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(users.id, id));

  return getEmployeeById(id);
}

export async function resetEmployeePassword(id: string, newPassword?: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) {
    throw { status: 404, message: 'Employee not found' };
  }

  const pass = newPassword && newPassword.trim() ? newPassword.trim() : 'worktrack123';
  const passwordHash = await hashPassword(pass);

  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, id));

  return { message: 'Password has been reset' };
}

export async function deleteEmployee(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) {
    throw { status: 404, message: 'Employee not found' };
  }

  // Check if user has associated activity records or projects
  const [actCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(dailyActivities)
    .where(eq(dailyActivities.employeeId, id));

  const [projCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(eq(projects.createdBy, id));

  // If user has history, preserve history by deactivating account rather than breaking referential integrity
  if (Number(actCount.count) > 0 || Number(projCount.count) > 0) {
    await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id));
    return {
      message: 'Employee has historical records. Account has been deactivated to preserve audit history.',
      deactivated: true,
    };
  }

  // If no history, safely delete
  await db.delete(users).where(eq(users.id, id));
  return { message: 'Employee account deleted successfully', deactivated: false };
}

/**
 * Get monthly activity preview for a specific employee
 */
export async function getEmployeeMonthlyActivity(
  employeeId: string,
  month: number,
  year: number
) {
  if (!month || month < 1 || month > 12) {
    throw { status: 400, message: 'Invalid month (must be between 1 and 12)' };
  }
  if (!year || year < 2000 || year > 2100) {
    throw { status: 400, message: 'Invalid year' };
  }

  const [user] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      username: users.username,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, employeeId))
    .limit(1);

  if (!user) {
    throw { status: 404, message: 'Employee not found' };
  }

  // Get department assignments
  const userDepts = await db
    .select({
      id: departments.id,
      name: departments.name,
      color: departments.accentColor,
    })
    .from(userDepartments)
    .innerJoin(departments, eq(userDepartments.departmentId, departments.id))
    .where(eq(userDepartments.userId, employeeId));

  const padMonth = String(month).padStart(2, '0');
  const startOfMonth = `${year}-${padMonth}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endOfMonth = `${year}-${padMonth}-${String(lastDay).padStart(2, '0')}`;

  // Query dailyActivities: one record per employee per day globally
  // Department used is the one recorded when employee joined
  const rows = await db
    .select({
      id: dailyActivities.id,
      workDate: dailyActivities.workDate,
      departmentId: dailyActivities.departmentId,
      departmentName: departments.name,
      projectId: dailyActivities.projectId,
      projectName: projects.name,
      projectDescription: projects.description,
      projectStatus: projects.status,
      joinTime: dailyActivities.joinTime,
      endTime: dailyActivities.endTime,
      workingMinutes: dailyActivities.workingMinutes,
      notes: dailyActivities.notes,
      status: dailyActivities.status,
    })
    .from(dailyActivities)
    .innerJoin(departments, eq(dailyActivities.departmentId, departments.id))
    .leftJoin(projects, eq(dailyActivities.projectId, projects.id))
    .where(
      and(
        eq(dailyActivities.employeeId, employeeId),
        gte(dailyActivities.workDate, startOfMonth),
        lte(dailyActivities.workDate, endOfMonth)
      )
    )
    .orderBy(asc(dailyActivities.workDate));

  let totalMinutes = 0;
  let completedCount = 0;
  let inProgressCount = 0;

  const records = rows.map((r) => {
    const duration = calculateWorkingDuration(r.joinTime, r.endTime, r.status);
    totalMinutes += duration.minutes;
    if (r.status === 'completed') completedCount++;
    if (r.status === 'working') inProgressCount++;

    return {
      id: r.id,
      employeeName: user.fullName,
      departmentName: r.departmentName,
      workDate: r.workDate,
      joinTime: r.joinTime ? formatTime12h(r.joinTime) : '-',
      endTime: r.status === 'working' ? 'In Progress' : (r.endTime ? formatTime12h(r.endTime) : '-'),
      workingHours: duration.formatted || '0m',
      workingMinutes: duration.minutes,
      dailyNotes: r.notes || '-',
      projectName: r.projectName || '-',
      projectDetails: r.projectDescription || (r.projectStatus ? `Status: ${r.projectStatus}` : '-'),
      status: r.status,
    };
  });

  const totalHours = Math.floor(totalMinutes / 60);
  const remMinutes = totalMinutes % 60;
  const totalWorkingHoursFormatted = `${totalHours}h ${String(remMinutes).padStart(2, '0')}m`;

  return {
    employee: {
      ...user,
      departments: userDepts,
    },
    month,
    year,
    monthName: MONTH_NAMES[month - 1],
    summary: {
      totalDaysWorked: records.length,
      totalWorkingMinutes: totalMinutes,
      totalWorkingHours: totalWorkingHoursFormatted,
      completedShifts: completedCount,
      inProgressShifts: inProgressCount,
    },
    records,
  };
}

/**
 * Generate formatted Excel (.xlsx) workbook for employee monthly activity
 */
export async function exportEmployeeMonthlyActivityToExcel(
  employeeId: string,
  month: number,
  year: number
) {
  const data = await getEmployeeMonthlyActivity(employeeId, month, year);
  const { employee, monthName, summary, records } = data;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'WorkTrack Platform';
  workbook.created = new Date();

  // Clean sheet name: no \ / ? * : [ ] and max 31 chars
  const sanitizedName = employee.fullName.replace(/[\\/?*:[\]]/g, '').slice(0, 16);
  const sheetName = `${sanitizedName} - ${monthName} ${year}`.slice(0, 31);
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
  });

  // Styles
  const TITLE_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF142653' }, // WorkTrack dark blue
  };
  const STATS_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' }, // Light slate
  };
  const HEADER_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' }, // Navy blue
  };
  const ALT_ROW_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF8FAFC' }, // Very light slate
  };
  const THIN_BORDER: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  };
  const HEADER_BORDER: Partial<ExcelJS.Borders> = {
    top: { style: 'medium', color: { argb: 'FF0F172A' } },
    bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
    left: { style: 'thin', color: { argb: 'FF475569' } },
    right: { style: 'thin', color: { argb: 'FF475569' } },
  };

  // Set explicit column widths
  worksheet.columns = [
    { key: 'employeeName', width: 22 },
    { key: 'department', width: 20 },
    { key: 'workDate', width: 16 },
    { key: 'joinTime', width: 14 },
    { key: 'endTime', width: 14 },
    { key: 'workingHours', width: 16 },
    { key: 'dailyNotes', width: 38 },
    { key: 'projectName', width: 24 },
    { key: 'projectDetails', width: 28 },
  ];

  let currentRowIdx = 1;

  // 1. Title Banner
  worksheet.mergeCells(`A${currentRowIdx}:I${currentRowIdx}`);
  const titleCell = worksheet.getCell(`A${currentRowIdx}`);
  titleCell.value = 'WORKTRACK — EMPLOYEE MONTHLY ACTIVITY REPORT';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = TITLE_FILL;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(currentRowIdx).height = 36;
  currentRowIdx++;

  // 2. Employee Profile & Period Meta Info
  worksheet.mergeCells(`A${currentRowIdx}:E${currentRowIdx}`);
  const empInfoCell = worksheet.getCell(`A${currentRowIdx}`);
  empInfoCell.value = `Employee: ${employee.fullName} (@${employee.username}) | Email: ${employee.email || 'N/A'}`;
  empInfoCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  empInfoCell.alignment = { horizontal: 'left', vertical: 'middle' };

  worksheet.mergeCells(`F${currentRowIdx}:I${currentRowIdx}`);
  const periodCell = worksheet.getCell(`F${currentRowIdx}`);
  periodCell.value = `Reporting Period: ${monthName} ${year}`;
  periodCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  periodCell.alignment = { horizontal: 'right', vertical: 'middle' };
  worksheet.getRow(currentRowIdx).height = 24;
  currentRowIdx++;

  // 3. Summary Stats Row
  worksheet.mergeCells(`A${currentRowIdx}:I${currentRowIdx}`);
  const statsCell = worksheet.getCell(`A${currentRowIdx}`);
  statsCell.value = `Days Worked: ${summary.totalDaysWorked}  |  Total Working Hours: ${summary.totalWorkingHours}  |  Completed Shifts: ${summary.completedShifts}  |  In-Progress Shifts: ${summary.inProgressShifts}`;
  statsCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF2563EB' } };
  statsCell.fill = STATS_FILL;
  statsCell.alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(currentRowIdx).height = 24;
  currentRowIdx++;

  // Empty row
  currentRowIdx++;

  // 4. Column Headers
  const headers = [
    'Employee Name',
    'Department',
    'Work Date',
    'JOIN Time',
    'END Time',
    'Working Hours',
    'Daily Notes',
    'Project Name',
    'Project Details',
  ];

  const headerRow = worksheet.getRow(currentRowIdx);
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = HEADER_FILL;
    cell.alignment = {
      horizontal: idx === 2 || idx === 3 || idx === 4 || idx === 5 ? 'center' : 'left',
      vertical: 'middle',
      wrapText: true,
    };
    cell.border = HEADER_BORDER;
  });
  headerRow.height = 28;
  currentRowIdx++;

  // 5. Data Rows
  if (records.length === 0) {
    worksheet.mergeCells(`A${currentRowIdx}:I${currentRowIdx}`);
    const emptyCell = worksheet.getCell(`A${currentRowIdx}`);
    emptyCell.value = `No activity records found for ${employee.fullName} in ${monthName} ${year}.`;
    emptyCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
    emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    emptyCell.border = THIN_BORDER;
    worksheet.getRow(currentRowIdx).height = 28;
    currentRowIdx++;
  } else {
    records.forEach((rec, idx) => {
      const row = worksheet.getRow(currentRowIdx);
      const isEven = idx % 2 === 1;

      row.getCell(1).value = rec.employeeName;
      row.getCell(2).value = rec.departmentName;
      row.getCell(3).value = rec.workDate;
      row.getCell(4).value = rec.joinTime;
      row.getCell(5).value = rec.endTime;
      row.getCell(6).value = rec.workingHours;
      row.getCell(7).value = rec.dailyNotes;
      row.getCell(8).value = rec.projectName;
      row.getCell(9).value = rec.projectDetails;

      for (let c = 1; c <= 9; c++) {
        const cell = row.getCell(c);
        cell.font = { name: 'Arial', size: 10, color: { argb: 'FF1E293B' } };
        if (c === 6) {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
        }
        if (c === 5 && rec.endTime === 'In Progress') {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFD97706' } }; // Amber
        }
        cell.alignment = {
          horizontal: c >= 3 && c <= 6 ? 'center' : 'left',
          vertical: 'middle',
          wrapText: c === 7 || c === 9,
        };
        cell.border = THIN_BORDER;
        if (isEven) {
          cell.fill = ALT_ROW_FILL;
        }
      }

      row.height = 24;
      currentRowIdx++;
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const safeName = employee.fullName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${safeName}_Activity_${monthName}_${year}.xlsx`;

  return {
    buffer: Buffer.from(buffer),
    fileName,
    employeeName: employee.fullName,
  };
}

