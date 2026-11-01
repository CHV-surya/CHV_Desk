import { db } from '../../db/index.js';
import { users, userDepartments, departments, dailyActivities, projects } from '../../db/schema.js';
import { eq, and, like, or, sql, desc, inArray } from 'drizzle-orm';
import { hashPassword } from '../../utils/password.js';

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

