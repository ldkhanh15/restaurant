import {
  Order,
  OrderItem,
  User,
  Employee,
  Table,
  Attendance,
} from "../../models";
import { Op } from "sequelize";
import {
  TimeRange,
  RevenueMetrics,
  CustomerMetrics,
  OrderMetrics,
  TableMetrics,
  EmployeeMetrics,
  AnalyticsRequest,
  AnalyticsResponse,
} from "./analytics.dto";

export class AnalyticsService {
  async generateAnalytics(
    request: AnalyticsRequest
  ): Promise<AnalyticsResponse> {
    const response: AnalyticsResponse = {
      timeRange: request.timeRange,
    };

    const promises = request.metrics.map(async (metric) => {
      switch (metric) {
        case "revenue":
          response.revenue = await this.calculateRevenueMetrics(
            request.timeRange
          );
          break;
        case "customer":
          response.customer = await this.calculateCustomerMetrics(
            request.timeRange
          );
          break;
        case "order":
          response.order = await this.calculateOrderMetrics(request.timeRange);
          break;
        case "table":
          response.table = await this.calculateTableMetrics(request.timeRange);
          break;
        case "employee":
          response.employee = await this.calculateEmployeeMetrics(
            request.timeRange
          );
          break;
      }
    });

    await Promise.all(promises);
    return response;
  }

  private async calculateRevenueMetrics(
    timeRange: TimeRange
  ): Promise<RevenueMetrics> {
    const orders = await Order.findAll({
      where: {
        createdAt: {
          [Op.between]: [timeRange.startDate, timeRange.endDate],
        },
        status: "completed",
      },
      include: [{ model: OrderItem, include: ["dish"] }],
    });

    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );
    const averageOrderValue = totalRevenue / orders.length || 0;

