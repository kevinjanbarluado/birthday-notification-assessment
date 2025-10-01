import * as cron from 'node-cron';
import { BirthdayNotificationModel, UserModel } from '../models';
import { NotificationService } from './NotificationService';
import { SchedulerConfig } from '../types';
import moment from 'moment-timezone';

export class BirthdaySchedulerService {
  private notificationService: NotificationService;
  private config: SchedulerConfig;
  private cronJob: cron.ScheduledTask | null = null;
  private recoveryJob: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;

  constructor(notificationService: NotificationService, config: SchedulerConfig) {
    this.notificationService = notificationService;
    this.config = config;
  }

  start(): void {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    console.log('Starting Birthday Scheduler Service...');

    // Main scheduler - runs every minute to check for notifications
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.processScheduledNotifications();
    }, {
      scheduled: false,
      timezone: this.config.timezone,
    });

    // Recovery scheduler - runs every hour to check for missed notifications
    this.recoveryJob = cron.schedule(`0 */${this.config.recoveryCheckIntervalMinutes / 60} * * * *`, async () => {
      await this.processMissedNotifications();
    }, {
      scheduled: false,
      timezone: this.config.timezone,
    });

    this.cronJob.start();
    this.recoveryJob.start();
    this.isRunning = true;

    console.log('Birthday Scheduler Service started successfully');
  }

  stop(): void {
    if (!this.isRunning) {
      console.log('Scheduler is not running');
      return;
    }

    console.log('Stopping Birthday Scheduler Service...');

    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }

    if (this.recoveryJob) {
      this.recoveryJob.stop();
      this.recoveryJob = null;
    }

    this.isRunning = false;
    console.log('Birthday Scheduler Service stopped');
  }

  private async processScheduledNotifications(): Promise<void> {
    try {
      const now = moment().utc();
      const oneMinuteAgo = now.clone().subtract(1, 'minute');

      // Find notifications that should be sent now
      const notifications = await BirthdayNotificationModel.findAll({
        where: {
          status: 'pending',
          scheduledDate: {
            [require('sequelize').Op.between]: [oneMinuteAgo.toDate(), now.toDate()],
          },
        },
        include: [
          {
            model: UserModel,
            as: 'user',
            required: true,
          },
        ],
        order: [['scheduledDate', 'ASC']],
      });

      console.log(`Found ${notifications.length} notifications to process`);

      // Process notifications in parallel with concurrency limit
      const concurrencyLimit = 10;
      const chunks = this.chunkArray(notifications, concurrencyLimit);

      for (const chunk of chunks) {
        await Promise.all(chunk.map(notification => this.processNotification(notification)));
      }
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
  }

  private async processMissedNotifications(): Promise<void> {
    try {
      const now = moment().utc();
      const oneHourAgo = now.clone().subtract(1, 'hour');

      // Find notifications that were missed (scheduled more than 1 hour ago but still pending)
      const missedNotifications = await BirthdayNotificationModel.findAll({
        where: {
          status: 'pending',
          scheduledDate: {
            [require('sequelize').Op.lt]: oneHourAgo.toDate(),
          },
          retryCount: {
            [require('sequelize').Op.lt]: this.config.maxRetryAttempts,
          },
        },
        include: [
          {
            model: UserModel,
            as: 'user',
            required: true,
          },
        ],
        order: [['scheduledDate', 'ASC']],
      });

      console.log(`Found ${missedNotifications.length} missed notifications to recover`);

      // Process missed notifications
      for (const notification of missedNotifications) {
        await this.processNotification(notification, true);
      }
    } catch (error) {
      console.error('Error processing missed notifications:', error);
    }
  }

  private async processNotification(notification: BirthdayNotificationModel, isRecovery: boolean = false): Promise<void> {
    const transaction = await BirthdayNotificationModel.sequelize?.transaction();

    if (!transaction) {
      console.error('Failed to create database transaction');
      return;
    }

    try {
      // Lock the notification row to prevent race conditions
      const lockedNotification = await BirthdayNotificationModel.findByPk(notification.id, {
        lock: true,
        transaction,
      });

      if (!lockedNotification || lockedNotification.status !== 'pending') {
        await transaction.rollback();
        return;
      }

      // Mark as retrying to prevent duplicate processing
      await lockedNotification.update({
        status: 'retrying',
        retryCount: lockedNotification.retryCount + 1,
      }, { transaction });

      await transaction.commit();

      // Get user information for notification
      const user = await UserModel.findByPk(notification.userId);
      if (!user) {
        console.error(`User not found for notification ${notification.id}`);
        return;
      }

      // Send notification
      const success = await this.notificationService.sendBirthdayNotification({
        fullName: `${user.firstName} ${user.lastName}`,
        userId: notification.userId,
        scheduledDate: notification.scheduledDate,
      });

      // Update notification status
      await BirthdayNotificationModel.update({
        status: success ? 'sent' : 'failed',
        sentAt: success ? new Date() : undefined,
        errorMessage: success ? undefined : 'Failed to send notification after retries',
      }, {
        where: { id: notification.id },
      });

      console.log(`Notification ${success ? 'sent' : 'failed'} for user ${notification.userId}${isRecovery ? ' (recovery)' : ''}`);
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      console.error(`Error processing notification ${notification.id}:`, error);

      // Mark as failed
      await BirthdayNotificationModel.update({
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }, {
        where: { id: notification.id },
      });
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  async getStatus(): Promise<{
    isRunning: boolean;
    nextScheduledCheck: string;
    pendingNotifications: number;
    failedNotifications: number;
  }> {
    const pendingCount = await BirthdayNotificationModel.count({
      where: { status: 'pending' },
    });

    const failedCount = await BirthdayNotificationModel.count({
      where: { status: 'failed' },
    });

    return {
      isRunning: this.isRunning,
      nextScheduledCheck: moment().add(1, 'minute').format('YYYY-MM-DD HH:mm:ss UTC'),
      pendingNotifications: pendingCount,
      failedNotifications: failedCount,
    };
  }
}
