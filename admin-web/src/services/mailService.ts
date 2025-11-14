"use client";

import apiClient from "./apiClient";

export interface AccountEmailData {
  to: string;
  username: string;
  password: string;
  loginUrl?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

export const mailService = {
  /**
   * Gửi email thông báo tài khoản mới được tạo
   * @param to Email người nhận
   * @param username Tên đăng nhập
   * @param password Mật khẩu mặc định
   * @returns Promise<void>
   */
  sendAccountEmail: async (
    to: string, 
    username: string, 
    password: string
  ): Promise<void> => {
    try {
      const loginUrl = `${window.location.origin}/login`;
      
      const emailData: AccountEmailData = {
        to,
        username,
        password,
        loginUrl,
      };

      const response = await apiClient.post<EmailResponse>("/notifications/send-account-email", {
        recipientEmail: emailData.to,
        username: emailData.username,
        defaultPassword: emailData.password,
        loginUrl: emailData.loginUrl,
        emailType: "account_creation",
        templateData: {
          username: emailData.username,
          password: emailData.password,
          loginUrl: emailData.loginUrl,
          systemName: "Restaurant Management System",
          supportEmail: "support@restaurant.com",
        }
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Không thể gửi email");
      }
      
      console.log("Email sent successfully:", response.data);
    } catch (error: any) {
      console.error("Lỗi gửi email tài khoản:", error);
      
      // Ném lỗi có thông tin chi tiết
      if (error.response?.data?.message) {
        throw new Error(`Lỗi gửi email: ${error.response.data.message}`);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Không thể gửi email thông báo tài khoản. Vui lòng kiểm tra lại cấu hình email.");
      }
    }
  },

  /**
   * Gửi email thông báo reset password
   * @param to Email người nhận
   * @param username Tên đăng nhập
   * @param resetToken Token reset password
   * @returns Promise<void>
   */
  sendResetPasswordEmail: async (
    to: string, 
    username: string, 
    resetToken: string
  ): Promise<void> => {
    try {
      const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}`;
      
      const response = await apiClient.post<EmailResponse>("/notifications/send-reset-password-email", {
        recipientEmail: to,
        username,
        resetToken,
        resetUrl,
        emailType: "password_reset",
        templateData: {
          username,
          resetUrl,
          resetToken,
          systemName: "Restaurant Management System",
          supportEmail: "support@restaurant.com",
          expirationHours: 24,
        }
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Không thể gửi email reset password");
      }
      
      console.log("Reset password email sent successfully:", response.data);
    } catch (error: any) {
      console.error("Lỗi gửi email reset password:", error);
      
      if (error.response?.data?.message) {
        throw new Error(`Lỗi gửi email: ${error.response.data.message}`);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Không thể gửi email reset password. Vui lòng thử lại sau.");
      }
    }
  },

  /**
   * Gửi email thông báo chung
   * @param to Email người nhận
   * @param subject Tiêu đề email
   * @param content Nội dung email
   * @returns Promise<void>
   */
  sendNotificationEmail: async (
    to: string, 
    subject: string, 
    content: string
  ): Promise<void> => {
    try {
      const response = await apiClient.post<EmailResponse>("/notifications/send-notification-email", {
        recipientEmail: to,
        subject,
        content,
        emailType: "general_notification",
        templateData: {
          subject,
          content,
          systemName: "Restaurant Management System",
          supportEmail: "support@restaurant.com",
        }
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Không thể gửi email thông báo");
      }
      
      console.log("Notification email sent successfully:", response.data);
    } catch (error: any) {
      console.error("Lỗi gửi email thông báo:", error);
      
      if (error.response?.data?.message) {
        throw new Error(`Lỗi gửi email: ${error.response.data.message}`);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Không thể gửi email thông báo. Vui lòng thử lại sau.");
      }
    }
  },
};

export default mailService;