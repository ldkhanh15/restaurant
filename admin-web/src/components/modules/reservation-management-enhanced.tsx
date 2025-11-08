"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Wifi,
  WifiOff,
  Plus,
  Minus,
  X,
  ShoppingCart,
} from "lucide-react";
import { api, Reservation, ReservationFilters } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { useWebSocketContext } from "@/providers/WebSocketProvider";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Create reservation dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [activeEvents, setActiveEvents] = useState<any[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [reservationTime, setReservationTime] = useState<string>("");
  const [numPeople, setNumPeople] = useState<number>(2);
  const [durationMinutes, setDurationMinutes] = useState<number>(120);
  const [notes, setNotes] = useState<string>("");
  const [preOrderItems, setPreOrderItems] = useState<
    Array<{ dish_id: string; quantity: number }>
  >([]);
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);

  // WebSocket integration
  const { reservationSocket } = useWebSocketContext();
  const {
    isConnected: isWebSocketConnected,
    onReservationCreated,
    onReservationUpdated,
    onReservationStatusChanged,
    onReservationCheckedIn,
    onDepositPaymentRequested,
    onDepositPaymentCompleted,
    onDepositPaymentFailed,
    onTableAssigned,
    onReservationNoteAdded,
    removeListeners,
  } = reservationSocket;

  // Load reservations and stats on component mount and when filters change
  useEffect(() => {
    loadReservations();
    loadStats();
  }, [currentPage, statusFilter, dateFilter]);

  useEffect(() => {
    if (!showCreateDialog) return;
    (async () => {
      try {
        const [tablesRes, eventsRes, dishesRes] = await Promise.all([
          api.tables.getAll(),
          api.events.getAll(),
          api.dishes.getAll(),
        ]);
        setAvailableTables((tablesRes as any).data || (tablesRes as any));
        setActiveEvents((eventsRes as any).data || (eventsRes as any));
        setDishes((dishesRes as any).data || (dishesRes as any));
      } catch (e) {
        console.error("Failed to load tables/events/dishes", e);
      }
    })();
  }, [showCreateDialog]);

  const handleCreateReservation = async () => {
    if (!selectedTableId || !reservationTime) {
      toast({ title: "Thiếu thông tin", description: "Chọn bàn và thời gian" });
      return;
    }
    try {
      setIsCreatingReservation(true);
      const createData: any = {
        table_id: selectedTableId,
        reservation_time: new Date(reservationTime).toISOString(),
        duration_minutes: durationMinutes,
        num_people: numPeople,
      };

      if (selectedEventId) {
        createData.event_id = selectedEventId;
      }

      if (notes.trim()) {
        createData.preferences = { note: notes.trim() };
      }

      if (preOrderItems.length > 0) {
        createData.pre_order_items = preOrderItems;
      }

      await api.reservations.create(createData);
      setShowCreateDialog(false);
      // Reset form
      setSelectedTableId("");
      setSelectedEventId("");
      setReservationTime("");
      setNumPeople(2);
      setDurationMinutes(120);
      setNotes("");
      setPreOrderItems([]);
      await loadReservations();
      toast({ title: "Thành công", description: "Tạo đặt bàn thành công" });
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo đặt bàn",
        variant: "destructive",
      });
    } finally {
      setIsCreatingReservation(false);
    }
  };

  const addPreOrderItem = (dishId: string, quantity: number = 1) => {
    const existingIndex = preOrderItems.findIndex(
      (item) => item.dish_id === dishId
    );
    if (existingIndex >= 0) {
      const updated = [...preOrderItems];
      updated[existingIndex].quantity += quantity;
      setPreOrderItems(updated);
    } else {
      setPreOrderItems([...preOrderItems, { dish_id: dishId, quantity }]);
    }
  };

  const removePreOrderItem = (dishId: string) => {
    setPreOrderItems(preOrderItems.filter((item) => item.dish_id !== dishId));
  };

  const updatePreOrderQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      removePreOrderItem(dishId);
      return;
    }
    setPreOrderItems(
      preOrderItems.map((item) =>
        item.dish_id === dishId ? { ...item, quantity } : item
      )
    );
  };

  // Load stats when reservations change
  useEffect(() => {
    loadStats();
  }, [reservations]);

  // WebSocket event listeners
  useEffect(() => {
    onReservationCreated((newReservation) => {
      console.log("newReservation", newReservation);
      setReservations((prev) => [newReservation, ...prev]);
      toast({
        title: "Đặt bàn mới",
        description: `Đặt bàn #${newReservation.id} đã được tạo`,
      });
    });

    onReservationUpdated((updatedReservation) => {
      setReservations((prev) =>
        prev.map((reservation) =>
          reservation.id === updatedReservation.id
            ? updatedReservation
            : reservation
        )
      );
    });

    onReservationStatusChanged((reservation) => {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservation.id ? { ...r, status: reservation.status } : r
        )
      );
      toast({
        title: "Trạng thái đặt bàn thay đổi",
        description: `Đặt bàn #${reservation.id} đã chuyển sang ${reservation.status}`,
      });
    });

    onReservationCheckedIn((data) => {
      const { reservation } = data;
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservation.id ? { ...r, status: "checked_in" } : r
        )
      );
      toast({
        title: "Check-in thành công",
        description: `Đặt bàn #${reservation.id} đã check-in`,
        variant: "default",
      });
    });

    onDepositPaymentRequested((data) => {
      const { reservation, payment_url } = data;
      toast({
        title: "Yêu cầu thanh toán cọc",
        description: `Đặt bàn #${reservation.id} cần thanh toán cọc`,
        variant: "default",
      });
    });

    onDepositPaymentCompleted((reservation) => {
      toast({
        title: "Thanh toán cọc hoàn tất",
        description: `Đặt bàn #${reservation.id} đã thanh toán cọc`,
        variant: "default",
      });
    });

    onDepositPaymentFailed((reservation) => {
      toast({
        title: "Thanh toán cọc thất bại",
        description: `Đặt bàn #${reservation.id} thanh toán cọc thất bại`,
        variant: "destructive",
      });
    });

    onTableAssigned((data: any) => {
      const reservationId =
        data.reservationId || data.reservation_id || data.id;
      const table = data.table;
      if (reservationId && table) {
        setReservations((prev) =>
          prev.map((r) => (r.id === reservationId ? { ...r, table } : r))
        );
        toast({
          title: "Bàn đã được chỉ định",
          description: `Đặt bàn #${reservationId} đã được chỉ định bàn`,
          variant: "default",
        });
      }
    });

    onReservationNoteAdded((data: any) => {
      const reservationId =
        data.reservationId || data.reservation_id || data.id;
      if (reservationId) {
        toast({
          title: "Ghi chú đã được thêm",
          description: `Đã thêm ghi chú cho đặt bàn #${reservationId}`,
          variant: "default",
        });
      }
    });

    return () => {
      removeListeners();
    };
  }, [
    onReservationCreated,
    onReservationUpdated,
    onReservationStatusChanged,
    onReservationCheckedIn,
    onDepositPaymentRequested,
    onDepositPaymentCompleted,
    onDepositPaymentFailed,
    onTableAssigned,
    onReservationNoteAdded,
    removeListeners,
    toast,
  ]);

  // Filter reservations locally (for search only, other filters are handled by API)
  useEffect(() => {
    let filtered = reservations;

    if (searchTerm) {
      filtered = filtered.filter(
        (reservation) =>
          reservation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reservation.user?.username
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          reservation.user?.phone?.includes(searchTerm) ||
          reservation.table?.table_number
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReservations(filtered);
  }, [reservations, searchTerm]);

  const loadReservations = async () => {
    setIsLoading(true);
    try {
      const filters: ReservationFilters = {
        page: currentPage,
        limit: pageSize,
      };

    if (statusFilter !== "all") {
        filters.status = statusFilter;
      }

      if (dateFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filters.start_date = today.toISOString();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
        filters.end_date = tomorrow.toISOString();
      } else if (dateFilter === "tomorrow") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        filters.start_date = tomorrow.toISOString();
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
        filters.end_date = dayAfterTomorrow.toISOString();
      } else if (dateFilter === "this_week") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filters.start_date = today.toISOString();
        const weekLater = new Date(today);
        weekLater.setDate(weekLater.getDate() + 7);
        filters.end_date = weekLater.toISOString();
      }

      const response = await api.reservations.getAll(filters);
      setReservations(Array.isArray(response.data) ? response.data : []);

      if (response.pagination) {
        setTotalPages(response.pagination.totalPages || 1);
        setTotalItems(response.pagination.total || 0);
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
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return format(date, "dd/MM/yyyy HH:mm");
  };

  const getRelativeTime = (dateString: string) => {
    if (!dateString) return "N/A";
    const now = new Date();
    const reservationDateTime = new Date(dateString);
    if (isNaN(reservationDateTime.getTime())) return "Invalid date";
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
        <Card className="border-amber-100 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-amber-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700/80 uppercase tracking-wide">
                  Tổng đặt bàn
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                  {stats.totalReservations}
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md">
                <Calendar className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-orange-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700/80 uppercase tracking-wide">
                  Chờ xác nhận
                </p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.pendingReservations}
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-md">
                <Clock className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Reservation Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo đặt bàn mới</DialogTitle>
              <DialogDescription>
                Chọn bàn, thời gian và (tuỳ chọn) sự kiện cho đặt bàn.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Chọn bàn</label>
                <Select
                  value={selectedTableId}
                  onValueChange={setSelectedTableId}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn bàn" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTables.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        Bàn {t.table_number} - {t.capacity} người
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Thời gian</label>
                <Input
                  type="datetime-local"
                  value={reservationTime}
                  onChange={(e) => setReservationTime(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Số người</label>
                  <Input
                    type="number"
                    min={1}
                    value={numPeople}
                    onChange={(e) => setNumPeople(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Thời lượng (phút)
                  </label>
                  <Input
                    type="number"
                    min={30}
                    step={30}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Sự kiện (tuỳ chọn)
                </label>
                <Select
                  value={selectedEventId}
                  onValueChange={setSelectedEventId}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Không chọn" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeEvents.map((ev: any) => (
                      <SelectItem key={ev.id} value={ev.id}>
                        {ev.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pre-order Items */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Đặt món trước (tuỳ chọn)
                </label>
                <div className="space-y-2">
                  {preOrderItems.length > 0 && (
                    <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                      {preOrderItems.map((item) => {
                        const dish = dishes.find(
                          (d: any) => d.id === item.dish_id
                        );
                        return (
                          <div
                            key={item.dish_id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {dish?.name || "Unknown"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {dish?.price &&
                                  `Giá: ${dish.price.toLocaleString()}đ`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  updatePreOrderQuantity(
                                    item.dish_id,
                                    item.quantity - 1
                                  )
                                }
                                className="h-7 w-7 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  updatePreOrderQuantity(
                                    item.dish_id,
                                    item.quantity + 1
                                  )
                                }
                                className="h-7 w-7 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removePreOrderItem(item.dish_id)}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Select
                    onValueChange={(dishId) => {
                      addPreOrderItem(dishId, 1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn món để đặt trước" />
                    </SelectTrigger>
                    <SelectContent>
                      {dishes
                        .filter(
                          (d: any) =>
                            !preOrderItems.some((item) => item.dish_id === d.id)
                        )
                        .map((dish: any) => (
                          <SelectItem key={dish.id} value={dish.id}>
                            {dish.name} - {dish.price?.toLocaleString()}đ
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">
                  Ghi chú / Yêu cầu đặc biệt (tuỳ chọn)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={handleCreateReservation}
                disabled={
                  isCreatingReservation || !selectedTableId || !reservationTime
                }
              >
                {isCreatingReservation ? "Đang tạo..." : "Tạo đặt bàn"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="border-blue-100 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-blue-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700/80 uppercase tracking-wide">
                  Đã xác nhận
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.confirmedReservations}
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                <CheckCircle className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-100 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-green-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700/80 uppercase tracking-wide">
                  Đã check-in
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.checkedInReservations}
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                <UserCheck className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WebSocket Status */}
      <Card className="border-amber-100 shadow-md bg-gradient-to-r from-amber-50/50 to-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isWebSocketConnected ? (
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Wifi className="h-5 w-5 text-emerald-600" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <WifiOff className="h-5 w-5 text-red-600" />
                </div>
              )}
            <div>
                <p className="text-sm font-medium text-gray-600">
                  Trạng thái kết nối
              </p>
                <p className="text-base font-bold">
                {isWebSocketConnected ? (
                    <span className="text-emerald-600">Đang hoạt động</span>
                ) : (
                  <span className="text-red-600">Mất kết nối</span>
                )}
              </p>
            </div>
            </div>
            {isWebSocketConnected && (
              <Badge className="bg-emerald-500 text-white px-3 py-1 text-xs">
                Realtime
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card className="border-amber-100 shadow-lg bg-white">
        <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50/30 to-white">
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <Filter className="h-5 w-5 text-amber-600" />
            Bộ lọc và tìm kiếm
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-500" />
                <Input
                  placeholder="Tìm kiếm số đặt bàn, khách hàng, SĐT, bàn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-amber-200 focus-visible:ring-amber-500 bg-white shadow-sm"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 border-amber-200 focus:ring-amber-500 shadow-sm">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent className="border-amber-200">
                <SelectItem value="all" className="focus:bg-amber-50">
                  Tất cả trạng thái
                </SelectItem>
                {RESERVATION_STATUSES.map((status) => (
                  <SelectItem
                    key={status.value}
                    value={status.value}
                    className="focus:bg-amber-50"
                  >
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-48 border-amber-200 focus:ring-amber-500 shadow-sm">
                <SelectValue placeholder="Lọc theo thời gian" />
              </SelectTrigger>
              <SelectContent className="border-amber-200">
                <SelectItem value="all" className="focus:bg-amber-50">
                  Tất cả thời gian
                </SelectItem>
                <SelectItem value="today" className="focus:bg-amber-50">
                  Hôm nay
                </SelectItem>
                <SelectItem value="tomorrow" className="focus:bg-amber-50">
                  Ngày mai
                </SelectItem>
                <SelectItem value="this_week" className="focus:bg-amber-50">
                  Tuần này
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={loadReservations}
              disabled={isLoading}
              className="border-amber-300 hover:bg-amber-50 hover:text-amber-900 shadow-sm"
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
      <Card className="border-amber-100 shadow-lg bg-white">
        <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50/30 to-white">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-amber-900">
              <Calendar className="h-5 w-5 text-amber-600" />
              Danh sách đặt bàn
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-900 font-semibold"
              >
                {totalItems > 0 ? totalItems : filteredReservations.length}
              </Badge>
            </span>
            <div className="flex items-center gap-3">
              {isWebSocketConnected && (
                <Badge className="bg-emerald-500 text-white flex items-center gap-1.5 px-3 py-1">
                  <Wifi className="h-3 w-3" />
                  Realtime
                </Badge>
              )}
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Tạo đặt bàn
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-10 w-10 animate-spin mx-auto mb-4 text-amber-600" />
              <p className="text-gray-600 font-medium">Đang tải đặt bàn...</p>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-amber-300" />
              <p className="text-gray-500 font-medium">Không có đặt bàn nào</p>
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
                        className="hover:bg-amber-50/50 transition-colors border-b border-gray-100"
                      >
                        <TableCell className="font-medium py-4">
                          <div>
                            <p className="font-bold text-amber-900">
                              #{reservation.id}
                            </p>
                            <p className="text-xs text-amber-600 font-medium mt-0.5">
                              {getRelativeTime(reservation.reservation_time)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                                <User className="h-4 w-4 text-amber-700" />
                              </div>
                              <span className="font-semibold text-gray-900">
                                {reservation.user?.username || "Khách vãng lai"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 ml-10">
                              <Phone className="h-3 w-3 text-amber-500" />
                              <span className="text-sm text-gray-600">
                                {reservation.user?.phone || "N/A"}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {reservation.table?.table_number || "N/A"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Sức chứa: {reservation.table?.capacity || 0}{" "}
                                người
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
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                              <StatusIcon className="h-4 w-4 text-blue-700" />
                            </div>
                            <Badge
                              className={`status-badge ${getStatusColor(
                                reservation.status
                              )} font-medium px-3 py-1`}
                            >
                              {getStatusLabel(reservation.status)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/reservations/${reservation.id}`)
                              }
                              className="border-amber-300 hover:bg-amber-50 hover:text-amber-900 shadow-sm"
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
                              <SelectTrigger className="w-36 h-9 border-amber-200 focus:ring-amber-500 shadow-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="border-amber-200">
                                {RESERVATION_STATUSES.map((status) => (
                                  <SelectItem
                                    key={status.value}
                                    value={status.value}
                                    className="focus:bg-amber-50"
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
                              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 shadow-sm"
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-amber-100 bg-amber-50/30">
              <p className="text-sm text-gray-600 font-medium">
                Hiển thị{" "}
                <span className="text-amber-700 font-bold">
                  {(currentPage - 1) * pageSize + 1}
                </span>{" "}
                -{" "}
                <span className="text-amber-700 font-bold">
                  {Math.min(currentPage * pageSize, totalItems)}
                </span>{" "}
                trên tổng số{" "}
                <span className="text-amber-700 font-bold">{totalItems}</span>{" "}
                đặt bàn
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1 || isLoading}
                  className="border-amber-300 hover:bg-amber-50 hover:text-amber-900"
                >
                  ← Trang trước
                </Button>
                <div className="flex items-center gap-1 px-3 py-1 bg-white border border-amber-200 rounded-md shadow-sm">
                  <span className="text-sm font-medium text-gray-600">
                    Trang
                  </span>
                  <span className="text-sm font-bold text-amber-700">
                    {currentPage}
                  </span>
                  <span className="text-sm font-medium text-gray-600">/</span>
                  <span className="text-sm font-bold text-amber-700">
                    {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages || isLoading}
                  className="border-amber-300 hover:bg-amber-50 hover:text-amber-900"
                >
                  Trang sau →
                </Button>
              </div>
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
              Bạn có chắc chắn muốn xóa đặt bàn #{reservationToDelete?.id}? Hành
              động này không thể hoàn tác.
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
