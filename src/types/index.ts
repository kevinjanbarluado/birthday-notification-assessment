export interface User {
  id: string;
  firstName: string;
  lastName: string;
  birthday: Date;
  location: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  birthday: string; // ISO date string
  location: string;
  timezone: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  birthday?: string; // ISO date string
  location?: string;
  timezone?: string;
}

export interface BirthdayNotification {
  id: string;
  userId: string;
  scheduledDate: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  retryCount: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationMessage {
  fullName: string;
  userId: string;
  scheduledDate: Date;
}

export interface WebhookPayload {
  message: string;
  userId: string;
  timestamp: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface SchedulerConfig {
  timezone: string;
  notificationHour: number;
  notificationMinute: number;
  recoveryCheckIntervalMinutes: number;
  maxRetryAttempts: number;
}
