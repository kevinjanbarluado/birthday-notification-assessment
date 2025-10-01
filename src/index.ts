import dotenv from 'dotenv';
import { App } from './app';
import { DatabaseService } from './services/DatabaseService';
import { NotificationService } from './services/NotificationService';
import { BirthdaySchedulerService } from './services/BirthdaySchedulerService';
import { initializeModels } from './models';
import { DatabaseConfig, SchedulerConfig } from './types';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);

// Database configuration
const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'birthday_notifications',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

// Scheduler configuration
const schedulerConfig: SchedulerConfig = {
  timezone: process.env.SCHEDULER_TIMEZONE || 'UTC',
  notificationHour: parseInt(process.env.BIRTHDAY_NOTIFICATION_HOUR || '9', 10),
  notificationMinute: parseInt(process.env.BIRTHDAY_NOTIFICATION_MINUTE || '0', 10),
  recoveryCheckIntervalMinutes: parseInt(process.env.RECOVERY_CHECK_INTERVAL_MINUTES || '60', 10),
  maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10),
};

async function startApplication(): Promise<void> {
  try {
    console.log('Starting Birthday Notification System...');

    // Initialize database
    const databaseService = new DatabaseService(dbConfig);
    await databaseService.connect();
    await databaseService.sync(process.env.NODE_ENV === 'development');

    // Initialize models
    initializeModels(databaseService.getSequelize());

    // Initialize notification service
    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('WEBHOOK_URL environment variable is required');
    }

    const notificationService = new NotificationService(webhookUrl);
    
    // Test webhook connection
    console.log('Testing webhook connection...');
    const webhookTest = await notificationService.testWebhook();
    if (!webhookTest) {
      console.warn('Warning: Webhook test failed. Notifications may not be delivered.');
    } else {
      console.log('Webhook connection test successful');
    }

    // Initialize and start scheduler
    const schedulerService = new BirthdaySchedulerService(notificationService, schedulerConfig);
    schedulerService.start();

    // Initialize Express app
    const app = new App();
    app.listen(PORT);

    console.log(`Birthday Notification System started successfully on port ${PORT}`);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nReceived SIGINT. Gracefully shutting down...');
      schedulerService.stop();
      await databaseService.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\nReceived SIGTERM. Gracefully shutting down...');
      schedulerService.stop();
      await databaseService.disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Start the application
startApplication();
