"use client";

import apiClient from "./apiClient";
import { Voucher } from "./voucherService";

export interface VoucherCompensationData {
  complaintId: string;
  userId: string;
  voucherId: string;
  reason: string;
}

export const compensationService = {
  /**
   * Xử lý khiếu nại với voucher bồi thường
   * @param data Dữ liệu voucher compensation
   * @returns Promise response
   */
  resolveComplaintWithVoucher: async (data: VoucherCompensationData) => {
    try {
      const response = await apiClient.post("/complaints/resolve-with-voucher", {
        complaintId: data.complaintId,
        userId: data.userId,
        voucherId: data.voucherId,
        reason: data.reason,
        resolvedAt: new Date().toISOString(),
      });
      return response;
    } catch (error) {
      console.error("Lỗi xử lý khiếu nại với voucher:", error);
      throw error;
    }
  },

  /**
   * Cấp voucher cho người dùng
   * @param userId ID người dùng
   * @param voucherId ID voucher
   * @param reason Lý do cấp voucher
   * @returns Promise response
   */
  assignVoucherToUser: async (userId: string, voucherId: string, reason: string) => {
    try {
      const response = await apiClient.post("/user-vouchers", {
        userId,
        voucherId,
        reason,
        assignedAt: new Date().toISOString(),
        status: "active",
      });
      return response;
    } catch (error) {
      console.error("Lỗi cấp voucher cho người dùng:", error);
      throw error;
    }
  },
};

export default compensationService;