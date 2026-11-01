import { db } from '../../db/index.js';
import { projects, departments, users, userDepartments, projectAssignments } from '../../db/schema.js';
import { eq, and, sql, desc, or, inArray } from 'drizzle-orm';
import { formatDateIST } from '../../utils/date.js';

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
  // Non-admin employees can see projects they personally created, OR projects they are assigned to
  let assignedProjectIds: string[] = [];
  if (!isAdmin && userId) {
    const userAssignments = await db
      .select({ projectId: projectAssignments.projectId })
      .from(projectAssignments)
      .where(eq(projectAssignments.userId, userId));
    assignedProjectIds = userAssignments.map((a) => a.projectId);

    if (assignedProjectIds.length > 0) {
      if (departmentId && departmentId !== 'all') {
        conditions.push(
          or(
            and(eq(projects.createdBy, userId), eq(projects.departmentId, departmentId)),
            inArray(projects.id, assignedProjectIds)!
          )!
        );
      } else {
        conditions.push(
          or(
            eq(projects.createdBy, userId),
            inArray(projects.id, assignedProjectIds)!
          )!
        );
      }
    } else {
      conditions.push(eq(projects.createdBy, userId));
      if (departmentId && departmentId !== 'all') {
        conditions.push(eq(projects.departmentId, departmentId));
      }
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

  const projectIds = rows.map((r) => r.id);
  const assignmentsByProject = new Map<string, { id: string; fullName: string; username: string }[]>();

  if (projectIds.length > 0) {
    const allAssignments = await db
      .select({
        projectId: projectAssignments.projectId,
        userId: users.id,
        fullName: users.fullName,
        username: users.username,
      })
      .from(projectAssignments)
      .innerJoin(users, eq(projectAssignments.userId, users.id))
      .where(inArray(projectAssignments.projectId, projectIds));

    for (const a of allAssignments) {
      const list = assignmentsByProject.get(a.projectId) || [];
      list.push({ id: a.userId, fullName: a.fullName, username: a.username });
      assignmentsByProject.set(a.projectId, list);
    }
  }

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
    createdAt: formatDateIST(r.createdAt) || '',
    isAssigned: !isAdmin && r.createdBy !== userId && assignedProjectIds.includes(r.id),
    assignedEditors: assignmentsByProject.get(r.id) || [],
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

  // Strict ownership check: Non-admin employees can only view projects they personally created OR are assigned to
  let isAssigned = false;
  if (userId && !isAdmin && row.createdBy !== userId) {
    const [assignment] = await db
      .select()
      .from(projectAssignments)
      .where(
        and(
          eq(projectAssignments.projectId, id),
          eq(projectAssignments.userId, userId)
        )
      )
      .limit(1);

    if (!assignment) {
      throw { status: 403, message: 'You do not have permission to view this project' };
    }
    isAssigned = true;
  }

  const assignedEditors = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      username: users.username,
    })
    .from(projectAssignments)
    .innerJoin(users, eq(projectAssignments.userId, users.id))
    .where(eq(projectAssignments.projectId, id));

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
    createdAt: formatDateIST(row.createdAt) || '',
    isAssigned,
    assignedEditors,
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