    // Calculate revenue by hour
    const revenueByHour = new Map<number, number>();
    orders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      revenueByHour.set(
        hour,
        (revenueByHour.get(hour) || 0) + order.totalAmount
      );
    });

    // Calculate revenue by category
    const revenueByCategory = new Map<string, number>();
    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        const category = item.dish.category;
        revenueByCategory.set(
          category,
          (revenueByCategory.get(category) || 0) + item.price * item.quantity
        );
      });
    });

    return {
      totalRevenue,
      averageOrderValue,
      peakHours: Array.from(revenueByHour.entries())
        .map(([hour, revenue]) => ({ hour, revenue }))
        .sort((a, b) => b.revenue - a.revenue),
      revenueByCategory: Array.from(revenueByCategory.entries()).map(
        ([category, revenue]) => ({ category, revenue })
      ),
    };
  }

  private async calculateCustomerMetrics(
    timeRange: TimeRange
  ): Promise<CustomerMetrics> {
    const orders = await Order.findAll({
      where: {
        createdAt: {
          [Op.between]: [timeRange.startDate, timeRange.endDate],
        },
      },
      include: [{ model: User }],
    });

    const uniqueCustomers = new Set(orders.map((order) => order.userId));
    const customerVisits = new Map<number, number>();
    orders.forEach((order) => {
      customerVisits.set(
        order.userId,
        (customerVisits.get(order.userId) || 0) + 1
      );
    });

    const repeatCustomers = Array.from(customerVisits.values()).filter(
      (visits) => visits > 1
    ).length;

    return {
      totalCustomers: uniqueCustomers.size,
      newCustomers: await this.countNewCustomers(timeRange),
      repeatCustomers,
      customerRetentionRate: (repeatCustomers / uniqueCustomers.size) * 100,
      averageVisitFrequency: orders.length / uniqueCustomers.size,
    };
  }

  private async calculateOrderMetrics(
    timeRange: TimeRange
  ): Promise<OrderMetrics> {
    const orders = await Order.findAll({
      where: {
        createdAt: {
          [Op.between]: [timeRange.startDate, timeRange.endDate],
        },
      },
      include: [{ model: OrderItem, include: ["dish"] }],
    });

    const dishPopularity = new Map<number, { name: string; count: number }>();
    const statusCounts = new Map<string, number>();

    orders.forEach((order) => {
      statusCounts.set(order.status, (statusCounts.get(order.status) || 0) + 1);
      order.orderItems.forEach((item) => {
        const current = dishPopularity.get(item.dishId) || {
          name: item.dish.name,
          count: 0,
        };
        dishPopularity.set(item.dishId, {
          name: item.dish.name,
          count: current.count + item.quantity,
        });
      });
    });

    return {
      totalOrders: orders.length,
      averagePreparationTime: this.calculateAveragePreparationTime(orders),
      popularDishes: Array.from(dishPopularity.entries())
        .map(([dishId, { name, count }]) => ({ dishId, name, count }))
        .sort((a, b) => b.count - a.count),
      orderStatusDistribution: Array.from(statusCounts.entries()).map(
        ([status, count]) => ({ status, count })
      ),
    };
  }

  private async calculateTableMetrics(
    timeRange: TimeRange
  ): Promise<TableMetrics> {
    const reservations = await Table.findAll({
      where: {
        createdAt: {
          [Op.between]: [timeRange.startDate, timeRange.endDate],
        },
      },
      include: ["reservations"],
    });

    const occupancyByHour = new Map<number, number>();
    let totalDuration = 0;
    let totalReservations = 0;

    reservations.forEach((table) => {
      table.reservations.forEach((reservation) => {
        const duration =
          (new Date(reservation.endTime).getTime() -
            new Date(reservation.startTime).getTime()) /
          3600000;
        totalDuration += duration;
        totalReservations++;

        const hour = new Date(reservation.startTime).getHours();
        occupancyByHour.set(hour, (occupancyByHour.get(hour) || 0) + 1);
      });
    });

    return {
      averageSeatingDuration: totalDuration / totalReservations || 0,
      tableUtilizationRate: (totalDuration / (24 * reservations.length)) * 100,
      peakOccupancyHours: Array.from(occupancyByHour.entries())
        .map(([hour, count]) => ({
          hour,
          occupancyRate: (count / reservations.length) * 100,
        }))
        .sort((a, b) => b.occupancyRate - a.occupancyRate),
      turnoverRate: totalReservations / reservations.length || 0,
    };
  }

  private async calculateEmployeeMetrics(
    timeRange: TimeRange
  ): Promise<EmployeeMetrics> {
    const attendances = await Attendance.findAll({
      where: {
        createdAt: {
          [Op.between]: [timeRange.startDate, timeRange.endDate],
        },
      },
      include: [{ model: Employee }],
    });

    const employeeStats = new Map<
      number,
      {
        totalShifts: number;
        totalHours: number;
        completedTasks: number;
      }
    >();

    attendances.forEach((attendance) => {
      const employeeId = attendance.employeeId;
      const current = employeeStats.get(employeeId) || {
        totalShifts: 0,
        totalHours: 0,
        completedTasks: 0,
      };

      const shiftDuration =
        (new Date(attendance.checkOut).getTime() -
          new Date(attendance.checkIn).getTime()) /
        3600000;

      employeeStats.set(employeeId, {
        totalShifts: current.totalShifts + 1,
        totalHours: current.totalHours + shiftDuration,
        completedTasks:
          current.completedTasks + (attendance.tasksCompleted || 0),
      });
    });

    const performanceMetrics = Array.from(employeeStats.entries()).map(
      ([employeeId, stats]) => ({
        employeeId,
        rating: this.calculateEmployeeRating(stats),
        efficiency: stats.completedTasks / stats.totalHours,
      })
    );

    return {
      attendanceRate: this.calculateAttendanceRate(attendances),
      averageShiftDuration:
        Array.from(employeeStats.values()).reduce(
          (sum, stats) => sum + stats.totalHours / stats.totalShifts,
          0
        ) / employeeStats.size,
      performanceMetrics,
    };
  }

  private async countNewCustomers(timeRange: TimeRange): Promise<number> {
    return await User.count({
      where: {
        createdAt: {
          [Op.between]: [timeRange.startDate, timeRange.endDate],
        },
      },
    });
  }

  private calculateAveragePreparationTime(orders: Order[]): number {
    const completedOrders = orders.filter(
      (order) => order.status === "completed"
    );
    if (completedOrders.length === 0) return 0;

    return (
      completedOrders.reduce((sum, order) => {
        const prep =
          (new Date(order.completedAt).getTime() -
            new Date(order.createdAt).getTime()) /
          60000;
        return sum + prep;
      }, 0) / completedOrders.length
    );
  }

  private calculateAttendanceRate(attendances: Attendance[]): number {
    const expectedAttendances = attendances.length;
    const actualAttendances = attendances.filter(
      (a) => a.status === "present"
    ).length;
    return (actualAttendances / expectedAttendances) * 100;
  }

  private calculateEmployeeRating(stats: {
    totalShifts: number;
    totalHours: number;
    completedTasks: number;
  }): number {
    const tasksPerHour = stats.completedTasks / stats.totalHours;
    const shiftsCompleted = stats.totalShifts;

    // Calculate rating on a scale of 0-5
    return Math.min(5, tasksPerHour * 2 + shiftsCompleted * 0.1);
  }
}
