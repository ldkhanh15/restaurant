"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
import {
  Clock,
  ShoppingCart,
  Filter,
  Search,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  containerVariants,
  itemVariants,
  cardVariants,
  pageVariants,
  buttonVariants,
  viewportOptions,
} from "@/lib/motion-variants";

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
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 py-8"
    >
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-elegant text-4xl md:text-5xl font-bold text-primary mb-2"
          >
            Đơn Hàng Của Tôi
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg"
          >
            Xem và quản lý tất cả đơn hàng của bạn
          </motion.p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mb-6 border-2 border-accent/20 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-4">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col md:flex-row gap-4"
              >
                <motion.div
                  variants={itemVariants}
                  className="relative flex-1"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Tìm kiếm đơn hàng..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-accent/20 focus:border-accent transition-all duration-200"
                  />
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                >
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48 border-accent/20 focus:border-accent transition-all duration-200">
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
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Orders List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order, index) => {
                const status =
                  statusConfig[order.status as keyof typeof statusConfig];
                return (
                  <motion.div
                    key={order.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, x: -20, scale: 0.95 }}
                    whileHover="hover"
                    whileTap="tap"
                    custom={index}
                    viewport={viewportOptions}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-accent/50 shadow-md bg-card"
                      onClick={() => router.push(`/orders/${order.id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <motion.h3
                                whileHover={{ scale: 1.05 }}
                                className="font-semibold text-lg font-elegant"
                              >
                                {order.id}
                              </motion.h3>
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                transition={{ type: "spring", stiffness: 400 }}
                              >
                                <Badge
                                  className={`${status.color} text-white shadow-md`}
                                >
                                  {status.label}
                                </Badge>
                              </motion.div>
                            </div>
                            <motion.div
                              variants={containerVariants}
                              initial="hidden"
                              animate="visible"
                              className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground"
                            >
                              <motion.div
                                variants={itemVariants}
                                className="flex items-center gap-1"
                              >
                                <Calendar className="h-4 w-4 text-accent" />
                                {format(
                                  new Date(order.date),
                                  "dd/MM/yyyy HH:mm",
                                  { locale: vi }
                                )}
                              </motion.div>
                              <motion.div
                                variants={itemVariants}
                                className="flex items-center gap-1"
                              >
                                <ShoppingCart className="h-4 w-4 text-accent" />
                                {order.items_count} món
                              </motion.div>
                              <motion.div variants={itemVariants}>
                                {order.table}
                              </motion.div>
                            </motion.div>
                          </div>
                          <div className="text-right">
                            <motion.p
                              key={order.total}
                              initial={{ scale: 1.1 }}
                              animate={{ scale: 1 }}
                              className="text-2xl font-bold text-primary mb-2"
                            >
                              {order.total.toLocaleString("vi-VN")}đ
                            </motion.p>
                            <motion.div
                              variants={buttonVariants}
                              whileHover="hover"
                              whileTap="tap"
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/orders/${order.id}`);
                                }}
                                className="mt-2 border-accent/20 hover:bg-accent/10"
                              >
                                Chi tiết
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="border-2 border-accent/20">
                  <CardContent className="p-12 text-center">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    </motion.div>
                    <p className="text-muted-foreground text-lg">
                      Không tìm thấy đơn hàng nào
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
