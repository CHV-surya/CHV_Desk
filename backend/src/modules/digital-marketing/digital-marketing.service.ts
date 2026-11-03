import { db } from '../../db/index.js';
import {
  digitalMarketingMonths,
  digitalMarketingEntries,
  projects,
  departments,
  users,
  userDepartments,
  projectAssignments,
} from '../../db/schema.js';
import { eq, and, or, sql, desc, asc, inArray } from 'drizzle-orm';
import { formatDateIST } from '../../utils/date.js';
import ExcelJS from 'exceljs';

const DM_DEPARTMENT_SLUG = 'digital-marketing';

/**
 * Month names lookup helper
 */
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

/**
 * Helper to verify user is assigned to Digital Marketing department
 */
export async function assertUserInDmDepartment(userId: string, isAdmin: boolean) {
  if (isAdmin) return true;

  const [dmDept] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(eq(departments.slug, DM_DEPARTMENT_SLUG))
    .limit(1);

  if (!dmDept) {
    throw { status: 404, message: 'Digital Marketing department not found' };
  }

  const [assigned] = await db
    .select()
    .from(userDepartments)
    .where(
      and(
        eq(userDepartments.userId, userId),
        eq(userDepartments.departmentId, dmDept.id)
      )
    )
    .limit(1);

  if (!assigned) {
    throw {
      status: 403,
      message: 'Access denied: You are not assigned to the Digital Marketing department',
    };
  }

  return true;
}

/**
 * Helper to check project ownership and access
 */
export async function assertProjectAccess(
  projectId: string,
  userId: string,
  isAdmin: boolean,
  requireWrite: boolean = false
) {
  const [row] = await db
    .select({
      id: projects.id,
      name: projects.name,
      departmentId: projects.departmentId,
      departmentName: departments.name,
      departmentSlug: departments.slug,
      createdBy: projects.createdBy,
      description: projects.description,
      status: projects.status,
    })
    .from(projects)
    .innerJoin(departments, eq(projects.departmentId, departments.id))
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!row) {
    throw { status: 404, message: 'Project not found' };
  }

  if (row.departmentSlug !== DM_DEPARTMENT_SLUG) {
    throw {
      status: 400,
      message: 'This project is not a Digital Marketing project',
    };
  }

  if (!isAdmin) {
    // 1. If user is the creator: full access
    if (row.createdBy === userId) {
      return { ...row, isOwner: true, isReadOnly: false };
    }

    // 1b. Check if user is a Manager assigned to Digital Marketing department: full access
    const [userRecord] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userRecord?.role === 'manager') {
      const [managerDept] = await db
        .select()
        .from(userDepartments)
        .where(
          and(
            eq(userDepartments.userId, userId),
            eq(userDepartments.departmentId, row.departmentId)
          )
        )
        .limit(1);

      if (managerDept) {
        return { ...row, isOwner: true, isReadOnly: false };
      }
    }

    // 2. Check if user is an assigned Video Editor (read-only reference)
    const [assignment] = await db
      .select()
      .from(projectAssignments)
      .where(
        and(
          eq(projectAssignments.projectId, projectId),
          eq(projectAssignments.userId, userId)
        )
      )
      .limit(1);

    if (!assignment) {
      throw {
        status: 403,
        message: 'Access denied: You do not have access to this Digital Marketing project',
      };
    }

    // Editors have read-only reference access: they cannot modify targets or entries
    if (requireWrite) {
      throw {
        status: 403,
        message:
          'Access denied: Assigned Video Editors have read-only reference access and cannot modify targets or entries',
      };
    }

    return { ...row, isOwner: false, isReadOnly: true, role: assignment.role };
  }

  return { ...row, isOwner: true, isReadOnly: false };
}

/**
 * Helper to check month record access
 */
export async function assertMonthAccess(
  monthId: string,
  userId: string,
  isAdmin: boolean,
  requireWrite: boolean = false
) {
  const [month] = await db
    .select()
    .from(digitalMarketingMonths)
    .where(eq(digitalMarketingMonths.id, monthId))
    .limit(1);

  if (!month) {
    throw { status: 404, message: 'Monthly reporting record not found' };
  }

  const project = await assertProjectAccess(month.projectId, userId, isAdmin, requireWrite);

  return { month, project };
}

/**
 * Helper to check entry access
 */
