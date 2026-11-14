import { db } from '../../db/index.js';
import {
  bdaCustomers,
  projects,
  departments,
  users,
  userDepartments,
  type BdaCustomer,
} from '../../db/schema.js';
import { eq, and, or, sql, desc, asc, inArray, ilike } from 'drizzle-orm';
import ExcelJS from 'exceljs';

export const BDA_DEPARTMENT_SLUG = 'bda';

export const BDA_STATUSES = [
  'New',
  'Pending',
  'Interested',
  'Quotation Sent',
  'Call Back Requested',
  'In Discussion',
  'Converted',
  'Not Interested',
] as const;

export type BdaStatus = (typeof BDA_STATUSES)[number];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Verifies if user has permission to access BDA department
 * Admin has full access. Employees and managers must be assigned to BDA department.
 */
export async function assertUserInBdaDepartment(userId: string, isAdmin: boolean) {
  if (isAdmin) return true;

  const [bdaDept] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(eq(departments.slug, BDA_DEPARTMENT_SLUG))
    .limit(1);

  if (!bdaDept) {
    throw { status: 404, message: 'BDA department not found' };
  }

  const [assigned] = await db
    .select()
    .from(userDepartments)
    .where(
      and(
        eq(userDepartments.userId, userId),
        eq(userDepartments.departmentId, bdaDept.id)
      )
    )
    .limit(1);

  if (!assigned) {
    throw { status: 403, message: 'Forbidden: You do not have access to the BDA department workspace' };
  }

  return true;
}

/**
 * Helper to check if a user can modify/delete a specific customer record
 */
export function canUserManageCustomer(
  user: { id: string; role: string },
  customer: { createdBy: string }
) {
  if (user.role === 'admin' || user.role === 'manager') return true;
  return customer.createdBy === user.id;
}

/**
 * Summary statistics for BDA Dashboard
 */
export async function getBdaSummary(userId: string, userRole: string) {
  await assertUserInBdaDepartment(userId, userRole === 'admin');

  const [row] = await db
    .select({
      total: sql<number>`count(*)`,
      newCount: sql<number>`count(*) filter (where ${bdaCustomers.followUpStatus} = 'New')`,
      pendingCount: sql<number>`count(*) filter (where ${bdaCustomers.followUpStatus} in ('Pending', 'Call Back Requested'))`,
      interestedCount: sql<number>`count(*) filter (where ${bdaCustomers.followUpStatus} = 'Interested')`,
      quotationSentCount: sql<number>`count(*) filter (where ${bdaCustomers.followUpStatus} = 'Quotation Sent')`,
      convertedCount: sql<number>`count(*) filter (where ${bdaCustomers.followUpStatus} = 'Converted')`,
      notInterestedCount: sql<number>`count(*) filter (where ${bdaCustomers.followUpStatus} = 'Not Interested')`,
      inDiscussionCount: sql<number>`count(*) filter (where ${bdaCustomers.followUpStatus} = 'In Discussion')`,
    })
    .from(bdaCustomers);

  return {
    total: Number(row?.total || 0),
    newEnquiries: Number(row?.newCount || 0),
    pendingFollowUps: Number(row?.pendingCount || 0),
    interested: Number(row?.interestedCount || 0),
    quotationsSent: Number(row?.quotationSentCount || 0),
    converted: Number(row?.convertedCount || 0),
    notInterested: Number(row?.notInterestedCount || 0),
    inDiscussion: Number(row?.inDiscussionCount || 0),
  };
}

/**
 * Search active projects across all departments for cross-linking
 */
export async function searchProjects(query?: string) {
  const conditions = [eq(projects.status, 'active')];

  if (query && query.trim()) {
    conditions.push(ilike(projects.name, `%${query.trim()}%`));
  }

  const results = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      departmentId: projects.departmentId,
      departmentName: departments.name,
      departmentSlug: departments.slug,
    })
    .from(projects)
    .innerJoin(departments, eq(projects.departmentId, departments.id))
    .where(and(...conditions))
    .orderBy(asc(projects.name))
    .limit(50);

  return results;
}

