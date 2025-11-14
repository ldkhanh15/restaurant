"use client";

import * as XLSX from "xlsx";
import { orderService } from "./orderService";

export interface ExportFilters {
  start_date?: string;
  end_date?: string;
  status?: string;
  table_id?: string;
  user_id?: string;
}

export const exportService = {
  /**
   * Export order revenue to Excel
   */
  async exportOrderRevenue(filters: ExportFilters = {}) {
    try {
      const response: any = await orderService.exportRevenue(filters);

      // Handle both { status: "success", data: [...] } and direct array
      const data = response?.data || response || [];

      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Không có dữ liệu để export");
      }

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Create worksheet from data
      const ws = XLSX.utils.json_to_sheet(data);

      // Set column widths
      const colWidths = [
        { wch: 15 }, // Order ID
        { wch: 12 }, // Date
        { wch: 20 }, // Customer
        { wch: 25 }, // Customer Email
        { wch: 15 }, // Customer Phone
        { wch: 10 }, // Table
        { wch: 15 }, // Status
        { wch: 15 }, // Payment Status
        { wch: 15 }, // Payment Method
        { wch: 40 }, // Items
        { wch: 15 }, // Total Amount
        { wch: 15 }, // Voucher Discount
        { wch: 12 }, // Event Fee
        { wch: 12 }, // Deposit
        { wch: 15 }, // Final Amount
        { wch: 30 }, // Notes
      ];
      ws["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Doanh thu đơn hàng");

      // Generate filename
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `Doanh-thu-don-hang-${dateStr}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);

      return { success: true, filename };
    } catch (error: any) {
      console.error("Error exporting order revenue:", error);
      throw error;
    }
  },

  /**
   * Export popular dishes statistics to Excel
   */
  async exportPopularDishes(
    filters: { start_date?: string; end_date?: string } = {}
  ) {
    try {
      const response: any = await orderService.getPopularDishesStats(filters);

      // Handle both { status: "success", data: [...] } and direct array
      const data = response?.data || response || [];

      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Không có dữ liệu để export");
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      const colWidths = [
        { wch: 30 }, // Dish Name
        { wch: 15 }, // Dish ID
        { wch: 18 }, // Total Quantity
        { wch: 15 }, // Total Revenue
        { wch: 15 }, // Times Ordered
        { wch: 20 }, // Average Revenue
      ];
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Món đặt nhiều");

      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `Thong-ke-mon-dat-nhieu-${dateStr}.xlsx`;

      XLSX.writeFile(wb, filename);

      return { success: true, filename };
    } catch (error: any) {
      console.error("Error exporting popular dishes:", error);
      throw error;
    }
  },

  /**
   * Export top customers statistics to Excel
   */
  async exportTopCustomers(
    filters: { start_date?: string; end_date?: string } = {}
  ) {
    try {
      const response: any = await orderService.getTopCustomersStats(filters);

      // Handle both { status: "success", data: [...] } and direct array
      const data = response?.data || response || [];

      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Không có dữ liệu để export");
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      const colWidths = [
        { wch: 25 }, // Customer Name
        { wch: 30 }, // Customer Email
        { wch: 15 }, // Customer ID
        { wch: 15 }, // Total Spent
        { wch: 12 }, // Total Orders
        { wch: 15 }, // Total Reservations
        { wch: 15 }, // Total Payments
        { wch: 18 }, // Average Order Value
      ];
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Khách hàng thân thiết");

      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `Thong-ke-khach-hang-${dateStr}.xlsx`;

      XLSX.writeFile(wb, filename);

      return { success: true, filename };
    } catch (error: any) {
      console.error("Error exporting top customers:", error);
      throw error;
    }
  },
};