export async function assertEntryAccess(
  entryId: string,
  userId: string,
  isAdmin: boolean,
  requireWrite: boolean = false
) {
  const [entry] = await db
    .select()
    .from(digitalMarketingEntries)
    .where(eq(digitalMarketingEntries.id, entryId))
    .limit(1);

  if (!entry) {
    throw { status: 404, message: 'Entry not found' };
  }

  const { month, project } = await assertMonthAccess(
    entry.monthlyRecordId,
    userId,
    isAdmin,
    requireWrite
  );

  return { entry, month, project };
}

/**
 * 1. List Digital Marketing projects authorized for user
 */
export async function listDmProjects(userId: string, isAdmin: boolean) {
  const [dmDept] = await db
    .select()
    .from(departments)
    .where(eq(departments.slug, DM_DEPARTMENT_SLUG))
    .limit(1);

  if (!dmDept) {
    return [];
  }

  const conditions = [eq(projects.departmentId, dmDept.id)];

  let assignedProjectIds: string[] = [];
  if (!isAdmin) {
    const [userRecord] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const isDmManager =
      userRecord?.role === 'manager' &&
      (await db
        .select()
        .from(userDepartments)
        .where(
          and(
            eq(userDepartments.userId, userId),
            eq(userDepartments.departmentId, dmDept.id)
          )
        )
        .limit(1)
        .then((r) => r.length > 0));

    if (!isDmManager) {
      // Check projects user created, OR projects where user is assigned
      const userAssignments = await db
        .select({ projectId: projectAssignments.projectId })
        .from(projectAssignments)
        .where(eq(projectAssignments.userId, userId));
      assignedProjectIds = userAssignments.map((a) => a.projectId);

      if (assignedProjectIds.length > 0) {
        conditions.push(
          or(
            eq(projects.createdBy, userId),
            inArray(projects.id, assignedProjectIds)!
          )!
        );
      } else {
        conditions.push(eq(projects.createdBy, userId));
      }
    }
  }

  const rows = await db
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
    })
    .from(projects)
    .innerJoin(departments, eq(projects.departmentId, departments.id))
    .leftJoin(users, eq(projects.createdBy, users.id))
    .where(and(...conditions))
    .orderBy(desc(projects.createdAt));

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
    createdBy: r.createdBy || '',
    createdByName: r.createdByName || 'Admin',
    description: r.description || '',
    status: r.status,
    createdAt: formatDateIST(r.createdAt) || '',
    isAssigned: !isAdmin && r.createdBy !== userId && assignedProjectIds.includes(r.id),
    assignedEditors: assignmentsByProject.get(r.id) || [],
  }));
}

/**
 * 2. List all saved months for a project
 */
export async function listProjectMonths(
  projectId: string,
  userId: string,
  isAdmin: boolean
) {
  await assertProjectAccess(projectId, userId, isAdmin);

  const months = await db
    .select()
    .from(digitalMarketingMonths)
    .where(eq(digitalMarketingMonths.projectId, projectId))
    .orderBy(desc(digitalMarketingMonths.year), desc(digitalMarketingMonths.month));

  return months.map((m) => ({
    id: m.id,
    projectId: m.projectId,
    month: m.month,
    year: m.year,
    monthName: MONTH_NAMES[m.month - 1] || `Month ${m.month}`,
    videoTarget: m.videoTarget,
    posterTarget: m.posterTarget,
    createdAt: formatDateIST(m.createdAt) || '',
    updatedAt: formatDateIST(m.updatedAt) || '',
  }));
}

/**
 * 3. Get or ensure monthly record for a project
 */