export interface ListCustomersParams {
  search?: string;
  status?: string;
  projectId?: string;
  departmentId?: string;
  leadSource?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * List customer enquiries with filters, search, and pagination
 */
export async function listCustomers(
  userId: string,
  userRole: string,
  params: ListCustomersParams
) {
  await assertUserInBdaDepartment(userId, userRole === 'admin');

  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
  const offset = (page - 1) * limit;

  const conditions = [];

  // Search keyword across name, company, phone, email, software, and project name
  if (params.search && params.search.trim()) {
    const term = `%${params.search.trim()}%`;
    conditions.push(
      or(
        ilike(bdaCustomers.customerName, term),
        ilike(bdaCustomers.companyName, term),
        ilike(bdaCustomers.phoneNumber, term),
        ilike(bdaCustomers.email, term),
        ilike(bdaCustomers.requiredSoftware, term),
        ilike(projects.name, term)
      )
    );
  }

  // Filter by Follow-up status
  if (params.status && params.status !== 'all') {
    conditions.push(eq(bdaCustomers.followUpStatus, params.status));
  }

  // Filter by associated project
  if (params.projectId && params.projectId !== 'all') {
    conditions.push(eq(bdaCustomers.projectId, params.projectId));
  }

  // Filter by department of project
  if (params.departmentId && params.departmentId !== 'all') {
    conditions.push(eq(projects.departmentId, params.departmentId));
  }

  // Filter by lead source
  if (params.leadSource && params.leadSource !== 'all') {
    conditions.push(eq(bdaCustomers.leadSource, params.leadSource));
  }

  // Date range filters (enquiryDate)
  if (params.startDate) {
    conditions.push(sql`${bdaCustomers.enquiryDate} >= ${params.startDate}`);
  }
  if (params.endDate) {
    conditions.push(sql`${bdaCustomers.enquiryDate} <= ${params.endDate}`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Sorting
  const sortDirection = params.sortOrder === 'asc' ? asc : desc;
  let orderColumn: any = bdaCustomers.enquiryDate;
  if (params.sortBy === 'customerName') orderColumn = bdaCustomers.customerName;
  else if (params.sortBy === 'companyName') orderColumn = bdaCustomers.companyName;
  else if (params.sortBy === 'followUpStatus') orderColumn = bdaCustomers.followUpStatus;
  else if (params.sortBy === 'nextFollowUpDate') orderColumn = bdaCustomers.nextFollowUpDate;
  else if (params.sortBy === 'createdAt') orderColumn = bdaCustomers.createdAt;

  // Total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bdaCustomers)
    .leftJoin(projects, eq(bdaCustomers.projectId, projects.id))
    .where(whereClause);

  const totalCount = Number(count || 0);

  // Creator & Updater aliases
  const creatorUser = db
    .select({
      id: users.id,
      fullName: users.fullName,
      username: users.username,
    })
    .from(users)
    .as('creatorUser');

  const updaterUser = db
    .select({
      id: users.id,
      fullName: users.fullName,
      username: users.username,
    })
    .from(users)
    .as('updaterUser');

  const items = await db
    .select({
      id: bdaCustomers.id,
      customerName: bdaCustomers.customerName,
      companyName: bdaCustomers.companyName,
      phoneNumber: bdaCustomers.phoneNumber,
      email: bdaCustomers.email,
      location: bdaCustomers.location,
      projectId: bdaCustomers.projectId,
      projectName: projects.name,
      projectDepartmentId: projects.departmentId,
      projectDepartmentName: departments.name,
      requiredSoftware: bdaCustomers.requiredSoftware,
      requirements: bdaCustomers.requirements,
      leadSource: bdaCustomers.leadSource,
      enquiryDate: bdaCustomers.enquiryDate,
      followUpStatus: bdaCustomers.followUpStatus,
      remarks: bdaCustomers.remarks,
      nextFollowUpDate: bdaCustomers.nextFollowUpDate,
      createdBy: bdaCustomers.createdBy,
      creatorName: creatorUser.fullName,
      creatorUsername: creatorUser.username,
      updatedBy: bdaCustomers.updatedBy,
      updaterName: updaterUser.fullName,
      updaterUsername: updaterUser.username,
      createdAt: bdaCustomers.createdAt,
      updatedAt: bdaCustomers.updatedAt,
    })
    .from(bdaCustomers)
    .leftJoin(projects, eq(bdaCustomers.projectId, projects.id))
    .leftJoin(departments, eq(projects.departmentId, departments.id))
    .leftJoin(creatorUser, eq(bdaCustomers.createdBy, creatorUser.id))
    .leftJoin(updaterUser, eq(bdaCustomers.updatedBy, updaterUser.id))
    .where(whereClause)
    .orderBy(sortDirection(orderColumn), desc(bdaCustomers.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    items,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
  };
}

/**
 * Get customer details by ID
 */
export async function getCustomerById(customerId: string, userId: string, userRole: string) {
  await assertUserInBdaDepartment(userId, userRole === 'admin');

  const creatorUser = db
    .select({ id: users.id, fullName: users.fullName, username: users.username })
    .from(users)
    .as('creatorUser');

  const updaterUser = db
    .select({ id: users.id, fullName: users.fullName, username: users.username })
    .from(users)
    .as('updaterUser');

  const [customer] = await db
    .select({
      id: bdaCustomers.id,
      customerName: bdaCustomers.customerName,
      companyName: bdaCustomers.companyName,
      phoneNumber: bdaCustomers.phoneNumber,
      email: bdaCustomers.email,
      location: bdaCustomers.location,
      projectId: bdaCustomers.projectId,
      projectName: projects.name,
      projectDepartmentId: projects.departmentId,
      projectDepartmentName: departments.name,
      requiredSoftware: bdaCustomers.requiredSoftware,
      requirements: bdaCustomers.requirements,
      leadSource: bdaCustomers.leadSource,
      enquiryDate: bdaCustomers.enquiryDate,
      followUpStatus: bdaCustomers.followUpStatus,
      remarks: bdaCustomers.remarks,
      nextFollowUpDate: bdaCustomers.nextFollowUpDate,
      createdBy: bdaCustomers.createdBy,
      creatorName: creatorUser.fullName,
      creatorUsername: creatorUser.username,
      updatedBy: bdaCustomers.updatedBy,
      updaterName: updaterUser.fullName,
      updaterUsername: updaterUser.username,
      createdAt: bdaCustomers.createdAt,
      updatedAt: bdaCustomers.updatedAt,
    })
    .from(bdaCustomers)
    .leftJoin(projects, eq(bdaCustomers.projectId, projects.id))
    .leftJoin(departments, eq(projects.departmentId, departments.id))
    .leftJoin(creatorUser, eq(bdaCustomers.createdBy, creatorUser.id))
    .leftJoin(updaterUser, eq(bdaCustomers.updatedBy, updaterUser.id))
    .where(eq(bdaCustomers.id, customerId))
    .limit(1);

  if (!customer) {
    throw { status: 404, message: 'Customer record not found' };
  }

  return customer;
}

export interface CreateCustomerInput {
  customerName: string;
  companyName?: string | null;
  phoneNumber: string;
  email?: string | null;
  location?: string | null;
  projectId?: string | null;
  requiredSoftware: string;
  requirements?: string | null;
  leadSource?: string | null;
  enquiryDate: string;
  followUpStatus?: string;
  remarks?: string | null;
  nextFollowUpDate?: string | null;
}

/**
 * Create a new customer enquiry
 */
export async function createCustomer(
  input: CreateCustomerInput,
  userId: string,
  userRole: string
) {
  await assertUserInBdaDepartment(userId, userRole === 'admin');

  // Verify project if provided
  if (input.projectId) {
    const [existingProject] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, input.projectId))
      .limit(1);

    if (!existingProject) {
      throw { status: 400, message: 'Selected project does not exist' };
    }
  }

  const [newCustomer] = await db
    .insert(bdaCustomers)
    .values({
      customerName: input.customerName.trim(),
      companyName: input.companyName?.trim() || null,
      phoneNumber: input.phoneNumber.trim(),
      email: input.email?.trim() || null,
      location: input.location?.trim() || null,
      projectId: input.projectId || null,
      requiredSoftware: input.requiredSoftware.trim(),
      requirements: input.requirements?.trim() || null,
      leadSource: input.leadSource?.trim() || null,
      enquiryDate: input.enquiryDate,
      followUpStatus: input.followUpStatus || 'New',
      remarks: input.remarks?.trim() || null,
      nextFollowUpDate: input.nextFollowUpDate || null,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return getCustomerById(newCustomer.id, userId, userRole);
}

export interface UpdateCustomerInput {
  customerName?: string;
  companyName?: string | null;
  phoneNumber?: string;
  email?: string | null;
  location?: string | null;
  projectId?: string | null;
  requiredSoftware?: string;
  requirements?: string | null;
  leadSource?: string | null;
  enquiryDate?: string;
  followUpStatus?: string;
  remarks?: string | null;
  nextFollowUpDate?: string | null;
}

/**
 * Update an existing customer enquiry
 */
export async function updateCustomer(
  customerId: string,
  input: UpdateCustomerInput,
  user: { id: string; role: string }
) {
  await assertUserInBdaDepartment(user.id, user.role === 'admin');

  const [existing] = await db
    .select()
    .from(bdaCustomers)
    .where(eq(bdaCustomers.id, customerId))
    .limit(1);

  if (!existing) {
    throw { status: 404, message: 'Customer record not found' };
  }

  if (!canUserManageCustomer(user, existing)) {
    throw { status: 403, message: 'Forbidden: You do not have permission to modify this customer record' };
  }

  if (input.projectId) {
    const [proj] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, input.projectId))
      .limit(1);

    if (!proj) {
      throw { status: 400, message: 'Selected project does not exist' };
    }
  }

  const updateData: Partial<BdaCustomer> = {
    updatedBy: user.id,
    updatedAt: new Date(),
  };

  if (input.customerName !== undefined) updateData.customerName = input.customerName.trim();
  if (input.companyName !== undefined) updateData.companyName = input.companyName ? input.companyName.trim() : null;
  if (input.phoneNumber !== undefined) updateData.phoneNumber = input.phoneNumber.trim();
  if (input.email !== undefined) updateData.email = input.email ? input.email.trim() : null;
  if (input.location !== undefined) updateData.location = input.location ? input.location.trim() : null;
  if (input.projectId !== undefined) updateData.projectId = input.projectId || null;
  if (input.requiredSoftware !== undefined) updateData.requiredSoftware = input.requiredSoftware.trim();
  if (input.requirements !== undefined) updateData.requirements = input.requirements ? input.requirements.trim() : null;
  if (input.leadSource !== undefined) updateData.leadSource = input.leadSource ? input.leadSource.trim() : null;
  if (input.enquiryDate !== undefined) updateData.enquiryDate = input.enquiryDate;
  if (input.followUpStatus !== undefined) updateData.followUpStatus = input.followUpStatus;
  if (input.remarks !== undefined) updateData.remarks = input.remarks ? input.remarks.trim() : null;
  if (input.nextFollowUpDate !== undefined) updateData.nextFollowUpDate = input.nextFollowUpDate || null;

  await db
    .update(bdaCustomers)
    .set(updateData)
    .where(eq(bdaCustomers.id, customerId));

  return getCustomerById(customerId, user.id, user.role);
}

/**
 * Delete a customer enquiry
 */
export async function deleteCustomer(
  customerId: string,
  user: { id: string; role: string }
) {
  await assertUserInBdaDepartment(user.id, user.role === 'admin');

  const [existing] = await db
    .select()
    .from(bdaCustomers)
    .where(eq(bdaCustomers.id, customerId))
    .limit(1);

  if (!existing) {
    throw { status: 404, message: 'Customer record not found' };
  }

  if (!canUserManageCustomer(user, existing)) {
    throw { status: 403, message: 'Forbidden: You do not have permission to delete this customer record' };
  }

  await db.delete(bdaCustomers).where(eq(bdaCustomers.id, customerId));

  return { success: true, message: 'Customer record deleted successfully' };
}

/**
 * Generate Excel Workbook for export
 */
export async function generateCustomersExcel(
  userId: string,
  userRole: string,
  options: {
    customerIds?: string[];
    filterParams?: ListCustomersParams;
  }
) {
  await assertUserInBdaDepartment(userId, userRole === 'admin');

  const conditions = [];

  if (options.customerIds && options.customerIds.length > 0) {
    conditions.push(inArray(bdaCustomers.id, options.customerIds));
  } else if (options.filterParams) {
    const params = options.filterParams;
    if (params.search && params.search.trim()) {
      const term = `%${params.search.trim()}%`;
      conditions.push(
        or(
          ilike(bdaCustomers.customerName, term),
          ilike(bdaCustomers.companyName, term),
          ilike(bdaCustomers.phoneNumber, term),
          ilike(bdaCustomers.email, term),
          ilike(bdaCustomers.requiredSoftware, term),
          ilike(projects.name, term)
        )
      );
    }
    if (params.status && params.status !== 'all') {
      conditions.push(eq(bdaCustomers.followUpStatus, params.status));
    }
    if (params.projectId && params.projectId !== 'all') {
      conditions.push(eq(bdaCustomers.projectId, params.projectId));
    }
    if (params.leadSource && params.leadSource !== 'all') {
      conditions.push(eq(bdaCustomers.leadSource, params.leadSource));
    }
    if (params.startDate) {
      conditions.push(sql`${bdaCustomers.enquiryDate} >= ${params.startDate}`);
    }
    if (params.endDate) {
      conditions.push(sql`${bdaCustomers.enquiryDate} <= ${params.endDate}`);
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const creatorUser = db
    .select({ id: users.id, fullName: users.fullName, username: users.username })
    .from(users)
    .as('creatorUser');

  const records = await db
    .select({
      id: bdaCustomers.id,
      customerName: bdaCustomers.customerName,
      companyName: bdaCustomers.companyName,
      phoneNumber: bdaCustomers.phoneNumber,
      email: bdaCustomers.email,
      location: bdaCustomers.location,
      projectId: bdaCustomers.projectId,
      projectName: projects.name,
      departmentName: departments.name,
      requiredSoftware: bdaCustomers.requiredSoftware,
      requirements: bdaCustomers.requirements,
      leadSource: bdaCustomers.leadSource,
      enquiryDate: bdaCustomers.enquiryDate,
      followUpStatus: bdaCustomers.followUpStatus,
      remarks: bdaCustomers.remarks,
      nextFollowUpDate: bdaCustomers.nextFollowUpDate,
      createdBy: bdaCustomers.createdBy,
      creatorName: creatorUser.fullName,
      createdAt: bdaCustomers.createdAt,
      updatedAt: bdaCustomers.updatedAt,
    })
    .from(bdaCustomers)
    .leftJoin(projects, eq(bdaCustomers.projectId, projects.id))
    .leftJoin(departments, eq(projects.departmentId, departments.id))
    .leftJoin(creatorUser, eq(bdaCustomers.createdBy, creatorUser.id))
    .where(whereClause)
    .orderBy(desc(bdaCustomers.enquiryDate), desc(bdaCustomers.createdAt));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'WorkTrack BDA Module';
  workbook.lastModifiedBy = 'WorkTrack System';
  workbook.created = new Date();
  workbook.modified = new Date();

  // 1. Data Sheet
  const sheet = workbook.addWorksheet('BDA Customer Directory', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = [
    { header: 'Record ID', key: 'id', width: 38 },
    { header: 'Customer Name', key: 'customerName', width: 26 },
    { header: 'Company Name', key: 'companyName', width: 26 },
    { header: 'Phone Number', key: 'phoneNumber', width: 20 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Location', key: 'location', width: 22 },
    { header: 'Required Software / Service', key: 'requiredSoftware', width: 30 },
    { header: 'Associated Project', key: 'projectName', width: 26 },
    { header: 'Department', key: 'departmentName', width: 20 },
    { header: 'Lead Source', key: 'leadSource', width: 18 },
    { header: 'Enquiry Date', key: 'enquiryDate', width: 16 },
    { header: 'Follow-up Status', key: 'followUpStatus', width: 22 },
    { header: 'Next Follow-up Date', key: 'nextFollowUpDate', width: 20 },
    { header: 'Remarks / Follow-up Notes', key: 'remarks', width: 40 },
    { header: 'Created By', key: 'creatorName', width: 22 },
    { header: 'Last Updated', key: 'updatedAt', width: 22 },
  ];

  // Header styling (CHVApps Navy Blue branding)
  const headerRow = sheet.getRow(1);
  headerRow.height = 32;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F2A4A' }, // Corporate Dark Navy
    };
    cell.font = {
      name: 'Segoe UI',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334E68' } },
      left: { style: 'thin', color: { argb: 'FF334E68' } },
      bottom: { style: 'medium', color: { argb: 'FF0B1D33' } },
      right: { style: 'thin', color: { argb: 'FF334E68' } },
    };
  });

  // Populate data rows
  records.forEach((rec, idx) => {
    const isEven = idx % 2 === 0;
    const row = sheet.addRow({
      id: rec.id,
      customerName: rec.customerName,
      companyName: rec.companyName || '-',
      phoneNumber: rec.phoneNumber,
      email: rec.email || '-',
      location: rec.location || '-',
      requiredSoftware: rec.requiredSoftware,
      projectName: rec.projectName || '-',
      departmentName: rec.departmentName || '-',
      leadSource: rec.leadSource || '-',
      enquiryDate: rec.enquiryDate,
      followUpStatus: rec.followUpStatus,
      nextFollowUpDate: rec.nextFollowUpDate || '-',
      remarks: rec.remarks || '-',
      creatorName: rec.creatorName || '-',
      updatedAt: rec.updatedAt ? new Date(rec.updatedAt).toISOString().split('T')[0] : '-',
    });

    row.height = 24;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1F2937' } };
      cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'center' : 'left' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
      if (isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' },
        };
      }
    });
  });

