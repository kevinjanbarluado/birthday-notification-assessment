import { Request, Response } from 'express';
import { UserModel, BirthdayNotificationModel } from '../models';
import { CreateUserRequest, UpdateUserRequest, User } from '../types';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';

export class UserController {
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const userData: CreateUserRequest = req.body;
      
      // Validate timezone
      if (!moment.tz.zone(userData.timezone)) {
        res.status(400).json({
          success: false,
          message: 'Invalid timezone provided',
        });
        return;
      }

      // Check if user already exists (by name and birthday)
      const existingUser = await UserModel.findOne({
        where: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          birthday: userData.birthday,
        },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User with this name and birthday already exists',
        });
        return;
      }

      const user = await UserModel.create({
        id: uuidv4(),
        ...userData,
        birthday: new Date(userData.birthday),
      });

      // Schedule birthday notifications for the next 5 years
      await this.scheduleBirthdayNotifications(user.id, userData.birthday, userData.timezone);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          birthday: user.birthday,
          location: user.location,
          timezone: user.timezone,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user',
      });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateUserRequest = req.body;

      const user = await UserModel.findByPk(id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Validate timezone if provided
      if (updateData.timezone && !moment.tz.zone(updateData.timezone)) {
        res.status(400).json({
          success: false,
          message: 'Invalid timezone provided',
        });
        return;
      }

      // Prepare update data
      const updatePayload: Partial<User> = {};
      if (updateData.firstName) updatePayload.firstName = updateData.firstName;
      if (updateData.lastName) updatePayload.lastName = updateData.lastName;
      if (updateData.location) updatePayload.location = updateData.location;
      if (updateData.timezone) updatePayload.timezone = updateData.timezone;
      if (updateData.birthday) updatePayload.birthday = new Date(updateData.birthday);

      await user.update(updatePayload);

      // If birthday or timezone changed, reschedule notifications
      if (updateData.birthday || updateData.timezone) {
        // Delete existing pending notifications
        await BirthdayNotificationModel.destroy({
          where: {
            userId: id,
            status: 'pending',
          },
        });

        // Schedule new notifications
        const birthday = updateData.birthday || new Date(user.birthday).toISOString().split('T')[0];
        const timezone = updateData.timezone || user.timezone;
        await this.scheduleBirthdayNotifications(id, birthday, timezone);
      }

      res.json({
        success: true,
        message: 'User updated successfully',
        data: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          birthday: user.birthday,
          location: user.location,
          timezone: user.timezone,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
      });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await UserModel.findByPk(id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Delete user (cascade will handle notifications)
      await user.destroy();

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
      });
    }
  }

  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await UserModel.findByPk(id, {
        include: [
          {
            model: BirthdayNotificationModel,
            as: 'notifications',
            where: {
              status: 'pending',
            },
            required: false,
          },
        ],
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          birthday: user.birthday,
          location: user.location,
          timezone: user.timezone,
          pendingNotifications: user.notifications?.length || 0,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user',
      });
    }
  }

  private async scheduleBirthdayNotifications(
    userId: string,
    birthday: string,
    timezone: string
  ): Promise<void> {
    const birthdayDate = moment(birthday);
    const now = moment();
    const currentYear = now.year();

    // Schedule notifications for the next 5 years starting from current year
    for (let yearOffset = 0; yearOffset < 5; yearOffset++) {
      const notificationDate = birthdayDate.clone().year(currentYear + yearOffset);
      
      // Only schedule future notifications
      if (notificationDate.isAfter(now)) {
        const scheduledDateTime = notificationDate
          .tz(timezone)
          .hour(9)
          .minute(0)
          .second(0)
          .millisecond(0)
          .utc()
          .toDate();

        // Check if notification already exists to avoid duplicates
        const existingNotification = await BirthdayNotificationModel.findOne({
          where: {
            userId,
            scheduledDate: scheduledDateTime,
          },
        });

        if (!existingNotification) {
          await BirthdayNotificationModel.create({
            id: uuidv4(),
            userId,
            scheduledDate: scheduledDateTime,
            status: 'pending',
            retryCount: 0,
          });
        }
      }
    }
  }
}