export async function getOrCreateProjectMonth(
  projectId: string,
  year: number,
  month: number,
  userId: string,
  isAdmin: boolean
) {
  const project = await assertProjectAccess(projectId, userId, isAdmin);

  // Check if month record exists
  let [record] = await db
    .select()
    .from(digitalMarketingMonths)
    .where(
      and(
        eq(digitalMarketingMonths.projectId, projectId),
        eq(digitalMarketingMonths.year, year),
        eq(digitalMarketingMonths.month, month)
      )
    )
    .limit(1);

  // If not, auto-create clean baseline for this month
  if (!record) {
    const [inserted] = await db
      .insert(digitalMarketingMonths)
      .values({
        projectId,
        year,
        month,
        videoTarget: 0,
        posterTarget: 0,
        createdBy: userId,
      })
      .returning();
    record = inserted;
  }

  // Fetch all entries for this month
  const entries = await db
    .select()
    .from(digitalMarketingEntries)
    .where(eq(digitalMarketingEntries.monthlyRecordId, record.id))
    .orderBy(asc(digitalMarketingEntries.createdAt));

  const videoEntries = entries.filter((e) => e.contentType === 'video');
  const posterEntries = entries.filter((e) => e.contentType === 'poster');

  // Completed logic: scheduled === true OR (videoShoot && editing && clientConfirmation && scheduled)
  const videosCompleted = videoEntries.filter((e) => e.scheduled === true).length;
  const postersCompleted = posterEntries.filter((e) => e.scheduled === true).length;

  const videoProgress =
    record.videoTarget > 0
      ? Math.min(100, Math.round((videoEntries.length / record.videoTarget) * 100))
      : 0;

  const posterProgress =
    record.posterTarget > 0
      ? Math.min(100, Math.round((posterEntries.length / record.posterTarget) * 100))
      : 0;

  // Fetch assigned editors for this project
  const assignedEditors = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      username: users.username,
      email: users.email,
    })
    .from(projectAssignments)
    .innerJoin(users, eq(projectAssignments.userId, users.id))
    .where(eq(projectAssignments.projectId, projectId));

  return {
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      createdBy: project.createdBy,
      isOwner: isAdmin || project.createdBy === userId,
      isReadOnly: !isAdmin && project.createdBy !== userId,
      isAssigned: !isAdmin && project.createdBy !== userId,
      assignedEditors,
    },
    monthRecord: {
      id: record.id,
      projectId: record.projectId,
      month: record.month,
      year: record.year,
      monthName: MONTH_NAMES[record.month - 1] || `Month ${record.month}`,
      videoTarget: record.videoTarget,
      posterTarget: record.posterTarget,
      createdAt: formatDateIST(record.createdAt) || '',
      updatedAt: formatDateIST(record.updatedAt) || '',
    },
    stats: {
      videoTarget: record.videoTarget,
      videosAdded: videoEntries.length,
      videosCompleted,
      videoProgress,
      posterTarget: record.posterTarget,
      postersAdded: posterEntries.length,
      postersCompleted,
      posterProgress,
    },
    entries: entries.map((e) => ({
      id: e.id,
      monthlyRecordId: e.monthlyRecordId,
      contentType: e.contentType,
      contentName: e.contentName,
      videoShoot: e.videoShoot,
      editing: e.editing,
      clientConfirmation: e.clientConfirmation,
      scheduled: e.scheduled,
      budget: e.budget !== null && e.budget !== undefined ? Number(e.budget) : null,
      scheduledDate: e.scheduledDate,
      adCampaignReportUrl: e.adCampaignReportUrl,
      createdAt: formatDateIST(e.createdAt) || '',
      updatedAt: formatDateIST(e.updatedAt) || '',
    })),
  };
}

/**
 * 4. Update monthly targets
 */
export async function updateMonthlyTargets(
  monthId: string,
  targets: { videoTarget?: number; posterTarget?: number },
  userId: string,
  isAdmin: boolean
) {
  const { month } = await assertMonthAccess(monthId, userId, isAdmin, true);

  const updates: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (targets.videoTarget !== undefined) {
    updates.videoTarget = Math.max(0, targets.videoTarget);
  }
  if (targets.posterTarget !== undefined) {
    updates.posterTarget = Math.max(0, targets.posterTarget);
  }

  const [updated] = await db
    .update(digitalMarketingMonths)
    .set(updates)
    .where(eq(digitalMarketingMonths.id, monthId))
    .returning();

  return {
    id: updated.id,
    videoTarget: updated.videoTarget,
    posterTarget: updated.posterTarget,
    month: updated.month,
    year: updated.year,
  };
}

/**
 * 5. Get entries for a month
 */
