"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import {
  CustomerStats,
  HourlyStats,
  MonthlyStats,
  TodayStats,
  statsService,
} from "@/services/statsService";
import { Order, orderService } from "@/services/orderService";
import { Reservation, reservationService } from "@/services/reservationService";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export function Dashboard() {
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerStats[]>([]);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
    const initialStats = [
      {
        title: "Tổng khách hàng",
        value: "2,847",
        change: "+12%",
        icon: "👥",
        color: "text-blue-600",
      },
      {
        title: "Đơn hàng hôm nay",
        value: "156",
        change: "+8%",
        icon: "🛒",
        color: "text-green-600",
      },
      {
        title: "Doanh thu hôm nay",
        value: "₫12,450,000",
        change: "+15%",
        icon: "💰",
        color: "text-emerald-600",
      },
      {
        title: "Đặt bàn hôm nay",
        value: "42",
        change: "+5%",
        icon: "📅",
        color: "text-purple-600",
      },
      {
        title: "Món ăn phổ biến",
        value: "89",
        change: "+3%",
        icon: "👨‍🍳",
        color: "text-orange-600",
      },
      {
        title: "Tăng trưởng",
        value: "23%",
        change: "+2%",
        icon: "📈",
        color: "text-red-600",
      },
    ];
    const [stats, setStats] = useState(initialStats);
  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      const [monthlyRes, hourlyRes, customerRes, todayRes, orderRes, reservationRes] =
        await Promise.all([
          statsService.getMonthlyStats(),
          statsService.getHourlyStats(),
          statsService.getCustomerStats(),
          statsService.getTodayStats(),
          orderService.getAllOrders({
            page: 1,
            limit: 5,
            sortBy: "created_at",
            sortOrder: "DESC",
          }),
          reservationService.getAllReservations({
            page: 1,
            limit: 5,
            sortBy: "created_at",
            sortOrder: "DESC",
          }),
        ]);
      setMonthlyStats(monthlyRes || []);
      setHourlyStats(hourlyRes || []);
      setCustomerStats(customerRes || []);
      setTodayStats(todayRes || null);
      setOrders(orderRes.data || []);
      setReservations(reservationRes.data || []);
      
       setStats((prev) =>
         prev.map((item) => {
           switch (item.title) {
             case "Đơn hàng hôm nay":
               return { ...item, value: todayRes?.order_count || 0 };
             case "Doanh thu hôm nay":
               return {
                 ...item,
                 value: formatCurrency(todayRes?.revenue || 0),
               };
             case "Đặt bàn hôm nay":
               return { ...item, value: todayRes?.reservation_count || 0 };
             default:
               return item;
           }
         })
       );
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const popularDishesData = [
    { name: "Phở bò tái", orders: 145, revenue: 14500000, percentage: 18.5 },
    { name: "Bún chả", orders: 128, revenue: 11520000, percentage: 16.3 },
    { name: "Cơm tấm", orders: 112, revenue: 8960000, percentage: 14.2 },
    { name: "Bánh mì", orders: 98, revenue: 4900000, percentage: 12.4 },
    { name: "Gỏi cuốn", orders: 87, revenue: 6090000, percentage: 11.0 },
    { name: "Chả cá", orders: 76, revenue: 9120000, percentage: 9.6 },
    { name: "Khác", orders: 142, revenue: 14200000, percentage: 18.0 },
  ];

  const tableUtilizationData = [
    { table: "Bàn 1-5", utilization: 85, capacity: 20, occupied: 17 },
    { table: "Bàn 6-10", utilization: 92, capacity: 24, occupied: 22 },
    { table: "VIP Area", utilization: 78, capacity: 18, occupied: 14 },
    { table: "Rooftop", utilization: 65, capacity: 16, occupied: 10 },
    { table: "Sân vườn", utilization: 88, capacity: 12, occupied: 11 },
  ];

  const customerSatisfactionData = [
    { rating: "5 sao", count: 342, percentage: 68.4 },
    { rating: "4 sao", count: 98, percentage: 19.6 },
    { rating: "3 sao", count: 35, percentage: 7.0 },
    { rating: "2 sao", count: 15, percentage: 3.0 },
    { rating: "1 sao", count: 10, percentage: 2.0 },
  ];

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FFC658",
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <span className={`text-xl ${stat.color}`}>{stat.icon}</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.change}</span> so với
                  tháng trước
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
          <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
          <TabsTrigger value="dishes">Món ăn</TabsTrigger>
          <TabsTrigger value="tables">Bàn ăn</TabsTrigger>
          <TabsTrigger value="satisfaction">Đánh giá</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Doanh thu theo tháng</CardTitle>
                <CardDescription>
                  Xu hướng doanh thu 12 tháng gần nhất
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis
                      tickFormatter={(value) =>
                        `${(value / 1000000).toFixed(0)}M`
                      }
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value.toLocaleString("vi-VN")}đ`,
                        "Doanh thu",
                      ]}
                      labelFormatter={(label) => `Tháng ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Doanh thu theo giờ</CardTitle>
                <CardDescription>
                  Phân bố doanh thu trong ngày hôm nay
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hourlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis
                      tickFormatter={(value) =>
                        `${(value / 1000000).toFixed(1)}M`
                      }
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value.toLocaleString("vi-VN")}đ`,
                        "Doanh thu",
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tổng quan doanh thu</CardTitle>
              <CardDescription>
                So sánh doanh thu, đơn hàng và khách hàng theo tháng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(value) =>
                      `${(value / 1000000).toFixed(0)}M`
                    }
                  />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === "revenue")
                        return [
                          `${value.toLocaleString("vi-VN")}đ`,
                          "Doanh thu",
                        ];
                      return [
                        value.toLocaleString("vi-VN"),
                        name === "orders" ? "Đơn hàng" : "Khách hàng",
                      ];
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    name="Doanh thu"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="#82ca9d"
                    name="Đơn hàng"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="customers"
                    stroke="#ffc658"
                    name="Khách hàng"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Đơn hàng theo giờ</CardTitle>
                <CardDescription>Số lượng đơn hàng trong ngày</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hourlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Giờ cao điểm</CardTitle>
                <CardDescription>Đặt bàn vs khách vãng lai</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={customerStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="registered_customers"
                      stackId="a"
                      fill="#8884d8"
                      name="Khách hệ thống"
                    />
                    <Bar
                      dataKey="walk_in_customers"
                      stackId="a"
                      fill="#82ca9d"
                      name="Khách vãng lai"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Đơn hàng gần đây</CardTitle>
                <CardDescription>
                  Các đơn hàng mới nhất trong hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.length > 0 &&
                    orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div>
                          <p className="font-medium">Đơn hàng #{order.id}</p>
                          <p className="text-sm text-muted-foreground">
                            Khách hàng:{" "}
                            {order?.user?.username || "Khách vãng lai"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(order.final_amount)}
                          </p>
                          {order.status === "paid" ? (
                            <Badge className="bg-green-100 text-green-800">
                              Đã thanh toán
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              Chưa thanh toán
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Đặt bàn hôm nay</CardTitle>
                <CardDescription>Danh sách đặt bàn trong ngày</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reservations.length > 0 &&
                    reservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            Bàn {reservation?.table?.table_number}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {reservation?.num_people} người -{" "}
                            {formatDateTime(reservation?.reservation_time)} - {" "}
                            {formatCurrency(reservation?.deposit_amount)}
                          </p>
                        </div>
                        <div className="text-right">
                          {reservation.status === "confirmed" ? (
                            <Badge className="bg-green-100 text-green-800">
                              Đã xác nhận
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              Chưa xác nhận
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dishes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Món ăn phổ biến</CardTitle>
                <CardDescription>
                  Top món ăn được gọi nhiều nhất
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={popularDishesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) =>
                        `${name} (${percentage}%)`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="orders"
                    >
                      {popularDishesData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, "Số đơn"]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Doanh thu theo món</CardTitle>
                <CardDescription>
                  Đóng góp doanh thu của từng món ăn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={popularDishesData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tickFormatter={(value) =>
                        `${(value / 1000000).toFixed(1)}M`
                      }
                    />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value.toLocaleString("vi-VN")}đ`,
                        "Doanh thu",
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Chi tiết món ăn</CardTitle>
              <CardDescription>
                Thống kê chi tiết về hiệu suất các món ăn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularDishesData.slice(0, 6).map((dish, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index] }}
                      ></div>
                      <div>
                        <p className="font-medium">{dish.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {dish.orders} đơn hàng
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {dish.revenue.toLocaleString("vi-VN")}đ
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {dish.percentage}% tổng doanh thu
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tỷ lệ sử dụng bàn</CardTitle>
                <CardDescription>Hiệu suất sử dụng các khu vực</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tableUtilizationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="table" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value}%`,
                        "Tỷ lệ sử dụng",
                      ]}
                    />
                    <Bar dataKey="utilization" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Công suất bàn</CardTitle>
                <CardDescription>
                  Số bàn đang sử dụng vs tổng số bàn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tableUtilizationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="table" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="occupied"
                      fill="#82ca9d"
                      name="Đang sử dụng"
                    />
                    <Bar dataKey="capacity" fill="#8884d8" name="Tổng số bàn" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Chi tiết sử dụng bàn</CardTitle>
              <CardDescription>
                Thông tin chi tiết về tình trạng các khu vực
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tableUtilizationData.map((area, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{area.table}</h4>
                      <Badge
                        className={
                          area.utilization >= 90
                            ? "bg-red-100 text-red-800"
                            : area.utilization >= 70
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }
                      >
                        {area.utilization}%
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        Đang sử dụng: {area.occupied}/{area.capacity} bàn
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${area.utilization}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="satisfaction" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Phân bố đánh giá</CardTitle>
                <CardDescription>
                  Tỷ lệ các mức đánh giá từ khách hàng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={customerSatisfactionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ rating, percentage }) =>
                        `${rating} (${percentage}%)`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {customerSatisfactionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [value, "Số đánh giá"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chi tiết đánh giá</CardTitle>
                <CardDescription>
                  Số lượng đánh giá theo từng mức
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={customerSatisfactionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tóm tắt đánh giá khách hàng</CardTitle>
              <CardDescription>
                Phân tích chi tiết mức độ hài lòng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">4.6</div>
                    <div className="text-sm text-muted-foreground">
                      Điểm trung bình
                    </div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">500</div>
                    <div className="text-sm text-muted-foreground">
                      Tổng đánh giá
                    </div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      88%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Hài lòng (4-5 sao)
                    </div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">5%</div>
                    <div className="text-sm text-muted-foreground">
                      Không hài lòng (1-2 sao)
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {customerSatisfactionData.map((rating, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-16 text-sm font-medium">
                        {rating.rating}
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full"
                          style={{ width: `${rating.percentage}%` }}
                        ></div>
                      </div>
                      <div className="w-16 text-sm text-muted-foreground text-right">
                        {rating.count} ({rating.percentage}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
