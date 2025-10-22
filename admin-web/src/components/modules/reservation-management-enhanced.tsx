"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  MapPin,
  Phone,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  AlertCircle,
  CalendarDays,
  User,
} from "lucide-react";
import { api, Reservation, ReservationFilters } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const RESERVATION_STATUSES = [
  {
    value: "pending",
    label: "Chờ xác nhận",
    color: "status-pending",
    icon: Clock,
  },
  {
    value: "confirmed",
    label: "Đã xác nhận",
    color: "status-confirmed",
    icon: CheckCircle,
  },
  {
    value: "checked_in",
    label: "Đã check-in",
    color: "status-ready",
    icon: UserCheck,
  },
  {
    value: "completed",
    label: "Hoàn thành",
    color: "status-completed",
    icon: CheckCircle,
  },
  {
    value: "cancelled",
    label: "Đã hủy",
    color: "status-cancelled",
    icon: XCircle,
  },
  {
    value: "no_show",
    label: "Không đến",
    color: "status-cancelled",
    icon: XCircle,
  },
];

interface ReservationManagementEnhancedProps {
  className?: string;
}

export function ReservationManagementEnhanced({
  className,
}: ReservationManagementEnhancedProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<
    Reservation[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reservationToDelete, setReservationToDelete] =
    useState<Reservation | null>(null);
  const [stats, setStats] = useState({
    totalReservations: 0,
    pendingReservations: 0,
    confirmedReservations: 0,
    checkedInReservations: 0,
  });

  // Load reservations and stats on component mount
  useEffect(() => {
    loadReservations();
  }, []);

  // Load stats when reservations change
  useEffect(() => {
    loadStats();
  }, [reservations]);

  // Filter reservations when search term or filters change
  useEffect(() => {
    let filtered = reservations;

    if (searchTerm) {
      filtered = filtered.filter(
        (reservation) =>
          reservation.id
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          reservation.user.username
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          reservation.user.phone?.includes(searchTerm) ||
          reservation.table.table_number
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (reservation) => reservation.status === statusFilter
      );
    }

    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() + 7);

      filtered = filtered.filter((reservation) => {
        const reservationDate = new Date(reservation.reservation_time);
        switch (dateFilter) {
          case "today":
            return reservationDate.toDateString() === today.toDateString();
          case "tomorrow":
            return reservationDate.toDateString() === tomorrow.toDateString();
          case "this_week":
            return reservationDate >= today && reservationDate <= thisWeek;
          default:
            return true;
        }
      });
    }

    setFilteredReservations(filtered);
  }, [reservations, searchTerm, statusFilter, dateFilter]);

  const loadReservations = async () => {
    setIsLoading(true);
    try {
      const response = await api.reservations.getAll({
        page: 1,
        limit: 100,
      });
      setReservations(response.data);
    } catch (error) {
      console.error("Failed to load reservations:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách đặt bàn",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = () => {
    // Calculate stats from reservations data
    const total = reservations.length;
    const pending = reservations.filter((r) => r.status === "pending").length;
    const confirmed = reservations.filter(
      (r) => r.status === "confirmed"
    ).length;
    const checkedIn = reservations.filter(
      (r) => r.status === "checked_in"
    ).length;

    setStats({
      totalReservations: total,
      pendingReservations: pending,
      confirmedReservations: confirmed,
      checkedInReservations: checkedIn,
    });
  };

  const updateReservationStatus = async (
    reservationId: string,
    newStatus: string
  ) => {
    try {
      await api.reservations.updateStatus(reservationId, newStatus);
      setReservations((prev) =>
        prev.map((reservation) =>
          reservation.id === reservationId
            ? { ...reservation, status: newStatus as any }
            : reservation
        )
      );
      toast({
        title: "Thành công",
        description: "Cập nhật trạng thái đặt bàn thành công",
      });
    } catch (error) {
      console.error("Failed to update reservation status:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái đặt bàn",
        variant: "destructive",
      });
    }
  };

  const checkInReservation = async (reservationId: string) => {
    try {
      await api.reservations.checkIn(reservationId);
      setReservations((prev) =>
        prev.map((reservation) =>
          reservation.id === reservationId
            ? { ...reservation, status: "checked_in" as any }
            : reservation
        )
      );
      toast({
        title: "Thành công",
        description: "Check-in đặt bàn thành công",
      });
    } catch (error) {
      console.error("Failed to check in reservation:", error);
      toast({
        title: "Lỗi",
        description: "Không thể check-in đặt bàn",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReservation = async () => {
    if (!reservationToDelete) return;

    try {
      // Note: This would need to be implemented in the API
      // await api.reservations.delete(reservationToDelete.id);
      setReservations((prev) =>
        prev.filter((reservation) => reservation.id !== reservationToDelete.id)
      );
      await api.reservations.delete(reservationToDelete.id);
      setShowDeleteDialog(false);
      setReservationToDelete(null);
      toast({
        title: "Thành công",
        description: "Xóa đặt bàn thành công",
      });
    } catch (error) {
      console.error("Failed to delete reservation:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa đặt bàn",
        variant: "destructive",
      });
    }
  };

  const getStatusLabel = (status: string) => {
    return (
      RESERVATION_STATUSES.find((s) => s.value === status)?.label || status
    );
  };

  const getStatusColor = (status: string) => {
    return (
      RESERVATION_STATUSES.find((s) => s.value === status)?.color ||
      "status-pending"
    );
  };

  const getStatusIcon = (status: string) => {
    const statusConfig = RESERVATION_STATUSES.find((s) => s.value === status);
    return statusConfig?.icon || Clock;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(`${dateString}`);
    return format(date, "dd/MM/yyyy HH:mm");
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const reservationDateTime = new Date(dateString);
    const diffInHours = Math.floor(
      (reservationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 0) return "Đã qua";
    if (diffInHours < 1) return "Sắp tới";
    if (diffInHours < 24) return `${diffInHours} giờ nữa`;
    return `${Math.floor(diffInHours / 24)} ngày nữa`;
  };

  const isUpcoming = (dateString: string) => {
    const now = new Date();
    const reservationDateTime = new Date(dateString);
    return reservationDateTime > now;
  };

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tổng đặt bàn
                </p>
                <p className="text-2xl font-bold gold-text">
                  {stats.totalReservations}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Chờ xác nhận
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.pendingReservations}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Đã xác nhận
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.confirmedReservations}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Đã check-in
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.checkedInReservations}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Bộ lọc và tìm kiếm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo số đặt bàn, tên khách hàng, số điện thoại, bàn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 luxury-focus"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {RESERVATION_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Lọc theo thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả thời gian</SelectItem>
                <SelectItem value="today">Hôm nay</SelectItem>
                <SelectItem value="tomorrow">Ngày mai</SelectItem>
                <SelectItem value="this_week">Tuần này</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={loadReservations}
              disabled={isLoading}
              className="luxury-focus"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Danh sách đặt bàn ({filteredReservations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Đang tải đặt bàn...</p>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không có đặt bàn nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Số đặt bàn</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Bàn</TableHead>
                    <TableHead>Số người</TableHead>
                    <TableHead>Ngày giờ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                      {filteredReservations.map((reservation) => {
                    console.log(reservation);
                    const StatusIcon = getStatusIcon(reservation.status);
                    const isUpcomingReservation = isUpcoming(
                      reservation.reservation_time
                    );
                    return (
                      <TableRow
                        key={reservation.id}
                        className="hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">#{reservation.id}</p>
                            <p className="text-xs text-muted-foreground">
                              {getRelativeTime(reservation.reservation_time)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {reservation.user.username}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {reservation.user.phone}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {reservation.table.table_number}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Sức chứa: {reservation.table.capacity} người
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {reservation.num_people}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">
                              {formatDateTime(reservation.reservation_time)}
                            </p>
                            {isUpcomingReservation && (
                              <p className="text-xs text-green-600">Sắp tới</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4" />
                            <Badge
                              className={`status-badge ${getStatusColor(
                                reservation.status
                              )}`}
                            >
                              {getStatusLabel(reservation.status)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/reservations/${reservation.id}`)
                              }
                              className="luxury-focus"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {reservation.status === "confirmed" &&
                              isUpcomingReservation && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    checkInReservation(reservation.id)
                                  }
                                  className="text-green-600 hover:text-green-600"
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                              )}
                            <Select
                              value={reservation.status}
                              onValueChange={(value) =>
                                updateReservationStatus(reservation.id, value)
                              }
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {RESERVATION_STATUSES.map((status) => (
                                  <SelectItem
                                    key={status.value}
                                    value={status.value}
                                  >
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReservationToDelete(reservation);
                                setShowDeleteDialog(true);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Xác nhận xóa đặt bàn
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa đặt bàn #
              {reservationToDelete?.id}? Hành động này không thể
              hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteReservation}
              className="bg-destructive hover:bg-destructive/90"
            >
              Xóa đặt bàn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ReservationManagementEnhanced;