export async function getMonthEntries(
  monthId: string,
  contentType?: 'video' | 'poster',
  userId?: string,
  isAdmin: boolean = false
) {
  if (userId) {
    await assertMonthAccess(monthId, userId, isAdmin);
  }

  const conditions = [eq(digitalMarketingEntries.monthlyRecordId, monthId)];
  if (contentType) {
    conditions.push(eq(digitalMarketingEntries.contentType, contentType));
  }

  const rows = await db
    .select()
    .from(digitalMarketingEntries)
    .where(and(...conditions))
    .orderBy(asc(digitalMarketingEntries.createdAt));

  return rows.map((e) => ({
    id: e.id,
    monthlyRecordId: e.monthlyRecordId,
    contentType: e.contentType,
    contentName: e.contentName,
    videoShoot: e.videoShoot,
    editing: e.editing,
    clientConfirmation: e.clientConfirmation,
    scheduled: e.scheduled,
    budget: e.budget !== null && e.budget !== undefined ? Number(e.budget) : null,
    scheduledDate: e.scheduledDate,
    adCampaignReportUrl: e.adCampaignReportUrl,
    createdAt: formatDateIST(e.createdAt) || '',
    updatedAt: formatDateIST(e.updatedAt) || '',
  }));
}

/**
 * 6. Add new entry (Video or Poster)
 */
export async function addEntry(
  monthId: string,
  data: {
    contentType: 'video' | 'poster';
    contentName: string;
    videoShoot?: boolean | null;
    editing?: boolean | null;
    clientConfirmation?: boolean | null;
    scheduled?: boolean | null;
    budget?: number | string | null;
    scheduledDate?: string | null;
    adCampaignReportUrl?: string | null;
  },
  userId: string,
  isAdmin: boolean
) {
  await assertMonthAccess(monthId, userId, isAdmin, true);

  const [created] = await db
    .insert(digitalMarketingEntries)
    .values({
      monthlyRecordId: monthId,
      contentType: data.contentType,
      contentName: data.contentName.trim(),
      videoShoot: data.videoShoot !== undefined ? data.videoShoot : null,
      editing: data.editing !== undefined ? data.editing : null,
      clientConfirmation:
        data.clientConfirmation !== undefined ? data.clientConfirmation : null,
      scheduled: data.scheduled !== undefined ? data.scheduled : null,
      budget:
        data.budget !== undefined && data.budget !== null && data.budget !== ''
          ? String(data.budget)
          : null,
      scheduledDate: data.scheduledDate ? data.scheduledDate : null,
      adCampaignReportUrl: data.adCampaignReportUrl
        ? data.adCampaignReportUrl.trim()
        : null,
    })
    .returning();

  return {
    id: created.id,
    monthlyRecordId: created.monthlyRecordId,
    contentType: created.contentType,
    contentName: created.contentName,
    videoShoot: created.videoShoot,
    editing: created.editing,
    clientConfirmation: created.clientConfirmation,
    scheduled: created.scheduled,
    budget:
      created.budget !== null && created.budget !== undefined
        ? Number(created.budget)
        : null,
    scheduledDate: created.scheduledDate,
    adCampaignReportUrl: created.adCampaignReportUrl,
    createdAt: formatDateIST(created.createdAt) || '',
    updatedAt: formatDateIST(created.updatedAt) || '',
  };
}

/**
 * 7. Update an entry
 */
export async function updateEntry(
  entryId: string,
  data: {
    contentName?: string;
    videoShoot?: boolean | null;
    editing?: boolean | null;
    clientConfirmation?: boolean | null;
    scheduled?: boolean | null;
    budget?: number | string | null;
    scheduledDate?: string | null;
    adCampaignReportUrl?: string | null;
  },
  userId: string,
  isAdmin: boolean
) {
  await assertEntryAccess(entryId, userId, isAdmin, true);

  const updates: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (data.contentName !== undefined) {
    updates.contentName = data.contentName.trim();
  }
  if (data.videoShoot !== undefined) {
    updates.videoShoot = data.videoShoot;
  }
  if (data.editing !== undefined) {
    updates.editing = data.editing;
  }
  if (data.clientConfirmation !== undefined) {
    updates.clientConfirmation = data.clientConfirmation;
  }
  if (data.scheduled !== undefined) {
    updates.scheduled = data.scheduled;
  }
  if (data.budget !== undefined) {
    updates.budget =
      data.budget !== null && data.budget !== '' ? String(data.budget) : null;
  }
  if (data.scheduledDate !== undefined) {
    updates.scheduledDate = data.scheduledDate || null;
  }
  if (data.adCampaignReportUrl !== undefined) {
    updates.adCampaignReportUrl = data.adCampaignReportUrl
      ? data.adCampaignReportUrl.trim()
      : null;
  }

  const [updated] = await db
    .update(digitalMarketingEntries)
    .set(updates)
    .where(eq(digitalMarketingEntries.id, entryId))
    .returning();

  return {
    id: updated.id,
    monthlyRecordId: updated.monthlyRecordId,
    contentType: updated.contentType,
    contentName: updated.contentName,
    videoShoot: updated.videoShoot,
    editing: updated.editing,
    clientConfirmation: updated.clientConfirmation,
    scheduled: updated.scheduled,
    budget:
      updated.budget !== null && updated.budget !== undefined
        ? Number(updated.budget)
        : null,
    scheduledDate: updated.scheduledDate,
    adCampaignReportUrl: updated.adCampaignReportUrl,
    createdAt: formatDateIST(updated.createdAt) || '',
    updatedAt: formatDateIST(updated.updatedAt) || '',
  };
}

