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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  TrendingUp,
  Calendar,
  User,
  MapPin,
  AlertCircle,
  Receipt,
} from "lucide-react";
import { api, Payment, PaymentFilters } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

const PAYMENT_STATUSES = [
  {
    value: "pending",
    label: "Chờ xử lý",
    color: "status-pending",
    icon: Clock,
  },
  {
    value: "completed",
    label: "Hoàn thành",
    color: "status-completed",
    icon: CheckCircle,
  },
  {
    value: "failed",
    label: "Thất bại",
    color: "status-cancelled",
    icon: XCircle,
  },
  {
    value: "refunded",
    label: "Đã hoàn tiền",
    color: "status-cancelled",
    icon: XCircle,
  },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Tiền mặt", icon: DollarSign },
  { value: "card", label: "Thẻ", icon: CreditCard },
  { value: "vnpay", label: "VNPay", icon: CreditCard },
  { value: "bank_transfer", label: "Chuyển khoản", icon: CreditCard },
];

interface PaymentManagementProps {
  className?: string;
}

export function PaymentManagement({ className }: PaymentManagementProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [stats, setStats] = useState({
    average_order_value: 0,
    average_reservation_value: 0,
    total_orders: 0,
    total_payments: 0,
    total_reservations: 0,
    total_revenue:0
  });
  // Load payments and stats on component mount
  useEffect(() => {
    loadPayments();
    loadStats();
  }, []);

  // Filter payments when search term or filters change
  useEffect(() => {
    let filtered = payments;

    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          payment?.order?.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment?.order?.table?.table_number
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          payment?.reservation?.table?.table_number
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          payment.transaction_id
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    if (methodFilter !== "all") {
      filtered = filtered.filter(
        (payment) => payment.method === methodFilter
      );
    }

    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() - 7);

      filtered = filtered.filter((payment) => {
        const paymentDate = new Date(payment.created_at);
        switch (dateFilter) {
          case "today":
            return paymentDate >= today;
          case "yesterday":
            return paymentDate >= yesterday && paymentDate < today;
          case "this_week":
            return paymentDate >= thisWeek;
          default:
            return true;
        }
      });
    }

    setFilteredPayments(filtered);
  }, [payments, searchTerm, statusFilter, methodFilter, dateFilter]);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const response = await api.payments.getAll({
        page: 1,
        limit: 100,
      });
      setPayments(response);
    } catch (error) {
      console.error("Failed to load payments:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách thanh toán",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.payments.getRevenueStats();
      setStats(response);
      console.log('response',response)
    } catch (error) {
      console.error("Failed to load payment stats:", error);
    }
  };

  const getStatusLabel = (status: string) => {
    return PAYMENT_STATUSES.find((s) => s.value === status)?.label || status;
  };

  const getStatusColor = (status: string) => {
    return (
      PAYMENT_STATUSES.find((s) => s.value === status)?.color ||
      "status-pending"
    );
  };

  const getStatusIcon = (status: string) => {
    const statusConfig = PAYMENT_STATUSES.find((s) => s.value === status);
    return statusConfig?.icon || Clock;
  };

  const getMethodLabel = (method: string) => {
    return PAYMENT_METHODS.find((m) => m.value === method)?.label || method;
  };

  const getMethodIcon = (method: string) => {
    const methodConfig = PAYMENT_METHODS.find((m) => m.value === method);
    return methodConfig?.icon || CreditCard;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm");
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const paymentDate = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - paymentDate.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
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
                  Tổng doanh thu
                </p>
                <p className="text-2xl font-bold gold-text">
                  {formatCurrency(stats.total_revenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tổng thanh toán
                </p>
                <p className="text-2xl font-bold gold-text">
                  {stats.total_payments}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Số tiền thanh toán hóa đơn trung bình
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.average_order_value}
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
                  Số tiền thanh toán đặt cọc trung bình
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.average_reservation_value}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Method */}
      {/* {Object.keys(stats?.revenueByMethod || {}).length > 0 && (
        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Doanh thu theo phương thức
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(stats.revenueByMethod).map(
                ([method, revenue]) => {
                  const MethodIcon = getMethodIcon(method);
                  return (
                    <div
                      key={method}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <MethodIcon className="h-5 w-5 text-primary" />
                        <span className="font-medium">
                          {getMethodLabel(method)}
                        </span>
                      </div>
                      <span className="font-semibold gold-text">
                        {formatCurrency(revenue)}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>
      )} */}

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
                  placeholder="Tìm kiếm theo số đơn hàng, khách hàng, bàn, mã giao dịch..."
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
                {PAYMENT_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Lọc theo phương thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phương thức</SelectItem>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
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
                <SelectItem value="yesterday">Hôm qua</SelectItem>
                <SelectItem value="this_week">Tuần này</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={loadPayments}
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

      {/* Payments Table */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Danh sách thanh toán ({filteredPayments?.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Đang tải thanh toán...</p>
            </div>
          ) : filteredPayments?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không có thanh toán nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã giao dịch</TableHead>
                    <TableHead>Đơn hàng</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Bàn</TableHead>
                    <TableHead>Phương thức</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const StatusIcon = getStatusIcon(payment.status);
                    const MethodIcon = getMethodIcon(payment.method);
                    return (
                      <TableRow
                        key={payment.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => router.push(`/payments/${payment.id}`)}
                      >
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">
                              {payment.transaction_id ||
                                payment.transaction_id ||
                                `#${payment.id.slice(-8)}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getRelativeTime(payment.created_at)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              #{payment?.order?.id || payment?.reservation?.id}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{"Khách vãng lai"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {payment?.order?.table?.table_number ||
                                payment?.reservation?.table?.table_number}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MethodIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{getMethodLabel(payment.method)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold gold-text">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4" />
                            <Badge
                              className={`status-badge ${getStatusColor(
                                payment.status
                              )}`}
                            >
                              {getStatusLabel(payment.status)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{formatDateTime(payment.created_at)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog
                            open={
                              showPaymentDialog &&
                              selectedPayment?.id === payment.id
                            }
                            onOpenChange={(open) => {
                              setShowPaymentDialog(open);
                              if (!open) setSelectedPayment(null);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedPayment(payment)}
                                className="luxury-focus"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <CreditCard className="h-5 w-5 text-primary" />
                                  Chi tiết thanh toán
                                </DialogTitle>
                                <DialogDescription>
                                  Thông tin chi tiết về giao dịch thanh toán
                                </DialogDescription>
                              </DialogHeader>
                              {selectedPayment && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">
                                        Mã giao dịch
                                      </Label>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedPayment.transaction_id ||
                                          selectedPayment.transaction_id ||
                                          `#${selectedPayment.id.slice(-8)}`}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">
                                        Số đơn hàng
                                      </Label>
                                      <p className="text-sm text-muted-foreground">
                                        #
                                        {selectedPayment?.order?.id ||
                                          selectedPayment?.reservation?.id}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">
                                        Khách hàng
                                      </Label>
                                      <p className="text-sm text-muted-foreground">
                                        {"Khách vãng lai"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">
                                        Bàn
                                      </Label>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedPayment?.order?.table
                                          ?.table_number ||
                                          selectedPayment?.reservation?.table
                                            ?.table_number}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">
                                        Phương thức
                                      </Label>
                                      <p className="text-sm text-muted-foreground">
                                        {getMethodLabel(selectedPayment.method)}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">
                                        Số tiền
                                      </Label>
                                      <p className="text-sm font-semibold gold-text">
                                        {formatCurrency(selectedPayment.amount)}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">
                                        Trạng thái
                                      </Label>
                                      <Badge
                                        className={`status-badge ${getStatusColor(
                                          selectedPayment.status
                                        )}`}
                                      >
                                        {getStatusLabel(selectedPayment.status)}
                                      </Badge>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">
                                        Thời gian
                                      </Label>
                                      <p className="text-sm text-muted-foreground">
                                        {formatDateTime(
                                          selectedPayment.created_at
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
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
    </div>
  );
}

export default PaymentManagement;
