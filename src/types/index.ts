export type UserRole = 'admin' | 'employee';

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