/**
 * 8. Delete an entry
 */
export async function deleteEntry(
  entryId: string,
  userId: string,
  isAdmin: boolean
) {
  await assertEntryAccess(entryId, userId, isAdmin, true);

  await db
    .delete(digitalMarketingEntries)
    .where(eq(digitalMarketingEntries.id, entryId));

  return { success: true, message: 'Entry deleted successfully' };
}

/**
 * 9. Export Monthly Report to Excel Workbook
 */
export async function exportMonthlyReportToExcel(
  monthId: string,
  userId: string,
  isAdmin: boolean
): Promise<{ buffer: Buffer; fileName: string; projectName: string }> {
  const { month, project } = await assertMonthAccess(monthId, userId, isAdmin);

  const entries = await db
    .select()
    .from(digitalMarketingEntries)
    .where(eq(digitalMarketingEntries.monthlyRecordId, monthId))
    .orderBy(asc(digitalMarketingEntries.createdAt));

  const videoEntries = entries.filter((e) => e.contentType === 'video');
  const posterEntries = entries.filter((e) => e.contentType === 'poster');

  const monthName = MONTH_NAMES[month.month - 1] || `Month ${month.month}`;
  const fileName = `${project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${monthName}_${month.year}_Report.xlsx`;

  // Create Excel Workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'WorkTrack';
  workbook.lastModifiedBy = 'WorkTrack Digital Marketing System';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet(`${monthName} ${month.year}`, {
    views: [{ showGridLines: true }],
  });

  // Column definitions & widths
  worksheet.columns = [
    { key: 'col1', width: 34 }, // Video Content / Poster Content
    { key: 'col2', width: 16 }, // Video Shoot
    { key: 'col3', width: 16 }, // Editing
    { key: 'col4', width: 22 }, // Client Confirmation
    { key: 'col5', width: 16 }, // Scheduled
    { key: 'col6', width: 18 }, // Budget
    { key: 'col7', width: 16 }, // Date
    { key: 'col8', width: 36 }, // Ad Campaign Report
  ];

  // Helper colors
  const ORANGE_HEADER_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE65100' }, // Dark Orange / Brand Section Header
  };

  const ORANGE_SUBHEADER_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF97316' }, // Vibrant Orange Table Header
  };

  const TITLE_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' }, // Slate-900 / Dark Navy
  };

  const STATS_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF8FAFC' }, // Light slate
  };

  const THIN_BORDER: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  };

  const BOLD_BORDER: Partial<ExcelJS.Borders> = {
    top: { style: 'medium', color: { argb: 'FF94A3B8' } },
    left: { style: 'medium', color: { argb: 'FF94A3B8' } },
    bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
    right: { style: 'medium', color: { argb: 'FF94A3B8' } },
  };

  // Helper to format boolean to YES / NO
  const formatYesNo = (val: boolean | null | undefined): string => {
    if (val === true) return 'YES';
    if (val === false) return 'NO';
    return '-';
  };

  // Helper to format currency in Indian Rupees
  const formatBudget = (val: number | string | null | undefined): string => {
    if (val !== null && val !== undefined && val !== '') {
      const num = Number(val);
      if (!isNaN(num)) {
        return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
      }
    }
    return '-';
  };

  let currentRowIdx = 1;

  // 1. Title Banner
  worksheet.mergeCells(`A${currentRowIdx}:H${currentRowIdx}`);
  const titleCell = worksheet.getCell(`A${currentRowIdx}`);
  titleCell.value = `WORKTRACK — DIGITAL MARKETING MONTHLY REPORT`;
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = TITLE_FILL;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(currentRowIdx).height = 36;
  currentRowIdx++;

  // 2. Project & Month Meta Info
  worksheet.mergeCells(`A${currentRowIdx}:D${currentRowIdx}`);
  const projectCell = worksheet.getCell(`A${currentRowIdx}`);
  projectCell.value = `Project: ${project.name}`;
  projectCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  projectCell.alignment = { horizontal: 'left', vertical: 'middle' };

  worksheet.mergeCells(`E${currentRowIdx}:H${currentRowIdx}`);
  const monthCell = worksheet.getCell(`E${currentRowIdx}`);
  monthCell.value = `Reporting Period: ${monthName} ${month.year}`;
  monthCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  monthCell.alignment = { horizontal: 'right', vertical: 'middle' };
  worksheet.getRow(currentRowIdx).height = 24;
  currentRowIdx++;

  // 3. Targets Summary Row
  worksheet.mergeCells(`A${currentRowIdx}:D${currentRowIdx}`);
  const videoTargetCell = worksheet.getCell(`A${currentRowIdx}`);
  videoTargetCell.value = `Video Target: ${month.videoTarget} | Added: ${videoEntries.length} | Progress: ${
    month.videoTarget > 0 ? Math.round((videoEntries.length / month.videoTarget) * 100) : 0
  }%`;
  videoTargetCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF2563EB' } };
  videoTargetCell.fill = STATS_FILL;
  videoTargetCell.alignment = { horizontal: 'left', vertical: 'middle' };

  worksheet.mergeCells(`E${currentRowIdx}:H${currentRowIdx}`);
  const posterTargetCell = worksheet.getCell(`E${currentRowIdx}`);
  posterTargetCell.value = `Poster Target: ${month.posterTarget} | Added: ${posterEntries.length} | Progress: ${
    month.posterTarget > 0 ? Math.round((posterEntries.length / month.posterTarget) * 100) : 0
  }%`;
  posterTargetCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF10B981' } };
  posterTargetCell.fill = STATS_FILL;
  posterTargetCell.alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(currentRowIdx).height = 24;
  currentRowIdx++;

  // Empty separator row
  currentRowIdx++;

  // ==========================================
  // SECTION 1: VIDEOS
  // ==========================================
  worksheet.mergeCells(`A${currentRowIdx}:H${currentRowIdx}`);
  const videoSectionCell = worksheet.getCell(`A${currentRowIdx}`);
  videoSectionCell.value = `VIDEOS`;
  videoSectionCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  videoSectionCell.fill = ORANGE_HEADER_FILL;
  videoSectionCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(currentRowIdx).height = 30;
  currentRowIdx++;

  // Column Headers for Videos
  const videoHeaders = [
    'Video Content',
    'Video Shoot',
    'Editing',
    'Client Confirmation',
    'Scheduled',
    'Budget',
    'Date',
    'Ad Campaign Report',
  ];

  const headerRow = worksheet.getRow(currentRowIdx);
  videoHeaders.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = ORANGE_SUBHEADER_FILL;
    cell.alignment = {
      horizontal: idx === 0 || idx === 7 ? 'left' : 'center',
      vertical: 'middle',
    };
    cell.border = BOLD_BORDER;
  });
  headerRow.height = 26;
  currentRowIdx++;

  // Video Data Rows
  if (videoEntries.length === 0) {
    worksheet.mergeCells(`A${currentRowIdx}:H${currentRowIdx}`);
    const emptyCell = worksheet.getCell(`A${currentRowIdx}`);
    emptyCell.value = 'No video entries recorded for this month.';
    emptyCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
    emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    emptyCell.border = THIN_BORDER;
    worksheet.getRow(currentRowIdx).height = 24;
    currentRowIdx++;
  } else {
    videoEntries.forEach((entry) => {
      const row = worksheet.getRow(currentRowIdx);
      row.getCell(1).value = entry.contentName;
      row.getCell(2).value = formatYesNo(entry.videoShoot);
      row.getCell(3).value = formatYesNo(entry.editing);
      row.getCell(4).value = formatYesNo(entry.clientConfirmation);
      row.getCell(5).value = formatYesNo(entry.scheduled);
      row.getCell(6).value = formatBudget(entry.budget);
      row.getCell(7).value = entry.scheduledDate || '-';

      // Report URL (Clickable hyperlink)
      const reportCell = row.getCell(8);
      if (entry.adCampaignReportUrl && entry.adCampaignReportUrl.startsWith('http')) {
        reportCell.value = {
          text: entry.adCampaignReportUrl,
          hyperlink: entry.adCampaignReportUrl,
          tooltip: 'Open Campaign Report',
        };
        reportCell.font = { name: 'Arial', size: 10, color: { argb: 'FF2563EB' }, underline: true };
      } else {
        reportCell.value = entry.adCampaignReportUrl || '-';
        reportCell.font = { name: 'Arial', size: 10 };
      }

      // Styles & borders
      for (let c = 1; c <= 8; c++) {
        const cell = row.getCell(c);
        if (c !== 8 || !entry.adCampaignReportUrl?.startsWith('http')) {
          cell.font = { name: 'Arial', size: 10 };
        }
        cell.alignment = {
          horizontal: c === 1 || c === 8 ? 'left' : 'center',
          vertical: 'middle',
        };
        cell.border = THIN_BORDER;

        // Color coding for YES / NO
        if (c >= 2 && c <= 5) {
          const val = cell.value?.toString();
          if (val === 'YES') {
            cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF15803D' } }; // Green
          } else if (val === 'NO') {
            cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFB91C1C' } }; // Red
          }
        }
      }
      row.height = 22;
      currentRowIdx++;
    });
  }

  // Blank separator between sections
  currentRowIdx++;

  // ==========================================
  // SECTION 2: POSTERS
  // ==========================================
  worksheet.mergeCells(`A${currentRowIdx}:H${currentRowIdx}`);
  const posterSectionCell = worksheet.getCell(`A${currentRowIdx}`);
  posterSectionCell.value = `POSTERS`;
  posterSectionCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  posterSectionCell.fill = ORANGE_HEADER_FILL;
  posterSectionCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(currentRowIdx).height = 30;
  currentRowIdx++;

  // Headers for Posters (Exact column order: Poster Content, Video Shoot, Editing, Client Confirmation, Scheduled, Budget, Date, Ad Campaign Report)
  const posterHeaders = [
    'Poster Content',
    'Video Shoot',
    'Editing',
    'Client Confirmation',
    'Scheduled',
    'Budget',
    'Date',
    'Ad Campaign Report',
  ];

  const posterHeaderRow = worksheet.getRow(currentRowIdx);
  posterHeaders.forEach((h, idx) => {
    const cell = posterHeaderRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = ORANGE_SUBHEADER_FILL;
    cell.alignment = {
      horizontal: idx === 0 || idx === 7 ? 'left' : 'center',
      vertical: 'middle',
    };
    cell.border = BOLD_BORDER;
  });
  posterHeaderRow.height = 26;
  currentRowIdx++;

  // Poster Data Rows
  if (posterEntries.length === 0) {
    worksheet.mergeCells(`A${currentRowIdx}:H${currentRowIdx}`);
    const emptyCell = worksheet.getCell(`A${currentRowIdx}`);
    emptyCell.value = 'No poster entries recorded for this month.';
    emptyCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
    emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    emptyCell.border = THIN_BORDER;
    worksheet.getRow(currentRowIdx).height = 24;
    currentRowIdx++;
  } else {
    posterEntries.forEach((entry) => {
      const row = worksheet.getRow(currentRowIdx);
      row.getCell(1).value = entry.contentName;
      row.getCell(2).value = formatYesNo(entry.videoShoot);
      row.getCell(3).value = formatYesNo(entry.editing);
      row.getCell(4).value = formatYesNo(entry.clientConfirmation);
      row.getCell(5).value = formatYesNo(entry.scheduled);
      row.getCell(6).value = formatBudget(entry.budget);
      row.getCell(7).value = entry.scheduledDate || '-';

      // Report URL
      const reportCell = row.getCell(8);
      if (entry.adCampaignReportUrl && entry.adCampaignReportUrl.startsWith('http')) {
        reportCell.value = {
          text: entry.adCampaignReportUrl,
          hyperlink: entry.adCampaignReportUrl,
          tooltip: 'Open Campaign Report',
        };
        reportCell.font = { name: 'Arial', size: 10, color: { argb: 'FF2563EB' }, underline: true };
      } else {
        reportCell.value = entry.adCampaignReportUrl || '-';
        reportCell.font = { name: 'Arial', size: 10 };
      }

      // Styles & borders
      for (let c = 1; c <= 8; c++) {
        const cell = row.getCell(c);
        if (c !== 8 || !entry.adCampaignReportUrl?.startsWith('http')) {
          cell.font = { name: 'Arial', size: 10 };
        }
        cell.alignment = {
          horizontal: c === 1 || c === 8 ? 'left' : 'center',
          vertical: 'middle',
        };
        cell.border = THIN_BORDER;

        // Color coding for YES / NO
        if (c >= 2 && c <= 5) {
          const val = cell.value?.toString();
          if (val === 'YES') {
            cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF15803D' } };
          } else if (val === 'NO') {
            cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFB91C1C' } };
          }
        }
      }
      row.height = 22;
      currentRowIdx++;
    });
  }

  // Generate Buffer
  const buffer = await workbook.xlsx.writeBuffer();

  return {
    buffer: Buffer.from(buffer),
    fileName,
    projectName: project.name,
  };
}