  // 2. Instructions Sheet
  const instructionsSheet = workbook.addWorksheet('Instructions');
  instructionsSheet.columns = [
    { header: 'Section', key: 'section', width: 28 },
    { header: 'Details & Instructions', key: 'details', width: 85 },
  ];

  const instHeader = instructionsSheet.getRow(1);
  instHeader.height = 30;
  instHeader.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' },
    };
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const instructions = [
    {
      section: 'PURPOSE',
      details: 'This workbook allows offline review and editing of customer enquiries. Updated files can be imported directly into WorkTrack to sync changes.',
    },
    {
      section: 'RECORD ID (CRITICAL)',
      details: 'DO NOT alter or remove Column A (Record ID). This unique UUID is used by WorkTrack to identify and update the corresponding customer in Neon PostgreSQL.',
    },
    {
      section: 'EDITABLE COLUMNS',
      details: 'You can safely edit: Phone Number, Email, Location, Required Software, Lead Source, Follow-up Status, Next Follow-up Date, and Remarks.',
    },
    {
      section: 'READ-ONLY COLUMNS',
      details: 'Record ID, Associated Project, Department, Created By, and Last Updated are managed by the system and cannot be changed through Excel import.',
    },
    {
      section: 'PERMITTED STATUSES',
      details: 'Follow-up Status must strictly match one of: New, Pending, Interested, Quotation Sent, Call Back Requested, In Discussion, Converted, Not Interested.',
    },
    {
      section: 'DATE FORMAT',
      details: 'Enter dates in YYYY-MM-DD format (e.g., 2026-11-25) for Next Follow-up Date.',
    },
    {
      section: 'HOW TO SYNC',
      details: '1. Save your changes in Excel.\n2. Open the BDA Workspace in WorkTrack.\n3. Click "Import Excel" and choose this file.\n4. Review the sync report summarizing updated, unchanged, and failed rows.',
    },
  ];

  instructions.forEach((item) => {
    const row = instructionsSheet.addRow(item);
    row.height = 32;
    row.getCell(1).font = { bold: true, name: 'Segoe UI', size: 10, color: { argb: 'FF0F2A4A' } };
    row.getCell(2).font = { name: 'Segoe UI', size: 10 };
    row.getCell(2).alignment = { wrapText: true, vertical: 'middle' };
  });

  return workbook;
}

