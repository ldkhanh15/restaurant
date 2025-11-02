"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, ShoppingCart, Filter, Search, Calendar } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// Mock orders - replace with API
const mockOrders = [
  {
    id: "ORD-001",
    date: "2024-02-15T19:00:00Z",
    status: "preparing",
    total: 1200000,
    items_count: 4,
    table: "Bàn 12",
  },
  {
    id: "ORD-002",
    date: "2024-02-10T18:30:00Z",
    status: "completed",
    total: 850000,
    items_count: 3,
    table: "Bàn 8",
  },
  {
    id: "ORD-003",
    date: "2024-02-08T20:00:00Z",
    status: "cancelled",
    total: 500000,
    items_count: 2,
    table: "Bàn 5",
  },
];

const statusConfig = {
  preparing: { label: "Đang chuẩn bị", color: "bg-yellow-500" },
  serving: { label: "Đang phục vụ", color: "bg-blue-500" },
  completed: { label: "Hoàn thành", color: "bg-green-500" },
  cancelled: { label: "Đã hủy", color: "bg-red-500" },
};

export default function OrdersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch = order.id
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    // Add date filter logic if needed
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-primary mb-2">
            Đơn Hàng Của Tôi
          </h1>
          <p className="text-muted-foreground">
            Xem và quản lý tất cả đơn hàng của bạn
          </p>
        </motion.div>

        {/* Filters */}
        <Card className="mb-6 border-accent/20">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm đơn hàng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-accent/20 focus:border-accent"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 border-accent/20">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order, index) => {
              const status =
                statusConfig[order.status as keyof typeof statusConfig];
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-accent/50"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              {order.id}
                            </h3>
                            <Badge className={`${status.color} text-white`}>
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(
                                new Date(order.date),
                                "dd/MM/yyyy HH:mm",
                                { locale: vi }
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <ShoppingCart className="h-4 w-4" />
                              {order.items_count} món
                            </div>
                            <div>{order.table}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {order.total.toLocaleString("vi-VN")}đ
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/orders/${order.id}`);
                            }}
                            className="mt-2"
                          >
                            Chi tiết →
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Không tìm thấy đơn hàng nào
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