/**
 * 10. List active employees from the Video Editor department
 */
export async function listAssignableVideoEditors(userId: string, isAdmin: boolean) {
  const [editorDept] = await db
    .select()
    .from(departments)
    .where(eq(departments.slug, 'video-editor'))
    .limit(1);

  if (!editorDept) {
    return [];
  }

  const rows = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      username: users.username,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .innerJoin(userDepartments, eq(users.id, userDepartments.userId))
    .where(
      and(
        eq(userDepartments.departmentId, editorDept.id),
        eq(users.isActive, true)
      )
    );

  return rows;
}

/**
 * 11. Get current assigned editors for a project
 */
export async function getProjectAssignments(
  projectId: string,
  userId: string,
  isAdmin: boolean
) {
  await assertProjectAccess(projectId, userId, isAdmin, false);

  const assignments = await db
    .select({
      id: projectAssignments.id,
      userId: users.id,
      fullName: users.fullName,
      username: users.username,
      email: users.email,
      role: projectAssignments.role,
      assignedAt: projectAssignments.assignedAt,
    })
    .from(projectAssignments)
    .innerJoin(users, eq(projectAssignments.userId, users.id))
    .where(eq(projectAssignments.projectId, projectId));

  return assignments.map((a) => ({
    id: a.id,
    userId: a.userId,
    fullName: a.fullName,
    username: a.username,
    email: a.email,
    role: a.role,
    assignedAt: formatDateIST(a.assignedAt) || '',
  }));
}