function getCellString(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number') return String(val).trim();
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'object') {
    if (val.text) return String(val.text).trim();
    if (val.result) return getCellString(val.result);
    if (Array.isArray(val.richText)) {
      return val.richText.map((t: any) => t.text || '').join('').trim();
    }
  }
  return String(val).trim();
}

function parseDateCell(val: any): string | null {
  if (val === null || val === undefined || val === '') return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = getCellString(val);
  if (!s || s === '-') return null;
  const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }
  const dmyMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
  }
  return s;
}

export interface ImportRowResult {
  rowNumber: number;
  recordId?: string;
  customerName?: string;
  status: 'updated' | 'unchanged' | 'failed';
  message: string;
  changedFields?: string[];
}

export interface ImportSummary {
  totalRows: number;
  updatedCount: number;
  unchangedCount: number;
  failedCount: number;
  details: ImportRowResult[];
}

/**
 * Import and synchronize offline Excel customer changes with Neon PostgreSQL
 */
export async function importCustomersExcel(
  buffer: Buffer,
  user: { id: string; role: string }
): Promise<ImportSummary> {
  await assertUserInBdaDepartment(user.id, user.role === 'admin');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  // Find target sheet (prefer "BDA Customer Directory" or fallback to first sheet)
  let sheet = workbook.getWorksheet('BDA Customer Directory');
  if (!sheet) {
    sheet = workbook.worksheets[0];
  }

  if (!sheet || sheet.rowCount < 2) {
    throw { status: 400, message: 'The uploaded Excel file does not contain any customer records' };
  }

  // Map header row
  const headerMap: { [key: string]: number } = {};
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    const rawVal = getCellString(cell.value).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (rawVal.includes('recordid') || rawVal === 'id') headerMap['id'] = colNumber;
    else if (rawVal.includes('customername') || rawVal === 'name') headerMap['customerName'] = colNumber;
    else if (rawVal.includes('companyname') || rawVal === 'company') headerMap['companyName'] = colNumber;
    else if (rawVal.includes('phone') || rawVal.includes('mobile')) headerMap['phoneNumber'] = colNumber;
    else if (rawVal.includes('email')) headerMap['email'] = colNumber;
    else if (rawVal.includes('location') || rawVal.includes('city')) headerMap['location'] = colNumber;
    else if (rawVal.includes('software') || rawVal.includes('service')) headerMap['requiredSoftware'] = colNumber;
    else if (rawVal.includes('leadsource') || rawVal.includes('source')) headerMap['leadSource'] = colNumber;
    else if (rawVal.includes('enquirydate')) headerMap['enquiryDate'] = colNumber;
    else if (rawVal.includes('followupstatus') || rawVal.includes('status')) headerMap['followUpStatus'] = colNumber;
    else if (rawVal.includes('nextfollowupdate') || rawVal.includes('nextdate')) headerMap['nextFollowUpDate'] = colNumber;
    else if (rawVal.includes('remark') || rawVal.includes('notes')) headerMap['remarks'] = colNumber;
  });

  if (!headerMap['id']) {
    throw {
      status: 400,
      message: 'Missing "Record ID" column in the uploaded Excel sheet. Record ID is required for database synchronization.',
    };
  }

  const results: ImportRowResult[] = [];
  let updatedCount = 0;
  let unchangedCount = 0;
  let failedCount = 0;

  // Process rows starting from row 2
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    
    // Check if entire row is empty
    const rawId = getCellString(row.getCell(headerMap['id']).value);
    if (!rawId) {
      // Skip trailing empty rows
      continue;
    }

    if (!UUID_REGEX.test(rawId)) {
      failedCount++;
      results.push({
        rowNumber,
        recordId: rawId,
        status: 'failed',
        message: `Invalid Record ID format "${rawId}". Must be a valid UUID.`,
      });
      continue;
    }

    // Fetch existing record
    const [existing] = await db
      .select()
      .from(bdaCustomers)
      .where(eq(bdaCustomers.id, rawId))
      .limit(1);

    if (!existing) {
      failedCount++;
      results.push({
        rowNumber,
        recordId: rawId,
        status: 'failed',
        message: `Record not found in database for ID: ${rawId}`,
      });
      continue;
    }

    // Permission check
    if (!canUserManageCustomer(user, existing)) {
      failedCount++;
      results.push({
        rowNumber,
        recordId: rawId,
        customerName: existing.customerName,
        status: 'failed',
        message: `Permission denied: You do not have permission to modify record for "${existing.customerName}"`,
      });
      continue;
    }

    // Extract modifiable fields
    const newCustomerName = headerMap['customerName']
      ? getCellString(row.getCell(headerMap['customerName']).value)
      : existing.customerName;
    const newCompanyName = headerMap['companyName']
      ? getCellString(row.getCell(headerMap['companyName']).value)
      : existing.companyName;
    const newPhone = headerMap['phoneNumber']
      ? getCellString(row.getCell(headerMap['phoneNumber']).value)
      : existing.phoneNumber;
    const newEmail = headerMap['email']
      ? getCellString(row.getCell(headerMap['email']).value)
      : existing.email;
    const newLocation = headerMap['location']
      ? getCellString(row.getCell(headerMap['location']).value)
      : existing.location;
    const newSoftware = headerMap['requiredSoftware']
      ? getCellString(row.getCell(headerMap['requiredSoftware']).value)
      : existing.requiredSoftware;
    const newLeadSource = headerMap['leadSource']
      ? getCellString(row.getCell(headerMap['leadSource']).value)
      : existing.leadSource;
    const newStatus = headerMap['followUpStatus']
      ? getCellString(row.getCell(headerMap['followUpStatus']).value)
      : existing.followUpStatus;
    const newNextDate = headerMap['nextFollowUpDate']
      ? parseDateCell(row.getCell(headerMap['nextFollowUpDate']).value)
      : existing.nextFollowUpDate;
    const newRemarks = headerMap['remarks']
      ? getCellString(row.getCell(headerMap['remarks']).value)
      : existing.remarks;

    // Validate phone number
    if (!newPhone || newPhone === '-') {
      failedCount++;
      results.push({
        rowNumber,
        recordId: rawId,
        customerName: existing.customerName,
        status: 'failed',
        message: 'Phone number cannot be empty.',
      });
      continue;
    }

    // Validate follow-up status
    if (newStatus && !BDA_STATUSES.includes(newStatus as BdaStatus)) {
      failedCount++;
      results.push({
        rowNumber,
        recordId: rawId,
        customerName: existing.customerName,
        status: 'failed',
        message: `Invalid Follow-up Status "${newStatus}". Must be one of: ${BDA_STATUSES.join(', ')}`,
      });
      continue;
    }

    // Determine changed fields
    const changes: Partial<BdaCustomer> = {};
    const changedFields: string[] = [];

    const norm = (v: any) => (v === '-' || v === undefined || v === null ? '' : String(v).trim());

    if (newCustomerName && norm(newCustomerName) !== norm(existing.customerName)) {
      changes.customerName = newCustomerName;
      changedFields.push('Customer Name');
    }
    if (norm(newCompanyName) !== norm(existing.companyName)) {
      changes.companyName = newCompanyName === '-' || !newCompanyName ? null : newCompanyName;
      changedFields.push('Company Name');
    }
    if (norm(newPhone) !== norm(existing.phoneNumber)) {
      changes.phoneNumber = newPhone;
      changedFields.push('Phone Number');
    }
    if (norm(newEmail) !== norm(existing.email)) {
      changes.email = newEmail === '-' || !newEmail ? null : newEmail;
      changedFields.push('Email');
    }
    if (norm(newLocation) !== norm(existing.location)) {
      changes.location = newLocation === '-' || !newLocation ? null : newLocation;
      changedFields.push('Location');
    }
    if (newSoftware && norm(newSoftware) !== norm(existing.requiredSoftware)) {
      changes.requiredSoftware = newSoftware;
      changedFields.push('Required Software');
    }
    if (norm(newLeadSource) !== norm(existing.leadSource)) {
      changes.leadSource = newLeadSource === '-' || !newLeadSource ? null : newLeadSource;
      changedFields.push('Lead Source');
    }
    if (newStatus && norm(newStatus) !== norm(existing.followUpStatus)) {
      changes.followUpStatus = newStatus;
      changedFields.push('Follow-up Status');
    }
    if (norm(newNextDate) !== norm(existing.nextFollowUpDate)) {
      changes.nextFollowUpDate = newNextDate === '-' || !newNextDate ? null : newNextDate;
      changedFields.push('Next Follow-up Date');
    }
    if (norm(newRemarks) !== norm(existing.remarks)) {
      changes.remarks = newRemarks === '-' || !newRemarks ? null : newRemarks;
      changedFields.push('Remarks');
    }

    // Check if anything changed
    if (changedFields.length === 0) {
      unchangedCount++;
      results.push({
        rowNumber,
        recordId: rawId,
        customerName: existing.customerName,
        status: 'unchanged',
        message: 'No changes detected',
      });
      continue;
    }

    // Update in database
    changes.updatedBy = user.id;
    changes.updatedAt = new Date();

    await db
      .update(bdaCustomers)
      .set(changes)
      .where(eq(bdaCustomers.id, rawId));

    updatedCount++;
    results.push({
      rowNumber,
      recordId: rawId,
      customerName: changes.customerName || existing.customerName,
      status: 'updated',
      message: `Updated fields: ${changedFields.join(', ')}`,
      changedFields,
    });
  }

  return {
    totalRows: updatedCount + unchangedCount + failedCount,
    updatedCount,
    unchangedCount,
    failedCount,
    details: results,
  };
}
