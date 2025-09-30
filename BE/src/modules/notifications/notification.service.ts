import { Notification, User } from "../../models/index";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import {
  CreateNotificationDTO,
  UpdateNotificationDTO,
  NotificationPreferencesDTO,
} from "../../types/dtos/notification.dto";
import { sendEmail } from "../../utils/email";
import { sendSMS } from "../../utils/sms";
import { sendPushNotification } from "../../utils/push";

export const NotificationService = {
  async list(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      type?: string;
      fromDate?: Date;
      limit?: number;
      offset?: number;
    }
  ) {
    const where: any = { user_id: userId };
    if (options?.unreadOnly) where.read = false;
    if (options?.type) where.type = options.type;
    if (options?.fromDate) {
      where.created_at = {
        [Op.gte]: options.fromDate,
      };
    }

    return Notification.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit: options?.limit || 20,
      offset: options?.offset || 0,
    });
  },

  async get(id: string) {
    return Notification.findByPk(id);
  },

  async create(payload: CreateNotificationDTO) {
    const id = uuidv4();
    const user = await User.findByPk(payload.user_id);
    if (!user) throw new Error("User not found");

    // Get user notification preferences
    const preferences = await this.getUserPreferences(payload.user_id);

    // Check if notification type is disabled for user
    if (preferences?.preferences.disabled_types?.includes(payload.type)) {
      return null;
    }

    // Check quiet hours
    const isQuietHours = this.isInQuietHours(preferences);
    if (isQuietHours && payload.priority !== "high") {
      // Queue for later delivery
      return this.queueNotification(payload);
    }

    // Create in-app notification
    const notification = await Notification.create({
      id,
      ...payload,
      channels: payload.channels || ["in_app"],
      priority: payload.priority || "normal",
      created_at: new Date(),
    });

    // Send through enabled channels based on user preferences
    const enabledChannels = preferences?.preferences.enabled_channels || [
      "in_app",
    ];

    await Promise.all([
      // Send email if enabled
      enabledChannels.includes("email") &&
        this.sendEmailNotification(user, payload),

      // Send SMS if enabled and priority is high
      enabledChannels.includes("sms") &&
        payload.priority === "high" &&
        this.sendSMSNotification(user, payload),

      // Send push notification if enabled
      enabledChannels.includes("push") &&
        this.sendPushNotification(user, payload),
    ]);

    return notification;
  },

  async update(id: string, payload: UpdateNotificationDTO) {
    const notification = await Notification.findByPk(id);
    if (!notification) return null;

    return notification.update({
      ...payload,
      updated_at: new Date(),
    });
  },

  async markAsRead(userId: string, notificationIds: string[]) {
    return Notification.update(
      {
        read: true,
        read_at: new Date(),
      },
      {
        where: {
          id: { [Op.in]: notificationIds },
          user_id: userId,
        },
      }
    );
  },

  async deleteMany(userId: string, notificationIds: string[]) {
    return Notification.destroy({
      where: {
        id: { [Op.in]: notificationIds },
        user_id: userId,
      },
    });
  },

  async getUserPreferences(userId: string) {
    // Implement user preferences retrieval from database
    // This is a placeholder implementation
    return {
      user_id: userId,
      preferences: {
        enabled_channels: ["in_app", "email"],
        disabled_types: [],
        frequency: "immediate" as const,
      },
    };
  },

  async updateUserPreferences(payload: NotificationPreferencesDTO) {
    // Implement user preferences update in database
    // This is a placeholder implementation
    return payload;
  },

  async sendEmailNotification(user: User, notification: CreateNotificationDTO) {
    try {
      await sendEmail({
        to: user.email,
        subject: notification.title,
        template: "notification",
        context: {
          title: notification.title,
          message: notification.message,
          actionUrl: notification.action_url,
          ...notification.data,
        },
      });
    } catch (error) {
      console.error("Failed to send email notification:", error);
    }
  },

  async sendSMSNotification(user: User, notification: CreateNotificationDTO) {
    try {
      if (user.phone) {
        await sendSMS({
          to: user.phone,
          message: `${notification.title}: ${notification.message}`,
        });
      }
    } catch (error) {
      console.error("Failed to send SMS notification:", error);
    }
  },

  async sendPushNotification(user: User, notification: CreateNotificationDTO) {
    try {
      if (user.push_token) {
        await sendPushNotification({
          token: user.push_token,
          title: notification.title,
          body: notification.message,
          data: notification.data,
        });
      }
    } catch (error) {
      console.error("Failed to send push notification:", error);
    }
  },

  isInQuietHours(preferences?: NotificationPreferencesDTO) {
    if (!preferences?.preferences.quiet_hours) return false;

    const { start, end, timezone } = preferences.preferences.quiet_hours;
    const now = new Date().toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour12: false,
    });

    return now >= start && now <= end;
  },

  async queueNotification(notification: CreateNotificationDTO) {
    // Implement notification queueing logic
    // This could use a job queue like Bull or a scheduled task
    // This is a placeholder implementation
    return null;
  },
};
