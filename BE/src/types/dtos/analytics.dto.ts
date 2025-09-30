export interface DateRangeParams {
  startDate: Date;
  endDate: Date;
}

export interface SalesAnalyticsDTO extends DateRangeParams {
  groupBy?: "day" | "week" | "month" | "year";
  includeItems?: boolean;
  includeTables?: boolean;
}

export interface InventoryAnalyticsDTO extends DateRangeParams {
  groupBy?: "ingredient" | "category" | "supplier";
  includeUsage?: boolean;
  includeWastage?: boolean;
}

export interface StaffAnalyticsDTO extends DateRangeParams {
  groupBy?: "employee" | "position" | "shift";
  includeAttendance?: boolean;
  includePerformance?: boolean;
}

export interface CustomerAnalyticsDTO extends DateRangeParams {
  groupBy?: "customer" | "segment" | "location";
  includeOrders?: boolean;
  includePreferences?: boolean;
}

export interface RevenueBreakdownDTO {
  food: number;
  beverages: number;
  events: number;
  services: number;
  total: number;
}

export interface PerformanceMetricsDTO {
  averageOrderValue: number;
  tableTurnoverRate: number;
  customerRetentionRate: number;
  employeeEfficiency: number;
  inventoryTurnoverRate: number;
}