/**
 * 12. Set / update assigned editors for a project
 */
export async function setProjectAssignments(
  projectId: string,
  userIds: string[],
  userId: string,
  isAdmin: boolean
) {
  // Only project creator or admin can manage assignments
  await assertProjectAccess(projectId, userId, isAdmin, true);

  if (userIds.length > 0) {
    const [editorDept] = await db
      .select()
      .from(departments)
      .where(eq(departments.slug, 'video-editor'))
      .limit(1);

    if (!editorDept) {
      throw { status: 400, message: 'Video Editor department not found' };
    }

    const validEditors = await db
      .select({ userId: userDepartments.userId })
      .from(userDepartments)
      .where(
        and(
          eq(userDepartments.departmentId, editorDept.id),
          inArray(userDepartments.userId, userIds)
        )
      );

    const validUserIds = new Set(validEditors.map((v) => v.userId));
    for (const uid of userIds) {
      if (!validUserIds.has(uid)) {
        throw {
          status: 400,
          message: `User ${uid} is not assigned to the Video Editor department`,
        };
      }
    }
  }

  // Current assignments in database
  const currentAssignments = await db
    .select({ userId: projectAssignments.userId })
    .from(projectAssignments)
    .where(eq(projectAssignments.projectId, projectId));

  const currentUserIds = new Set(currentAssignments.map((a) => a.userId));
  const targetUserIds = new Set(userIds);

  // Remove unselected assignments
  for (const currentUid of currentUserIds) {
    if (!targetUserIds.has(currentUid)) {
      await db
        .delete(projectAssignments)
        .where(
          and(
            eq(projectAssignments.projectId, projectId),
            eq(projectAssignments.userId, currentUid)
          )
        );
    }
  }

  // Add new assignments
  for (const targetUid of targetUserIds) {
    if (!currentUserIds.has(targetUid)) {
      await db.insert(projectAssignments).values({
        projectId,
        userId: targetUid,
        assignedBy: userId,
        role: 'viewer', // Read-only reference access
      });
    }
  }

  return getProjectAssignments(projectId, userId, isAdmin);
}

