import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors.js';
import { checkDatabaseConnection } from './db/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sendSuccess } from './utils/response.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import employeeRoutes from './modules/employees/employee.routes.js';
import departmentRoutes from './modules/departments/department.routes.js';
import projectRoutes from './modules/projects/project.routes.js';
import activityRoutes from './modules/activities/activity.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import retentionRoutes from './modules/retention/retention.routes.js';
import cronRoutes from './modules/cron/cron.routes.js';

export function createApp(): Express {
  const app = express();

  // Vercel serverless request path normalization
  app.use((req, _res, next) => {
    const matched = (req.headers['x-matched-path'] || req.headers['x-forwarded-uri']) as string | undefined;
    if (matched && matched.startsWith('/api')) {
      req.url = matched;
    } else if (!req.url.startsWith('/api')) {
      req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
    }
    next();
  });

  // Core Middleware
  app.use(cors(corsOptions));

  // Disable caching on all API routes so Vercel Edge CDN and browsers never return stale data
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Health-check query
  app.get('/api/health', async (_req, res) => {
    const isDbConnected = await checkDatabaseConnection();
    sendSuccess(res, {
      status: 'healthy',
      database: isDbConnected ? 'connected' : 'disconnected',
      serverTime: new Date().toISOString(),
    }, 'WorkTrack API is running');
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/departments', departmentRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/activities', activityRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/admin/retention', retentionRoutes);
  app.use('/api/cron', cronRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

