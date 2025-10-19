"use client";

import React, { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Search,
  Users,
  MapPin,
  CreditCard,
} from "lucide-react";
import { useReservationWebSocket } from "@/hooks/useWebSocket";
import { reservationService } from "@/services/reservationService";
import { useToast } from "@/components/ui/use-toast";

interface Reservation {
  id: string;
  user_id?: string;
  table_id?: string;
  table_group_id?: string;
  reservation_time: string;
  duration_minutes: number;
  num_people: number;
  preferences?: any;
  event_id?: string;
  event_fee?: number;
  status:
    | "pending"
    | "confirmed"
    | "cancelled"
    | "no_show"
    | "checked_in"
    | "completed";
  timeout_minutes: number;
  confirmation_sent: boolean;
  deposit_amount?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // Additional fields from joins
  table_name?: string;
  table_capacity?: number;
  customer_name?: string;
  customer_phone?: string;
  reservation_number?: string;
  special_requests?: string;
  deposit_paid?: boolean;
}

interface ReservationManagementProps {
  className?: string;
}

const RESERVATION_STATUSES = [
  {
    value: "pending",
    label: "Chờ xác nhận",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "confirmed",
    label: "Đã xác nhận",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "checked_in",
    label: "Đã check-in",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "completed",
    label: "Hoàn thành",
    color: "bg-gray-100 text-gray-800",
  },
  { value: "cancelled", label: "Đã hủy", color: "bg-red-100 text-red-800" },
  { value: "no_show", label: "Không đến", color: "bg-red-100 text-red-800" },
];

const TABLE_STATUSES = [
  { value: "available", label: "Trống", color: "bg-green-100 text-green-800" },
  {
    value: "reserved",
    label: "Đã đặt",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "occupied",
    label: "Đang sử dụng",
    color: "bg-red-100 text-red-800",
  },
  {
    value: "maintenance",
    label: "Bảo trì",
    color: "bg-gray-100 text-gray-800",
  },
];

