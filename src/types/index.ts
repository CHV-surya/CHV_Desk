export type UserRole = 'admin' | 'manager' | 'employee';

export type AccountStatus = 'active' | 'inactive';

export type ActivityStatus = 'not-joined' | 'working' | 'completed';

export interface Department {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: AccountStatus;
  color: string;
  iconName?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  fullName: string;
  username: string;
  role: UserRole;
  assignedDepartments: string[]; // Department IDs
  status: AccountStatus;
  email: string;
  avatar?: string;
  createdAt: string;
  password?: string;
}

export interface Project {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  createdBy: string; // Employee ID or 'admin'
  createdByName: string;
  createdAt: string;
  status: 'active' | 'completed' | 'on-hold';
  description?: string;
  isAssigned?: boolean;
  assignedEditors?: { id: string; fullName: string; username: string }[];
}

export interface DailyActivity {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  date: string; // YYYY-MM-DD
  joinTime: string | null; // e.g. "09:15 AM"
  endTime: string | null; // e.g. "06:30 PM"
  workingHours: string | null; // e.g. "8h 15m"
  status: ActivityStatus;
  notes: string;
  lastSavedNotesTime?: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  employeeId: string;
  employeeName: string;
  departmentNames: string[];
  date: string;
  joinTime: string | null;
  endTime: string | null;
  workingHours: string | null;
  status: ActivityStatus;
}

// Digital Marketing Module Types
export type DmContentType = 'video' | 'poster';

export interface DigitalMarketingMonthRecord {
  id: string;
  projectId: string;
  month: number; // 1-12
  year: number;
  monthName: string;
  videoTarget: number;
  posterTarget: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DigitalMarketingEntry {
  id: string;
  monthlyRecordId: string;
  contentType: DmContentType;
  contentName: string;
  videoShoot: boolean | null;
  editing: boolean | null;
  clientConfirmation: boolean | null;
  scheduled: boolean | null;
  scheduledDate: string | null;
  adCampaignReportUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DigitalMarketingStats {
  videoTarget: number;
  videosAdded: number;
  videosCompleted: number;
  videoProgress: number;
  posterTarget: number;
  postersAdded: number;
  postersCompleted: number;
  posterProgress: number;
}

export interface DigitalMarketingWorkspaceData {
  project: {
    id: string;
    name: string;
    description?: string;
    isOwner?: boolean;
    isReadOnly?: boolean;
    isAssigned?: boolean;
    assignedEditors?: { id: string; fullName: string; username: string; email?: string }[];
  };
  monthRecord: DigitalMarketingMonthRecord;
  stats: DigitalMarketingStats;
  entries: DigitalMarketingEntry[];
}

