// Simple unit tests for assessment - no database required
import { NotificationService } from '../services/NotificationService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NotificationService', () => {
  let notificationService: NotificationService;
  const mockWebhookUrl = 'https://hookbin.com/test-webhook';

  beforeEach(() => {
    // Use shorter delays for testing
    notificationService = new NotificationService(mockWebhookUrl, 2, 100);
    jest.clearAllMocks();
  });

  describe('sendBirthdayNotification', () => {
    it('should send notification successfully', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const notification = {
        fullName: 'John Doe',
        userId: 'test-user-id',
        scheduledDate: new Date(),
      };

      const result = await notificationService.sendBirthdayNotification(notification);

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockWebhookUrl,
        {
          message: 'Hey, John Doe it\'s your birthday',
          userId: 'test-user-id',
          timestamp: expect.any(String),
        },
        expect.objectContaining({
          timeout: 10000,
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': 'BirthdayNotificationService/1.0',
          }),
        })
      );
    });

    it('should fail after max retries', async () => {
      const mockError = new Error('Persistent network error');
      mockedAxios.post.mockRejectedValue(mockError);

      const notification = {
        fullName: 'Bob Smith',
        userId: 'test-user-id-3',
        scheduledDate: new Date(),
      };

      const result = await notificationService.sendBirthdayNotification(notification);

      expect(result).toBe(false);
      expect(mockedAxios.post).toHaveBeenCalledTimes(2); // Max retries
    }, 10000); // Increase timeout for this test
  });

  describe('testWebhook', () => {
    it('should test webhook successfully', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await notificationService.testWebhook();

      expect(result).toBe(true);
    });

    it('should fail webhook test on error', async () => {
      const mockError = new Error('Webhook test failed');
      mockedAxios.post.mockRejectedValue(mockError);

      const result = await notificationService.testWebhook();

      expect(result).toBe(false);
    });
  });
});