"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  statsService,
  type MonthlyStats,
  type HourlyStats,
  type CustomerStats,
  type TodayStats,
} from "@/services/statsService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function DashboardStats() {
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerStats[]>([]);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      const [monthlyRes, hourlyRes, customerRes, todayRes] = await Promise.all([
        statsService.getMonthlyStats(),
        statsService.getHourlyStats(),
        statsService.getCustomerStats(),
        statsService.getTodayStats(),
      ]);

      setMonthlyStats(monthlyRes.data?.data || []);
      setHourlyStats(hourlyRes.data?.data || []);
      setCustomerStats(customerRes.data?.data || []);
      setTodayStats(todayRes.data?.data || null);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Overview */}
      {todayStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Doanh thu hôm nay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(todayStats.revenue)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Đơn hàng hôm nay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {todayStats.order_count}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Đặt bàn hôm nay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {todayStats.reservation_count}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistics Tabs */}
      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monthly">Theo tháng</TabsTrigger>
          <TabsTrigger value="hourly">Theo giờ</TabsTrigger>
          <TabsTrigger value="customers">Khách hàng</TabsTrigger>
          <TabsTrigger value="refresh">Làm mới</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thống kê theo tháng (12 tháng gần đây)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={formatDate}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "revenue"
                          ? formatCurrency(Number(value))
                          : value,
                        name === "revenue"
                          ? "Doanh thu"
                          : name === "order_count"
                          ? "Số đơn hàng"
                          : "Số khách hàng",
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#8884d8" name="revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hourly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thống kê theo giờ (24h gần đây)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour_range" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "revenue"
                          ? formatCurrency(Number(value))
                          : value,
                        name === "revenue" ? "Doanh thu" : "Số đơn hàng",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="order_count"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      name="order_count"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thống kê khách hàng (7 ngày gần đây)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={customerStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="day"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString("vi-VN")
                      }
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        value,
                        name === "registered_customers"
                          ? "Khách có tài khoản"
                          : "Khách vãng lai",
                      ]}
                    />
                    <Bar
                      dataKey="registered_customers"
                      fill="#8884d8"
                      name="registered_customers"
                    />
                    <Bar
                      dataKey="walk_in_customers"
                      fill="#82ca9d"
                      name="walk_in_customers"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refresh" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Làm mới dữ liệu</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-32">
              <Button onClick={fetchAllStats} disabled={loading}>
                {loading ? "Đang tải..." : "Làm mới dữ liệu"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
