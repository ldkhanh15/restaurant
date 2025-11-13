"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useEnsureAuthenticated } from "@/hooks/useEnsureAuthenticated";
import {
  reservationService,
  type Reservation,
} from "@/services/reservationService";
import { useReservationListStore } from "@/store/reservationListStore";
import { useReservationSocket } from "@/hooks/useReservationSocket";
import { useToast } from "@/components/ui/use-toast";

const statusOptions = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "no_show", label: "Không đến" },
];

const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
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
  completed: {
    label: "Hoàn Thành",
    color: "bg-blue-500/20 text-blue-600 border-blue-500/30",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Đã Hủy",
    color: "bg-red-500/20 text-red-600 border-red-500/30",
    icon: X,
  },
  no_show: {
    label: "Không Đến",
    color: "bg-gray-500/20 text-gray-600 border-gray-500/30",
    icon: AlertCircle,
  },
};

export default function ReservationsListPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useEnsureAuthenticated();
  const { toast } = useToast();
  const reservationSocket = useReservationSocket();

  const {
    reservations,
    isLoading,
    error,
    setReservations,
    setLoading,
    setError,
    updateReservationInList,
    addReservation,
  } = useReservationListStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, upcoming, past

  // Load reservations on mount
  useEffect(() => {
    if (authLoading || !user?.id) {
      return;
    }

    const loadReservations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await reservationService.getMyReservations({
          page: 1,
          limit: 100,
        });
        if (response.status === "success" && response.data?.data) {
          setReservations(response.data.data);
        }
      } catch (err: any) {
        console.error("Failed to load reservations:", err);
        setError(err.message || "Không thể tải danh sách đặt bàn");
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách đặt bàn",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadReservations();
  }, [user?.id, authLoading, setReservations, setLoading, setError]);

  // Update reservation in list helper
  const updateReservation = useCallback(
    (reservationId: string, updates: Partial<Reservation>) => {
      updateReservationInList(reservationId, updates);
    },
    [updateReservationInList]
  );

  // Listen to real-time reservation updates
  useEffect(() => {
    if (!reservationSocket.isConnected) return;

    // Listen to reservation updates
    const handleReservationUpdated = (reservation: any) => {
      console.log("[Reservations] Reservation updated:", reservation);
      updateReservation(reservation.id || reservation.reservationId, {
        status: reservation.status as any,
        updated_at: reservation.updated_at || reservation.updatedAt,
        ...reservation,
      });
    };

    // Listen to status changes
    const handleStatusChanged = (reservation: any) => {
      console.log("[Reservations] Reservation status changed:", reservation);
      updateReservation(reservation.id || reservation.reservationId, {
        status: reservation.status as any,
        updated_at: reservation.updated_at || reservation.updatedAt,
      });
      toast({
        title: "Trạng thái thay đổi",
        description: `Đặt bàn đã chuyển sang "${
          statusConfig[reservation.status]?.label || reservation.status
        }"`,
      });
    };

    // Listen to new reservations
    const handleReservationCreated = (reservation: any) => {
      console.log("[Reservations] New reservation created:", reservation);
      // Only add if it belongs to current user
      if (
        reservation.user_id === user?.id ||
        reservation.customer_id === user?.id
      ) {
        const newReservation: Reservation = {
          id: reservation.id || reservation.reservationId,
          user_id: reservation.user_id,
          customer_id: reservation.customer_id,
          table_id: reservation.table_id,
          reservation_time: reservation.reservation_time,
          num_people: reservation.num_people || 0,
          status: reservation.status || "pending",
          created_at: reservation.created_at || new Date().toISOString(),
          updated_at: reservation.updated_at || new Date().toISOString(),
          pre_order_items: reservation.pre_order_items,
          ...reservation,
        };
        addReservation(newReservation);
        toast({
          title: "Đặt bàn mới",
          description: `Đặt bàn #${(
            reservation.id || reservation.reservationId
          ).slice(0, 8)} đã được tạo`,
          variant: "success",
        });
      }
    };

    // Register all listeners
    reservationSocket.onReservationUpdated(handleReservationUpdated);
    reservationSocket.onReservationStatusChanged(handleStatusChanged);
    reservationSocket.onReservationCreated(handleReservationCreated);

    // Cleanup function
    return () => {
      // Note: Socket listeners are managed by the hook
    };
  }, [
    reservationSocket.isConnected,
    reservationSocket,
    user?.id,
    updateReservation,
    addReservation,
    toast,
  ]);

  const filteredReservations = useMemo(() => {
    let filtered = [...reservations];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((res) => res.status === statusFilter);
    }

    // Filter by date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateFilter === "today") {
      filtered = filtered.filter((res) => {
        const resDate = new Date(res.reservation_time);
        resDate.setHours(0, 0, 0, 0);
        return resDate.getTime() === today.getTime();
      });
    } else if (dateFilter === "upcoming") {
      filtered = filtered.filter((res) => {
        const resDate = new Date(res.reservation_time);
        return resDate >= today;
      });
    } else if (dateFilter === "past") {
      filtered = filtered.filter((res) => {
        const resDate = new Date(res.reservation_time);
        resDate.setHours(0, 0, 0, 0);
        return resDate < today;
      });
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (res) =>
          res.id.toLowerCase().includes(query) ||
          res.table?.table_number?.toLowerCase().includes(query) ||
          (res.user?.full_name &&
            res.user.full_name.toLowerCase().includes(query))
      );
    }

    // Sort: upcoming first, then by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.reservation_time);
      const dateB = new Date(b.reservation_time);
      return dateB.getTime() - dateA.getTime();
    });

    return filtered;
  }, [reservations, searchQuery, statusFilter, dateFilter]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Đang tải danh sách đặt bàn...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.push("/reservations/list")}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

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
                placeholder="Tìm kiếm theo mã, bàn..."
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
              const status =
                statusConfig[reservation.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const resDate = new Date(reservation.reservation_time);

              return (
                <motion.div
                  key={reservation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="border-2 border-accent/20 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-2xl bg-gradient-to-br from-white to-cream-50/50 overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardContent className="p-6 relative">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Left: Info */}
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-4 flex-wrap">
                            <div>
                              <h3 className="font-bold text-xl font-elegant mb-1 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                Đặt bàn #
                                {reservation.id.slice(0, 8).toUpperCase()}
                              </h3>
                              <p className="text-xs text-muted-foreground font-mono">
                                {reservation.id}
                              </p>
                            </div>
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                              }}
                            >
                              <Badge
                                className={cn(
                                  "text-xs px-3 py-1 font-semibold shadow-lg border-2 border-white/20",
                                  status.color
                                )}
                              >
                                <StatusIcon className="h-3 w-3 mr-1.5" />
                                {status.label}
                              </Badge>
                            </motion.div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/20">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span className="font-medium text-gray-700 text-sm">
                                {format(resDate, "EEEE, dd/MM/yyyy", {
                                  locale: vi,
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/5 rounded-full border border-accent/20">
                              <Clock className="h-4 w-4 text-accent" />
                              <span className="font-medium text-gray-700 text-sm">
                                {format(resDate, "HH:mm")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-200">
                              <Users className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-700 text-sm">
                                {reservation.num_people} người
                              </span>
                            </div>
                            {reservation.table && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                                <MapPin className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-green-700 text-sm">
                                  Bàn {reservation.table.table_number}
                                  {reservation.table.location?.floor &&
                                    ` • Tầng ${reservation.table.location.floor}`}
                                </span>
                              </div>
                            )}
                            {reservation.pre_order_items &&
                              reservation.pre_order_items.length > 0 && (
                                <div className="px-3 py-1.5 bg-purple-50 rounded-full border border-purple-200">
                                  <span className="font-medium text-purple-700 text-sm">
                                    {reservation.pre_order_items.length} món đặt
                                    trước
                                  </span>
                                </div>
                              )}
                            {reservation.deposit_amount && (
                              <div className="px-3 py-1.5 bg-yellow-50 rounded-full border border-yellow-200">
                                <span className="font-semibold text-yellow-700 text-sm">
                                  Cọc:{" "}
                                  {Number(
                                    reservation.deposit_amount
                                  ).toLocaleString("vi-VN")}
                                  đ
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all"
                            onClick={() =>
                              router.push(`/reservations/${reservation.id}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Xem Chi Tiết
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <Card className="border-2 border-dashed border-accent/30 bg-gradient-to-br from-cream-50/50 to-white">
              <CardContent className="p-16">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="mb-6"
                >
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
                    <Calendar className="h-20 w-20 mx-auto text-primary/60 relative z-10" />
                  </div>
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">
                  Không tìm thấy đặt bàn nào
                </h3>
                <p className="text-muted-foreground text-base mb-6">
                  {searchQuery || statusFilter !== "all" || dateFilter !== "all"
                    ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                    : "Hãy tạo đặt bàn đầu tiên của bạn"}
                </p>
                <Button
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all"
                  onClick={() => router.push("/reservations")}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Đặt Bàn Mới
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
