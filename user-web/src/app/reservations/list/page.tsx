"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
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
  Calendar,
  Clock,
  Users,
  MapPin,
  Search,
  Filter,
  Eye,
  CheckCircle,
  X,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { mockReservations } from "@/mock/mockReservations";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "checked_in", label: "Đã check-in" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

const statusConfig = {
  pending: {
    label: "Chờ Xác Nhận",
    color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
    icon: Clock,
  },
  confirmed: {
    label: "Đã Xác Nhận",
    color: "bg-green-500/20 text-green-600 border-green-500/30",
    icon: CheckCircle,
  },
  checked_in: {
    label: "Đã Check-in",
    color: "bg-blue-500/20 text-blue-600 border-blue-500/30",
    icon: CheckCircle,
  },
  completed: {
    label: "Hoàn Thành",
    color: "bg-gray-500/20 text-gray-600 border-gray-500/30",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Đã Hủy",
    color: "bg-red-500/20 text-red-600 border-red-500/30",
    icon: X,
  },
};

export default function ReservationsListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, upcoming, past

  const filteredReservations = useMemo(() => {
    let filtered = [...mockReservations];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((res) => res.status === statusFilter);
    }

    // Filter by date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateFilter === "today") {
      filtered = filtered.filter((res) => {
        const resDate = new Date(res.date);
        resDate.setHours(0, 0, 0, 0);
        return resDate.getTime() === today.getTime();
      });
    } else if (dateFilter === "upcoming") {
      filtered = filtered.filter((res) => {
        const resDate = new Date(res.date);
        return resDate >= today;
      });
    } else if (dateFilter === "past") {
      filtered = filtered.filter((res) => {
        const resDate = new Date(res.date);
        resDate.setHours(0, 0, 0, 0);
        return resDate < today;
      });
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (res) =>
          res.customer_name.toLowerCase().includes(query) ||
          res.customer_phone.includes(query) ||
          res.table_name.toLowerCase().includes(query) ||
          res.id.toLowerCase().includes(query)
      );
    }

    // Sort: upcoming first, then by date
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime();
    });

    return filtered;
  }, [searchQuery, statusFilter, dateFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-elegant text-4xl md:text-5xl font-bold text-primary mb-2">
                Danh Sách Đặt Bàn
              </h1>
              <p className="text-muted-foreground text-lg">
                Xem và quản lý tất cả đặt bàn của bạn
              </p>
            </div>
            <Button
              className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-md"
              onClick={() => router.push("/reservations")}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Đặt Bàn Mới
            </Button>
          </div>

          {/* Filters */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, SĐT, bàn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-accent/20 focus:border-accent"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-accent/20 focus:border-accent">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="border-accent/20 focus:border-accent">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="today">Hôm nay</SelectItem>
                <SelectItem value="upcoming">Sắp tới</SelectItem>
                <SelectItem value="past">Đã qua</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Reservations List */}
        {filteredReservations.length > 0 ? (
          <div className="grid gap-6">
            {filteredReservations.map((reservation, index) => {
              const status = statusConfig[reservation.status];
              const StatusIcon = status.icon;
              const resDate = new Date(
                `${reservation.date}T${reservation.time}`
              );

              return (
                <motion.div
                  key={reservation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="border-2 border-accent/20 hover:border-accent/50 transition-all shadow-md hover:shadow-xl">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Left: Info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-4 flex-wrap">
                            <div>
                              <h3 className="font-bold text-xl text-primary font-elegant mb-1">
                                {reservation.customer_name}
                              </h3>
                              <p className="text-sm text-muted-foreground font-mono">
                                {reservation.id}
                              </p>
                            </div>
                            <Badge className={cn("text-xs", status.color)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>

                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-accent" />
                              <span className="font-medium">
                                {format(resDate, "EEEE, dd/MM/yyyy", {
                                  locale: vi,
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-accent" />
                              <span className="font-medium">
                                {reservation.time}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-accent" />
                              <span>{reservation.num_people} người</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-accent" />
                              <span>
                                {reservation.table_name} • {reservation.floor}
                              </span>
                            </div>
                            {reservation.pre_orders &&
                              reservation.pre_orders.length > 0 && (
                                <div className="text-muted-foreground">
                                  {reservation.pre_orders.length} món đặt trước
                                </div>
                              )}
                            <div className="font-semibold text-primary">
                              {reservation.total_cost.toLocaleString("vi-VN")}đ
                            </div>
                          </div>

                          {reservation.special_requests && (
                            <p className="text-sm text-muted-foreground italic">
                              "{reservation.special_requests}"
                            </p>
                          )}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90"
                            onClick={() =>
                              router.push(`/reservations/${reservation.id}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Xem Chi Tiết
                          </Button>
                          {reservation.status === "confirmed" &&
                            !reservation.checked_in && (
                              <Button
                                variant="outline"
                                className="w-full border-accent/20 hover:bg-accent/10"
                                onClick={() =>
                                  router.push(`/orders/${reservation.id}`)
                                }
                              >
                                Check-in
                              </Button>
                            )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground text-lg">
              Không tìm thấy đặt bàn nào
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Thử thay đổi bộ lọc hoặc tạo đặt bàn mới
            </p>
            <Button
              className="mt-4 bg-gradient-gold text-primary-foreground hover:opacity-90"
              onClick={() => router.push("/reservations")}
            >
              Đặt Bàn Mới
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
