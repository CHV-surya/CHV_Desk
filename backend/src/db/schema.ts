import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  date,
  integer,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'employee']);
export const activityStatusEnum = pgEnum('activity_status', [
  'not_joined',
  'working',
  'completed',
]);

// 1. Users Table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('employee').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Departments Table
export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  accentColor: varchar('accent_color', { length: 50 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. User Departments Table (Many-to-Many)
export const userDepartments = pgTable(
  'user_departments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_department_unique_idx').on(table.userId, table.departmentId),
  ]
);

// 4. Projects Table (Permanent Records)
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  departmentId: uuid('department_id')
    .notNull()
    .references(() => departments.id, { onDelete: 'restrict' }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 5. Daily Activities Table
export const dailyActivities = pgTable(
  'daily_activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    workDate: date('work_date').notNull(), // Format: YYYY-MM-DD
    joinTime: timestamp('join_time', { withTimezone: true }),
    endTime: timestamp('end_time', { withTimezone: true }),
    workingMinutes: integer('working_minutes').default(0).notNull(),
    notes: text('notes').default('').notNull(),
    status: activityStatusEnum('status').default('not_joined').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('employee_work_date_unique_idx').on(table.employeeId, table.workDate),
  ]
);

// Drizzle Relations
export const usersRelations = relations(users, ({ many }) => ({
  userDepartments: many(userDepartments),
  createdProjects: many(projects),
  activities: many(dailyActivities),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  userDepartments: many(userDepartments),
  projects: many(projects),
  activities: many(dailyActivities),
}));

export const userDepartmentsRelations = relations(userDepartments, ({ one }) => ({
  user: one(users, {
    fields: [userDepartments.userId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [userDepartments.departmentId],
    references: [departments.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  department: one(departments, {
    fields: [projects.departmentId],
    references: [departments.id],
  }),
  creator: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
  }),
  activities: many(dailyActivities),
}));

export const dailyActivitiesRelations = relations(dailyActivities, ({ one }) => ({
  employee: one(users, {
    fields: [dailyActivities.employeeId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [dailyActivities.departmentId],
    references: [departments.id],
  }),
  project: one(projects, {
    fields: [dailyActivities.projectId],
    references: [projects.id],
  }),
}));

// Types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Department = InferSelectModel<typeof departments>;
export type NewDepartment = InferInsertModel<typeof departments>;

export type UserDepartment = InferSelectModel<typeof userDepartments>;
export type NewUserDepartment = InferInsertModel<typeof userDepartments>;

export type Project = InferSelectModel<typeof projects>;
export type NewProject = InferInsertModel<typeof projects>;

export type DailyActivity = InferSelectModel<typeof dailyActivities>;
export type NewDailyActivity = InferInsertModel<typeof dailyActivities>;

