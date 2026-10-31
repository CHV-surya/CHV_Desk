import { db } from '../../db/index.js';
import { departments, userDepartments, projects, dailyActivities } from '../../db/schema.js';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';

export async function listDepartments(userId?: string, isAdmin: boolean = false) {
  // If admin, return all departments
  if (isAdmin) {
    const allDepts = await db
      .select()
      .from(departments)
      .orderBy(desc(departments.createdAt));

    // Get count of employees and projects per department
    const employeeCounts = await db
      .select({
        departmentId: userDepartments.departmentId,
        count: sql<number>`count(distinct ${userDepartments.userId})`,
      })
      .from(userDepartments)
      .groupBy(userDepartments.departmentId);

    const projectCounts = await db
      .select({
        departmentId: projects.departmentId,
        count: sql<number>`count(*)`,
      })
      .from(projects)
      .groupBy(projects.departmentId);

    return allDepts.map((d) => {
      const empC = employeeCounts.find((e) => e.departmentId === d.id);
      const prjC = projectCounts.find((p) => p.departmentId === d.id);
      return {
        id: d.id,
        name: d.name,
        slug: d.slug,
        description: d.description || '',
        color: d.accentColor,
        status: d.isActive ? 'active' : 'inactive',
        isActive: d.isActive,
        employeeCount: empC ? Number(empC.count) : 0,
        projectCount: prjC ? Number(prjC.count) : 0,
        createdAt: d.createdAt,
      };
    });
  }

  // If employee, return only assigned departments
  if (!userId) {
    return [];
  }

  const assigned = await db
    .select({
      id: departments.id,
      name: departments.name,
      slug: departments.slug,
      description: departments.description,
      color: departments.accentColor,
      isActive: departments.isActive,
      createdAt: departments.createdAt,
    })
    .from(userDepartments)
    .innerJoin(departments, eq(userDepartments.departmentId, departments.id))
    .where(and(eq(userDepartments.userId, userId), eq(departments.isActive, true)))
    .orderBy(departments.name);

  return assigned.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    description: d.description || '',
    color: d.color,
    status: d.isActive ? 'active' : 'inactive',
    isActive: d.isActive,
    createdAt: d.createdAt,
  }));
}

export async function getDepartmentById(id: string) {
  const [dept] = await db
    .select()
    .from(departments)
    .where(eq(departments.id, id))
    .limit(1);

  if (!dept) {
    throw { status: 404, message: 'Department not found' };
  }

  // Count employees and projects
  const [empCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(userDepartments)
    .where(eq(userDepartments.departmentId, id));

  const [projCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(eq(projects.departmentId, id));

  return {
    id: dept.id,
    name: dept.name,
    slug: dept.slug,
    description: dept.description || '',
    color: dept.accentColor,
    status: dept.isActive ? 'active' : 'inactive',
    isActive: dept.isActive,
    employeeCount: Number(empCount?.count || 0),
    projectCount: Number(projCount?.count || 0),
    createdAt: dept.createdAt,
  };
}

export async function createDepartment(data: {
  name: string;
  description?: string;
  slug?: string;
  color?: string;
}) {
  const cleanName = data.name.trim();
  const slug =
    data.slug?.trim().toLowerCase() ||
    cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const [existing] = await db
    .select()
    .from(departments)
    .where(eq(departments.slug, slug))
    .limit(1);

  if (existing) {
    throw { status: 409, message: 'A department with this name or slug already exists' };
  }

  const [newDept] = await db
    .insert(departments)
    .values({
      name: cleanName,
      slug,
      description: data.description?.trim() || null,
      accentColor: data.color || '#3B82F6',
      isActive: true,
    })
    .returning();

  return getDepartmentById(newDept.id);
}

export async function updateDepartment(
  id: string,
  data: {
    name?: string;
    description?: string;
    color?: string;
    slug?: string;
  }
) {
  const [existing] = await db
    .select()
    .from(departments)
    .where(eq(departments.id, id))
    .limit(1);

  if (!existing) {
    throw { status: 404, message: 'Department not found' };
  }

  const updates: any = { updatedAt: new Date() };

  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.description !== undefined) updates.description = data.description.trim();
  if (data.color !== undefined) updates.accentColor = data.color.trim();

  if (data.slug !== undefined) {
    const cleanSlug = data.slug.trim().toLowerCase();
    if (cleanSlug !== existing.slug) {
      const [conflict] = await db
        .select()
        .from(departments)
        .where(eq(departments.slug, cleanSlug))
        .limit(1);
      if (conflict) {
        throw { status: 409, message: 'Department slug already in use' };
      }
      updates.slug = cleanSlug;
    }
  }

  await db.update(departments).set(updates).where(eq(departments.id, id));
  return getDepartmentById(id);
}

export async function setDepartmentStatus(id: string, isActive: boolean) {
  const [existing] = await db
    .select()
    .from(departments)
    .where(eq(departments.id, id))
    .limit(1);

  if (!existing) {
    throw { status: 404, message: 'Department not found' };
  }

  await db
    .update(departments)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(departments.id, id));

  return getDepartmentById(id);
}

export async function deleteDepartment(id: string) {
  const [existing] = await db
    .select()
    .from(departments)
    .where(eq(departments.id, id))
    .limit(1);

  if (!existing) {
    throw { status: 404, message: 'Department not found' };
  }

  // Prevent deletion if projects or activity references exist
  const [projCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(eq(projects.departmentId, id));

  const [actCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(dailyActivities)
    .where(eq(dailyActivities.departmentId, id));

  if (Number(projCount.count) > 0 || Number(actCount.count) > 0) {
    // Safely deactivate instead of deleting
    await db
      .update(departments)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(departments.id, id));
    return {
      message: 'Department has active projects or historical records. It has been deactivated instead.',
      deactivated: true,
    };
  }

  await db.delete(departments).where(eq(departments.id, id));
  return { message: 'Department deleted successfully', deactivated: false };
}

