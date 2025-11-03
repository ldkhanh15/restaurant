"use client";

import apiClient from "./apiClient";

export const statsService = {
  // 1. Thống kê theo tháng (12 tháng gần đây)
  getMonthlyStats: () => apiClient.get("/orders/stats/monthly"),

  // 2. Thống kê theo giờ (24h, mỗi 2h)
  getHourlyStats: () => apiClient.get("/orders/stats/hourly"),

  // 3. Thống kê khách hàng (7 ngày)
  getCustomerStats: () => apiClient.get("/orders/stats/customers"),

  // 4. Thống kê hôm nay
  getTodayStats: () => apiClient.get("/orders/stats/today"),
};

export type MonthlyStats = {
  month: string;
  revenue: number;
  order_count: number;
  customer_count: number;
};

export type HourlyStats = {
  hour_range: string;
  revenue: number;
  order_count: number;
};

export type CustomerStats = {
  day: string;
  registered_customers: number;
  walk_in_customers: number;
};

export type TodayStats = {
  revenue: number;
  order_count: number;
  reservation_count: number;
};
