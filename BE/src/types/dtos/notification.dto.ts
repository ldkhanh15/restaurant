import { NotificationAttributes } from "../../models/notification.model";

export interface CreateNotificationDTO {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, any>;
  priority?: "low" | "normal" | "high";
  expiration?: Date;
  action_url?: string;
  channels?: ("in_app" | "email" | "sms" | "push")[];
}

export interface UpdateNotificationDTO {
  read?: boolean;
  read_at?: Date;
  acted_upon?: boolean;
  acted_at?: Date;
  action_taken?: string;
}

export interface NotificationPreferencesDTO {
  user_id: string;
  preferences: {
    enabled_channels: ("in_app" | "email" | "sms" | "push")[];
    disabled_types?: NotificationType[];
    quiet_hours?: {
      start: string; // HH:mm format
      end: string; // HH:mm format
      timezone: string;
    };
    frequency?: "immediate" | "hourly" | "daily" | "weekly";
  };
}

export type NotificationType =
  // Event related
  | "event_created"
  | "event_updated"
  | "event_cancelled"
  | "event_reminder"
  | "booking_confirmed"
  | "booking_cancelled"
  // Review related
  | "new_review"
  | "review_response"
  | "review_status"
  // Complaint related
  | "new_complaint"
  | "complaint_status"
  | "complaint_assignment"
  | "complaint_escalation"
  | "complaint_resolution"
  // Order related
  | "order_status"
  | "order_ready"
  | "payment_processed"
  // System related
  | "system_maintenance"
  | "security_alert"
  | "account_update";
