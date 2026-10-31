import { Department, Employee, Project, DailyActivity } from '../types';

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'software',
    name: 'Software',
    slug: 'software',
    description: 'Frontend, backend, mobile application development and infrastructure.',
    status: 'active',
    color: '#3B82F6', // Blue
    iconName: 'Code',
    createdAt: '2024-01-10',
  },
  {
    id: 'video-editor',
    name: 'Video Editor',
    slug: 'video-editor',
    description: 'Video production, motion graphics, promotional assets, and reels.',
    status: 'active',
    color: '#8B5CF6', // Purple
    iconName: 'Film',
    createdAt: '2024-01-12',
  },
  {
    id: 'digital-marketing',
    name: 'Digital Marketing',
    slug: 'digital-marketing',
    description: 'Search engine optimization, social ad campaigns, lead generation, and growth.',
    status: 'active',
    color: '#10B981', // Emerald
    iconName: 'TrendingUp',
    createdAt: '2024-01-15',
  },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-admin',
    fullName: 'Chandu',
    username: 'admin',
    role: 'admin',
    assignedDepartments: ['software', 'video-editor', 'digital-marketing'],
    status: 'active',
    email: 'admin@worktrack.io',
    createdAt: '2024-01-01',
    password: 'admin123',
  },
];

export const INITIAL_PROJECTS: Project[] = [];

// Helper to format ISO date to YYYY-MM-DD
export const getFormattedDate = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Helper to get past dates
export const getPastDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return getFormattedDate(d);
};

export const getInitialActivities = (): DailyActivity[] => [];
