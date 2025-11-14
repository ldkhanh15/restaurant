"use client";

import apiClient from "./apiClient";
import { Complaint } from "@/type/Complaint";
import { Voucher } from "./voucherService";

export interface EmailNotificationData {
  userId: string;
  userEmail: string;
  complaint: Complaint;
  voucher?: Voucher;
  resolutionNotes?: string;
}

export const emailService = {
  /**
   * Gửi email thông báo giải quyết khiếu nại
   * @param data Dữ liệu để gửi email
   * @returns Promise response
   */
  notifyComplaintResolved: async (data: EmailNotificationData) => {
    try {
      const emailData = {
        userId: data.userId,
        userEmail: data.userEmail,
        complaintId: data.complaint.id,
        complaintDescription: data.complaint.description,
        status: data.complaint.status,
        resolutionNotes: data.resolutionNotes || data.complaint.resolution_notes,
        orderId: data.complaint.order_id,
        orderItemId: data.complaint.order_item_id,
        // Thông tin voucher nếu có
        voucherCode: data.voucher?.code,
        voucherValue: data.voucher?.value,
        voucherType: data.voucher?.discount_type,
        voucherExpiry: data.voucher?.expiry_date,
      };

      const response = await apiClient.post("/notifications/complaint-resolved", emailData);
      return response;
    } catch (error) {
      console.error("Lỗi gửi email thông báo khiếu nại:", error);
      throw error;
    }
  },

  /**
   * Gửi email thông báo voucher bồi thường
   * @param userEmail Email người dùng
   * @param complaint Thông tin khiếu nại
   * @param voucher Thông tin voucher
   * @param reason Lý do tặng voucher
   * @returns Promise response
   */
  sendVoucherCompensationEmail: async (
    userEmail: string,
    complaint: Complaint,
    voucher: Voucher,
    reason: string
  ) => {
    try {
      const emailData = {
        userEmail,
        complaintId: complaint.id,
        complaintDescription: complaint.description,
        orderId: complaint.order_id,
        orderItemId: complaint.order_item_id,
        voucherCode: voucher.code,
        voucherValue: voucher.value,
        voucherType: voucher.discount_type,
        voucherExpiry: voucher.expiry_date,
        minOrderValue: voucher.min_order_value,
        reason,
        resolvedAt: new Date().toISOString(),
      };

      const response = await apiClient.post("/notifications/voucher-compensation", emailData);
      return response;
    } catch (error) {
      console.error("Lỗi gửi email voucher bồi thường:", error);
      throw error;
    }
  },
};

export default emailService;