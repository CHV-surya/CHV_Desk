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

export interface BdaCustomer {
  id: string;
  customerName: string;
  companyName: string | null;
  phoneNumber: string;
  email: string | null;
  location: string | null;
  projectId: string | null;
  projectName?: string | null;
  projectDepartmentId?: string | null;
  projectDepartmentName?: string | null;
  requiredSoftware: string;
  requirements: string | null;
  leadSource: string | null;
  enquiryDate: string;
  followUpStatus: BdaStatus;
  remarks: string | null;
  nextFollowUpDate: string | null;
  createdBy: string;
  creatorName?: string | null;
  creatorUsername?: string | null;
  updatedBy: string | null;
  updaterName?: string | null;
  updaterUsername?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BdaSummary {
  total: number;
  newEnquiries: number;
  pendingFollowUps: number;
  interested: number;
  quotationsSent: number;
  converted: number;
  notInterested: number;
  inDiscussion: number;
}

export interface BdaProject {
  id: string;
  name: string;
  status: string;
  departmentId: string;
  departmentName: string;
  departmentSlug: string;
}

export interface CreateCustomerPayload {
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
  followUpStatus?: BdaStatus;
  remarks?: string | null;
  nextFollowUpDate?: string | null;
}

export interface UpdateCustomerPayload {
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
  followUpStatus?: BdaStatus;
  remarks?: string | null;
  nextFollowUpDate?: string | null;
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
