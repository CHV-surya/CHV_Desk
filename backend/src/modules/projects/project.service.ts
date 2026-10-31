import { db } from '../../db/index.js';
import { projects, departments, users, userDepartments } from '../../db/schema.js';
import { eq, and, sql, desc, or } from 'drizzle-orm';

export interface ProjectFilters {
  departmentId?: string;
  search?: string;
  page?: number;
  limit?: number;
  userId: string;
  isAdmin: boolean;
}

export async function listProjects(filters: ProjectFilters) {
  const { departmentId, search, page = 1, limit = 100, userId, isAdmin } = filters;
  const offset = (page - 1) * limit;

  const conditions = [];

  // Employee project visibility rule:
  // Non-admin employees can ONLY see projects they personally created
  if (!isAdmin) {
    conditions.push(eq(projects.createdBy, userId));
    if (departmentId && departmentId !== 'all') {
      conditions.push(eq(projects.departmentId, departmentId));
    }
  } else {
    // Admin can view all projects across all departments, or filter by specific department
    if (departmentId && departmentId !== 'all') {
      conditions.push(eq(projects.departmentId, departmentId));
    }
  }

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    conditions.push(
      or(
        sql`LOWER(${projects.name}) LIKE ${term}`,
        sql`LOWER(${projects.description}) LIKE ${term}`
      )
    );
  }

  const query = db
    .select({
      id: projects.id,
      name: projects.name,
      departmentId: projects.departmentId,
      departmentName: departments.name,
      departmentColor: departments.accentColor,
      createdBy: projects.createdBy,
      createdByName: users.fullName,
      description: projects.description,
      status: projects.status,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .innerJoin(departments, eq(projects.departmentId, departments.id))
    .leftJoin(users, eq(projects.createdBy, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(projects.createdAt))
    .limit(limit)
    .offset(offset);

  const rows = await query;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    departmentId: r.departmentId,
    departmentName: r.departmentName,
    departmentColor: r.departmentColor,
    createdBy: r.createdBy || 'unknown',
    createdByName: r.createdByName || 'System Administrator',
    description: r.description || '',
    status: r.status,
    createdAt: r.createdAt.toISOString().split('T')[0],
  }));
}

export async function getProjectById(id: string, userId?: string, isAdmin: boolean = false) {
  const [row] = await db
    .select({
      id: projects.id,
      name: projects.name,
      departmentId: projects.departmentId,
      departmentName: departments.name,
      departmentColor: departments.accentColor,
      createdBy: projects.createdBy,
      createdByName: users.fullName,
      description: projects.description,
      status: projects.status,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .innerJoin(departments, eq(projects.departmentId, departments.id))
    .leftJoin(users, eq(projects.createdBy, users.id))
    .where(eq(projects.id, id))
    .limit(1);

  if (!row) {
    throw { status: 404, message: 'Project not found' };
  }

  // Strict ownership check: Non-admin employees can only view projects they personally created
  if (userId && !isAdmin && row.createdBy !== userId) {
    throw { status: 403, message: 'You do not have permission to view this project' };
  }

  return {
    id: row.id,
    name: row.name,
    departmentId: row.departmentId,
    departmentName: row.departmentName,
    departmentColor: row.departmentColor,
    createdBy: row.createdBy || 'unknown',
    createdByName: row.createdByName || 'System Administrator',
    description: row.description || '',
    status: row.status,
    createdAt: row.createdAt.toISOString().split('T')[0],
  };
}

export async function createProject(data: {
  name: string;
  departmentId: string;
  description?: string;
  userId: string;
  isAdmin: boolean;
}) {
  const { name, departmentId, description, userId, isAdmin } = data;

  // Validate department exists
  const [dept] = await db
    .select()
    .from(departments)
    .where(eq(departments.id, departmentId))
    .limit(1);

  if (!dept) {
    throw { status: 404, message: 'Department not found' };
  }

  // If employee, verify department assignment
  if (!isAdmin) {
    const [assignment] = await db
      .select()
      .from(userDepartments)
      .where(
        and(
          eq(userDepartments.userId, userId),
          eq(userDepartments.departmentId, departmentId)
        )
      )
      .limit(1);

    if (!assignment) {
      throw { status: 403, message: 'You are not assigned to this department' };
    }
  }

  const [newProject] = await db
    .insert(projects)
    .values({
      name: name.trim(),
      departmentId,
      description: description?.trim() || null,
      createdBy: userId,
      status: 'active',
    })
    .returning();

  return getProjectById(newProject.id, userId, isAdmin);
}

export async function updateProject(
  id: string,
  data: {
    name?: string;
    description?: string;
    status?: string;
  },
  userId: string,
  isAdmin: boolean
) {
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) {
    throw { status: 404, message: 'Project not found' };
  }

  // Employee can only rename / edit their own project
  if (!isAdmin && project.createdBy !== userId) {
    throw { status: 403, message: 'You can only edit projects created by you' };
  }

  const updates: any = { updatedAt: new Date() };
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.description !== undefined) updates.description = data.description.trim();
  if (data.status !== undefined && isAdmin) updates.status = data.status;

  await db.update(projects).set(updates).where(eq(projects.id, id));
  return getProjectById(id, userId, isAdmin);
}

export async function deleteProject(id: string, isAdmin: boolean) {
  if (!isAdmin) {
    throw { status: 403, message: 'Only administrators are permitted to delete projects' };
  }

  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) {
    throw { status: 404, message: 'Project not found' };
  }

  await db.delete(projects).where(eq(projects.id, id));
  return { message: 'Project deleted permanently' };
}

