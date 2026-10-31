import { createApp } from './app.js';
import { env } from './config/env.js';
import { checkDatabaseConnection } from './db/index.js';
import cron from 'node-cron';
import { runRetentionCleanup } from './modules/retention/retention.service.js';

const app = createApp();

const server = app.listen(env.PORT, async () => {
  console.log(`\n==============================================`);
  console.log(`🚀 WorkTrack Backend running on http://localhost:${env.PORT}`);
  console.log(`📡 Environment: ${env.NODE_ENV}`);
  console.log(`🌐 Allowed Frontend Origin: ${env.CLIENT_URL}`);
  
  const isDbReady = await checkDatabaseConnection();
  if (isDbReady) {
    console.log(`✅ Connected to Neon PostgreSQL successfully!`);
  } else {
    console.warn(`⚠️ Warning: Database connection check failed.`);
  }
  console.log(`==============================================\n`);

  // Monthly retention job: Runs on 1st of every month at 00:05 AM in Asia/Kolkata
  cron.schedule('5 0 1 * *', async () => {
    console.log('⏰ Running automated monthly retention cleanup...');
    try {
      const result = await runRetentionCleanup(false);
      console.log('✅ Automated retention cleanup completed:', result.message);
    } catch (err) {
      console.error('❌ Automated retention cleanup error:', err);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

