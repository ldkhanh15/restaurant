export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

export interface RevenueMetrics {
  totalRevenue: number;
  averageOrderValue: number;
  peakHours: { hour: number; revenue: number }[];
  revenueByCategory: { category: string; revenue: number }[];
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  customerRetentionRate: number;
  averageVisitFrequency: number;
}

export interface OrderMetrics {
  totalOrders: number;
  averagePreparationTime: number;
  popularDishes: { dishId: number; name: string; count: number }[];
  orderStatusDistribution: { status: string; count: number }[];
}

export interface TableMetrics {
  averageSeatingDuration: number;
  tableUtilizationRate: number;
  peakOccupancyHours: { hour: number; occupancyRate: number }[];
  turnoverRate: number;
}

export interface EmployeeMetrics {
  attendanceRate: number;
  averageShiftDuration: number;
  performanceMetrics: {
    employeeId: number;
    rating: number;
    efficiency: number;
  }[];
}

export interface AnalyticsRequest {
  timeRange: TimeRange;
  metrics: ("revenue" | "customer" | "order" | "table" | "employee")[];
}

export interface AnalyticsResponse {
  timeRange: TimeRange;
  revenue?: RevenueMetrics;
  customer?: CustomerMetrics;
  order?: OrderMetrics;
  table?: TableMetrics;
  employee?: EmployeeMetrics;
}
