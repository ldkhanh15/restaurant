import { UserAttributes } from "../../models/user.model";
import { UserPreferenceAttributes } from "../../models/userPreference.model";

export interface CreateUserDTO {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  role?: UserAttributes["role"];
  status?: UserAttributes["status"];
}

export interface UpdateUserDTO
  extends Partial<Omit<CreateUserDTO, "password">> {
  password?: string; // Optional for updates
}

export interface UserPreferenceDTO {
  user_id: string;
  theme?: "light" | "dark" | "system";
  language?: string;
  notification_settings?: {
    email_notifications?: boolean;
    push_notifications?: boolean;
    sms_notifications?: boolean;
    marketing_emails?: boolean;
  };
  dietary_restrictions?: string[];
  favorite_dishes?: string[];
  preferred_payment_method?: string;
  table_preferences?: {
    preferred_section?: string;
    seating_preferences?: string[];
  };
}

export interface UserBehaviorLogDTO {
  user_id: string;
  action: string;
  page?: string;
  feature?: string;
  metadata?: object;
  session_id?: string;
  device_info?: object;
}