function ReservationManagement({ className }: ReservationManagementProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<
    Reservation[]
  >([]);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { toast } = useToast();

  // WebSocket integration
  const {
    isConnected: isWebSocketConnected,
    joinReservation,
    onReservationCreated,
    onReservationUpdated,
    onReservationStatusChanged,
    onReservationCancelled,
    onReservationCheckedIn,
    onTableStatusChanged,
    onDepositPaymentCompleted,
  } = useReservationWebSocket();

  // Load reservations on component mount
  useEffect(() => {
    loadReservations();
  }, []);

  // WebSocket event listeners
  useEffect(() => {
    if (!isWebSocketConnected) return;

    const handleReservationCreated = (newReservation: Reservation) => {
      setReservations((prev) => [newReservation, ...prev]);
      setLastUpdate(new Date());
      toast({
        title: "Đặt bàn mới",
        description: `Đặt bàn #${newReservation.reservation_number} từ ${newReservation.customer_name}`,
      });
    };

    const handleReservationUpdated = (updatedReservation: Reservation) => {
      setReservations((prev) =>
        prev.map((reservation) =>
          reservation.id === updatedReservation.id
            ? updatedReservation
            : reservation
        )
      );
      setLastUpdate(new Date());

      if (selectedReservation?.id === updatedReservation.id) {
        setSelectedReservation(updatedReservation);
      }
    };

    const handleReservationStatusChanged = (reservation: Reservation) => {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservation.id ? { ...r, status: reservation.status } : r
        )
      );
      setLastUpdate(new Date());

      toast({
        title: "Trạng thái đặt bàn thay đổi",
        description: `Đặt bàn #${
          reservation.reservation_number
        } chuyển sang ${getStatusLabel(reservation.status)}`,
      });
    };

    const handleReservationCancelled = (reservation: Reservation) => {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservation.id ? { ...r, status: "cancelled" } : r
        )
      );
      setLastUpdate(new Date());

      toast({
        title: "Đặt bàn đã hủy",
        description: `Đặt bàn #${reservation.reservation_number} đã được hủy`,
      });
    };

    const handleReservationCheckedIn = (reservation: Reservation) => {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservation.id ? { ...r, status: "checked_in" } : r
        )
      );
      setLastUpdate(new Date());

      toast({
        title: "Khách đã check-in",
        description: `Đặt bàn #${reservation.reservation_number} đã check-in`,
      });
    };

    const handleTableStatusChanged = (data: {
      tableId: string;
      status: string;
    }) => {
      // Update table status in reservations
      setReservations((prev) =>
        prev.map((reservation) => {
          if (reservation.table_id === data.tableId) {
            // You might want to update table status here if you have that field
            return reservation;
          }
          return reservation;
        })
      );
      setLastUpdate(new Date());
    };

    const handleDepositPaymentCompleted = (reservation: Reservation) => {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservation.id ? { ...r, deposit_paid: true } : r
        )
      );
      setLastUpdate(new Date());

      toast({
        title: "Thanh toán cọc thành công",
        description: `Đặt bàn #${reservation.reservation_number} đã thanh toán cọc`,
      });
    };

    onReservationCreated(handleReservationCreated);
    onReservationUpdated(handleReservationUpdated);
    onReservationStatusChanged(handleReservationStatusChanged);
    onReservationCancelled(handleReservationCancelled);
    onReservationCheckedIn(handleReservationCheckedIn);
    onTableStatusChanged(handleTableStatusChanged);
    onDepositPaymentCompleted(handleDepositPaymentCompleted);

    return () => {
      // Cleanup listeners
    };
  }, [
    isWebSocketConnected,
    selectedReservation,
    toast,
    onReservationCreated,
    onReservationUpdated,
    onReservationStatusChanged,
    onReservationCancelled,
    onReservationCheckedIn,
    onTableStatusChanged,
    onDepositPaymentCompleted,
  ]);

  // Filter reservations when search term, status filter, or date filter changes
  useEffect(() => {
    let filtered = reservations;

    if (searchTerm) {
      filtered = filtered.filter(
        (reservation) =>
          reservation.reservation_number
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          reservation.customer_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          reservation.customer_phone?.includes(searchTerm) ||
          reservation.table_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (reservation) => reservation.status === statusFilter
      );
    }

    if (dateFilter) {
      filtered = filtered.filter((reservation) =>
        reservation.reservation_time?.startsWith(dateFilter)
      );
    }

    setFilteredReservations(filtered);
  }, [reservations, searchTerm, statusFilter, dateFilter]);

  const loadReservations = async () => {
    setIsLoading(true);
    try {
      const response = await reservationService.getAllReservations({
        page: 1,
        limit: 100,
        sortBy: "reservation_time",
        sortOrder: "ASC",
      });

      if (response.data?.data?.data) {
        setReservations(response.data.data.data);
      }
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

  const updateReservationStatus = async (
    reservationId: string,
    newStatus: string
  ) => {
    try {
      await reservationService.updateReservationStatus(
        reservationId,
        newStatus
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

  const cancelReservation = async (reservationId: string) => {
    try {
      await reservationService.cancelReservation(reservationId);
      toast({
        title: "Thành công",
        description: "Hủy đặt bàn thành công",
      });
    } catch (error) {
      console.error("Failed to cancel reservation:", error);
      toast({
        title: "Lỗi",
        description: "Không thể hủy đặt bàn",
        variant: "destructive",
      });
    }
  };

  const checkInReservation = async (reservationId: string) => {
    try {
      await reservationService.checkInReservation(reservationId);
      toast({
        title: "Thành công",
        description: "Check-in thành công",
      });
    } catch (error) {
      console.error("Failed to check in reservation:", error);
      toast({
        title: "Lỗi",
        description: "Không thể check-in",
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
      "bg-gray-100 text-gray-800"
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  return (
    <div className={`w-full ${className}`}>
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Quản lý đặt bàn
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* WebSocket Connection Status */}
              <Badge variant={isWebSocketConnected ? "default" : "destructive"}>
                {isWebSocketConnected ? (
                  <>
                    <Wifi className="h-3 w-3 mr-1" />
                    Kết nối
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 mr-1" />
                    Mất kết nối
                  </>
                )}
              </Badge>

              <Button
                variant="outline"
                size="sm"
                onClick={loadReservations}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
                />
                Làm mới
              </Button>
            </div>
      </div>

          {/* Filters */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm đặt bàn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-48"
            />
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
          </div>

          <div className="text-sm text-gray-500">
            Cập nhật lần cuối: {lastUpdate.toLocaleTimeString("vi-VN")}
            </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Danh sách đặt bàn</TabsTrigger>
              <TabsTrigger value="details" disabled={!selectedReservation}>
                Chi tiết đặt bàn
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-4">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Đang tải đặt bàn...</p>
                  </div>
                ) : filteredReservations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Không có đặt bàn nào</p>
                  </div>
                ) : (
                  filteredReservations.map((reservation) => (
                    <Card
                      key={reservation.id}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedReservation?.id === reservation.id
                          ? "ring-2 ring-blue-500"
                          : ""
                      }`}
                      onClick={() => setSelectedReservation(reservation)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">
                                #{reservation.reservation_number}
                              </h3>
                              <Badge
                                className={getStatusColor(reservation.status)}
                              >
                                {getStatusLabel(reservation.status)}
                              </Badge>
                              {reservation.deposit_paid && (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700"
                                >
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Đã cọc
                                </Badge>
                              )}
                    </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Khách hàng:</span>{" "}
                                {reservation.customer_name ||
                                  "Chưa có thông tin"}
                    </div>
                              <div>
                                <span className="font-medium">SĐT:</span>{" "}
                                {reservation.customer_phone ||
                                  "Chưa có thông tin"}
                  </div>
                              <div>
                                <span className="font-medium">Bàn:</span>{" "}
                                {reservation.table_name || "Chưa chọn bàn"} (
                                {reservation.table_capacity || 0} chỗ)
                  </div>
                              <div>
                                <span className="font-medium">Số người:</span>{" "}
                                {reservation.num_people}
                    </div>
                              <div>
                                <span className="font-medium">Ngày:</span>{" "}
                                {formatDate(reservation.reservation_time)}
                    </div>
                              <div>
                                <span className="font-medium">Giờ:</span>{" "}
                                {formatTime(reservation.reservation_time)}
                  </div>
                              {reservation.deposit_amount && (
                                <div>
                                  <span className="font-medium">Cọc:</span>{" "}
                                  {formatCurrency(reservation.deposit_amount)}
                    </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Select
                              value={reservation.status}
                              onValueChange={(value) =>
                                updateReservationStatus(reservation.id, value)
                              }
                            >
                              <SelectTrigger className="w-32">
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
                          <div className="flex gap-1">
                              {reservation.status === "confirmed" && (
                            <Button
                              size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    checkInReservation(reservation.id);
                                  }}
                                >
                                  Check-in
                            </Button>
                              )}
                              {reservation.status !== "cancelled" &&
                                reservation.status !== "completed" && (
                            <Button
                              size="sm"
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      cancelReservation(reservation.id);
                                    }}
                                  >
                                    Hủy
                            </Button>
                                )}
                          </div>
                        </div>
                  </div>
                </CardContent>
              </Card>
                  ))
                )}
            </div>
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              {selectedReservation && (
                <div className="space-y-4">
              <Card>
                <CardHeader>
                      <CardTitle>
                        Chi tiết đặt bàn #
                        {selectedReservation.reservation_number}
                      </CardTitle>
                </CardHeader>
                <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                          <span className="font-medium">Trạng thái:</span>
                          <Badge
                            className={`ml-2 ${getStatusColor(
                              selectedReservation.status
                            )}`}
                          >
                            {getStatusLabel(selectedReservation.status)}
                            </Badge>
                          </div>
                        <div>
                          <span className="font-medium">Khách hàng:</span>{" "}
                          {selectedReservation.customer_name}
                        </div>
            <div>
                          <span className="font-medium">Số điện thoại:</span>{" "}
                          {selectedReservation.customer_phone}
            </div>
                    <div>
                          <span className="font-medium">Bàn:</span>{" "}
                          {selectedReservation.table_name} (
                          {selectedReservation.table_capacity} chỗ)
                    </div>
            <div>
                          <span className="font-medium">Số người:</span>{" "}
                          {selectedReservation.party_size}
            </div>
                <div>
                          <span className="font-medium">Ngày đặt:</span>{" "}
                          {formatDate(selectedReservation.reservation_date)}
                </div>
                <div>
                          <span className="font-medium">Giờ đặt:</span>{" "}
                          {formatTime(selectedReservation.reservation_time)}
                </div>
                <div>
                          <span className="font-medium">Thời gian tạo:</span>{" "}
                          {formatDateTime(selectedReservation.created_at)}
                  </div>
                        {selectedReservation.deposit_amount && (
                <div>
                            <span className="font-medium">Tiền cọc:</span>{" "}
                            {formatCurrency(selectedReservation.deposit_amount)}
                </div>
                        )}
                        {selectedReservation.deposit_paid && (
                <div>
                            <span className="font-medium">Trạng thái cọc:</span>
                            <Badge className="ml-2 bg-green-100 text-green-800">
                              Đã thanh toán
                            </Badge>
                </div>
                        )}
              </div>
              {selectedReservation.special_requests && (
                <div>
                          <span className="font-medium">Yêu cầu đặc biệt:</span>
                          <p className="mt-1 text-gray-600">
                    {selectedReservation.special_requests}
                  </p>
                </div>
              )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default ReservationManagement;
export { ReservationManagement };
