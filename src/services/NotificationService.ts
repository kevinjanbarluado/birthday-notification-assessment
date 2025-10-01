import axios, { AxiosResponse } from 'axios';
import { WebhookPayload, NotificationMessage } from '../types';

export class NotificationService {
  private webhookUrl: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor(webhookUrl: string, maxRetries: number = 3, retryDelay: number = 5000) {
    this.webhookUrl = webhookUrl;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  async sendBirthdayNotification(notification: NotificationMessage): Promise<boolean> {
    const payload: WebhookPayload = {
      message: `Hey, ${notification.fullName} it's your birthday`,
      userId: notification.userId,
      timestamp: new Date().toISOString(),
    };

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response: AxiosResponse = await axios.post(this.webhookUrl, payload, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'BirthdayNotificationService/1.0',
          },
        });

        if (response.status >= 200 && response.status < 300) {
          console.log(`Birthday notification sent successfully for user ${notification.userId}`);
          return true;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error(`Attempt ${attempt} failed for user ${notification.userId}:`, error);
        
        if (attempt === this.maxRetries) {
          console.error(`All ${this.maxRetries} attempts failed for user ${notification.userId}`);
          return false;
        }

        // Wait before retrying
        await this.delay(this.retryDelay * attempt);
      }
    }

    return false;
  }

  async testWebhook(): Promise<boolean> {
    const testPayload: WebhookPayload = {
      message: 'Test message from Birthday Notification Service',
      userId: 'test-user',
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await axios.post(this.webhookUrl, testPayload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BirthdayNotificationService/1.0',
        },
      });

      return response.status >= 200 && response.status < 300;
    } catch (error) {
      console.error('Webhook test failed:', error);
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
