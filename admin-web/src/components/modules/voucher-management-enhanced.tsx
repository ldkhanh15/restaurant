"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Gift,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  DollarSign,
  Percent,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Save,
  X,
} from "lucide-react";
import { api, Voucher, VoucherFilters } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const VOUCHER_TYPES = [
  { value: "percentage", label: "Phần trăm", icon: Percent },
  { value: "fixed_amount", label: "Số tiền cố định", icon: DollarSign },
];

interface VoucherManagementEnhancedProps {
  className?: string;
}

export function VoucherManagementEnhanced({
  className,
}: VoucherManagementEnhancedProps) {
  const { toast } = useToast();

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState<Voucher | null>(null);
  const [editingVoucher, setEditingVoucher] = useState<Partial<Voucher>>({});
  const [stats, setStats] = useState({
    totalVouchers: 0,
    activeVouchers: 0,
    expiredVouchers: 0,
    totalUsage: 0,
  });

  // Load vouchers and stats on component mount
  useEffect(() => {
    loadVouchers();
  }, []);

  // Load stats when vouchers change
  useEffect(() => {
    loadStats();
  }, [vouchers]);

  // Filter vouchers when search term or filters change
  useEffect(() => {
    let filtered = vouchers;

    if (searchTerm) {
      filtered = filtered.filter(
        (voucher) =>
          voucher.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((voucher) => voucher.active);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter((voucher) => !voucher.active);
      } else if (statusFilter === "expired") {
        const now = new Date();
        filtered = filtered.filter(
          (voucher) => new Date(voucher.expiry_date) < now
        );
      }
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((voucher) => voucher.discount_type === typeFilter);
    }

    setFilteredVouchers(filtered);
  }, [vouchers, searchTerm, statusFilter, typeFilter]);

  const loadVouchers = async () => {
    setIsLoading(true);
    try {
      const response = await api.vouchers.getAll({
        page: 1,
        limit: 100,
      });
      setVouchers(response.data);
    } catch (error) {
      console.error("Failed to load vouchers:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách voucher",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = () => {
    // Calculate stats from vouchers data
    const total = vouchers.length;
    const active = vouchers.filter((v) => v.active).length;
    const now = new Date();
    const expired = vouchers.filter(
      (v) => new Date(v.expiry_date) < now
    ).length;
    const totalUsage = vouchers.reduce((sum, v) => sum + v.current_uses, 0);

    setStats({
      totalVouchers: total,
      activeVouchers: active,
      expiredVouchers: expired,
      totalUsage,
    });
  };

  const createVoucher = async () => {
    try {
      const response = await api.vouchers.create(
        editingVoucher as Omit<
          Voucher,
          "id" | "created_at" | "deleted_at" | "current_uses"
        >
      );
      setVouchers((prev) => [response.data, ...prev]);
      setShowCreateDialog(false);
      setEditingVoucher({});
      toast({
        title: "Thành công",
        description: "Tạo voucher thành công",
      });
    } catch (error) {
      console.error("Failed to create voucher:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo voucher",
        variant: "destructive",
      });
    }
  };

  const updateVoucher = async () => {
    if (!selectedVoucher) return;

    try {
      const response = await api.vouchers.update(
        selectedVoucher.id,
        editingVoucher
      );
      setVouchers((prev) =>
        prev.map((voucher) =>
          voucher.id === selectedVoucher.id ? response.data : voucher
        )
      );
      setShowEditDialog(false);
      setSelectedVoucher(null);
      setEditingVoucher({});
      toast({
        title: "Thành công",
        description: "Cập nhật voucher thành công",
      });
    } catch (error) {
      console.error("Failed to update voucher:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật voucher",
        variant: "destructive",
      });
    }
  };

  const deleteVoucher = async () => {
    if (!voucherToDelete) return;

    try {
      await api.vouchers.delete(voucherToDelete.id);
      setVouchers((prev) =>
        prev.filter((voucher) => voucher.id !== voucherToDelete.id)
      );
      setShowDeleteDialog(false);
      setVoucherToDelete(null);
      toast({
        title: "Thành công",
        description: "Xóa voucher thành công",
      });
    } catch (error) {
      console.error("Failed to delete voucher:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa voucher",
        variant: "destructive",
      });
    }
  };

  const handleCreateClick = () => {
    setEditingVoucher({
      discount_type: "percentage",
      active: true,
      expiry_date: new Date().toISOString().split("T")[0],
      current_uses: 0,
    });
    setShowCreateDialog(true);
  };

  const handleEditClick = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setEditingVoucher(voucher);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (voucher: Voucher) => {
    setVoucherToDelete(voucher);
    setShowDeleteDialog(true);
  };

  const getTypeLabel = (type: string) => {
    return VOUCHER_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = VOUCHER_TYPES.find((t) => t.value === type);
    return typeConfig?.icon || DollarSign;
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

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const getUsagePercentage = (usedCount: number, usageLimit?: number) => {
    if (!usageLimit) return 0;
    return Math.min((usedCount / usageLimit) * 100, 100);
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
                  Tổng voucher
                </p>
                <p className="text-2xl font-bold gold-text">
                  {stats.totalVouchers}
                </p>
              </div>
              <Gift className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Đang hoạt động
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.activeVouchers}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Đã hết hạn
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.expiredVouchers}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tổng sử dụng
                </p>
                <p className="text-2xl font-bold gold-text">
                  {stats.totalUsage}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="luxury-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Bộ lọc và tìm kiếm
            </CardTitle>
            <Button onClick={handleCreateClick} className="luxury-button">
              <Plus className="h-4 w-4 mr-2" />
              Tạo voucher mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo mã, tên, mô tả voucher..."
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
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
                <SelectItem value="expired">Đã hết hạn</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Lọc theo loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {VOUCHER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={loadVouchers}
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

      {/* Vouchers Table */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Danh sách voucher ({filteredVouchers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Đang tải voucher...</p>
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không có voucher nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã voucher</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Giá trị</TableHead>
                    <TableHead>Sử dụng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Hạn sử dụng</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVouchers.map((voucher) => {
                    const TypeIcon = getTypeIcon(voucher.type);
                    const expired = isExpired(voucher.valid_until);
                    const usagePercentage = getUsagePercentage(
                      voucher.used_count,
                      voucher.usage_limit
                    );

                    return (
                      <TableRow key={voucher.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">{voucher.code}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(voucher.created_at)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{voucher.name}</p>
                            {voucher.description && (
                              <p className="text-sm text-muted-foreground">
                                {voucher.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{getTypeLabel(voucher.type)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold gold-text">
                            {voucher.type === "percentage"
                              ? `${voucher.value}%`
                              : formatCurrency(voucher.value)}
                          </div>
                          {voucher.min_order_amount && (
                            <p className="text-xs text-muted-foreground">
                              Tối thiểu:{" "}
                              {formatCurrency(voucher.min_order_amount)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {voucher.used_count}
                              </span>
                              {voucher.usage_limit && (
                                <span className="text-sm text-muted-foreground">
                                  / {voucher.usage_limit}
                                </span>
                              )}
                            </div>
                            {voucher.usage_limit && (
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${usagePercentage}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {voucher.active && !expired ? (
                              <Badge className="status-badge status-ready">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Hoạt động
                              </Badge>
                            ) : expired ? (
                              <Badge className="status-badge status-cancelled">
                                <XCircle className="h-3 w-3 mr-1" />
                                Hết hạn
                              </Badge>
                            ) : (
                              <Badge className="status-badge status-pending">
                                <XCircle className="h-3 w-3 mr-1" />
                                Không hoạt động
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{formatDateTime(voucher.expiry_date || "")}</p>
                            {expired && (
                              <p className="text-xs text-red-600">Đã hết hạn</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(voucher)}
                              className="luxury-focus"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(voucher)}
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

      {/* Create Voucher Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Tạo voucher mới
            </DialogTitle>
            <DialogDescription>
              Tạo voucher giảm giá mới cho khách hàng
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Mã voucher</Label>
                <Input
                  id="code"
                  value={editingVoucher.code || ""}
                  onChange={(e) =>
                    setEditingVoucher((prev) => ({
                      ...prev,
                      code: e.target.value,
                    }))
                  }
                  placeholder="Nhập mã voucher"
                  className="luxury-focus"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Loại voucher</Label>
                <Select
                  value={editingVoucher.discount_type || "percentage"}
                  onValueChange={(value) =>
                    setEditingVoucher((prev) => ({
                      ...prev,
                      type: value as any,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOUCHER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="value">Giá trị</Label>
                <Input
                  id="value"
                  type="number"
                  value={editingVoucher.value || ""}
                  onChange={(e) =>
                    setEditingVoucher((prev) => ({
                      ...prev,
                      value: parseFloat(e.target.value),
                    }))
                  }
                  placeholder="Nhập giá trị"
                  className="luxury-focus"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="usage_limit">Giới hạn sử dụng</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  value={editingVoucher.max_uses || ""}
                  onChange={(e) =>
                    setEditingVoucher((prev) => ({
                      ...prev,
                      usage_limit: parseInt(e.target.value),
                    }))
                  }
                  placeholder="Nhập giới hạn sử dụng"
                  className="luxury-focus"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valid_from">Có hiệu lực từ</Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={editingVoucher.valid_from || ""}
                  onChange={(e) =>
                    setEditingVoucher((prev) => ({
                      ...prev,
                      valid_from: e.target.value,
                    }))
                  }
                  className="luxury-focus"
                />
              </div>
              <div>
                <Label htmlFor="valid_until">Có hiệu lực đến</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={editingVoucher.valid_until || ""}
                  onChange={(e) =>
                    setEditingVoucher((prev) => ({
                      ...prev,
                      valid_until: e.target.value,
                    }))
                  }
                  className="luxury-focus"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Hủy
            </Button>
            <Button onClick={createVoucher} className="luxury-button">
              Tạo voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Voucher Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Chỉnh sửa voucher
            </DialogTitle>
            <DialogDescription>Chỉnh sửa thông tin voucher</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-code">Mã voucher</Label>
                <Input
                  id="edit-code"
                  value={editingVoucher.code || ""}
                  onChange={(e) =>
                    setEditingVoucher((prev) => ({
                      ...prev,
                      code: e.target.value,
                    }))
                  }
                  placeholder="Nhập mã voucher"
                  className="luxury-focus"
                />
              </div>
              <div>
                <Label htmlFor="edit-name">Tên voucher</Label>
                <Input
                  id="edit-name"
                  value={editingVoucher.name || ""}
                  onChange={(e) =>
                    setEditingVoucher((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Nhập tên voucher"
                  className="luxury-focus"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Mô tả</Label>
              <Textarea
                id="edit-description"
                value={editingVoucher.description || ""}
                onChange={(e) =>
                  setEditingVoucher((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Nhập mô tả voucher"
                className="luxury-focus"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">Loại voucher</Label>
                <Select
                  value={editingVoucher.type || "percentage"}
                  onValueChange={(value) =>
                    setEditingVoucher((prev) => ({
                      ...prev,
                      type: value as any,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOUCHER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-value">Giá trị</Label>
                <Input
                  id="edit-value"
                  type="number"
                  value={editingVoucher.value || ""}
                  onChange={(e) =>
                    setEditingVoucher((prev) => ({
                      ...prev,
                      value: parseFloat(e.target.value),
                    }))
                  }
                  placeholder="Nhập giá trị"
                  className="luxury-focus"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-min_order_amount">
                  Đơn hàng tối thiểu
                </Label>
                <Input
                  id="edit-min_order_amount"
                  type="number"
                  value={editingVoucher.min_order_amount || ""}
                  onChange={(e) =>
                    setEditingVoucher((prev) => ({
                      ...prev,
                      min_order_amount: parseFloat(e.target.value),
                    }))
                  }
                  placeholder="Nhập số tiền tối thiểu"
                  className="luxury-focus"
                />
              </div>
              <div>
                <Label htmlFor="edit-usage_limit">Giới hạn sử dụng</Label>
                <Input
                  id="edit-usage_limit"
                  type="number"
                  value={editingVoucher.usage_limit || ""}
                  onChange={(e) =>
                    setEditingVoucher((prev) => ({
                      ...prev,
                      usage_limit: parseInt(e.target.value),
                    }))
                  }
                  placeholder="Nhập giới hạn sử dụng"
                  className="luxury-focus"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-valid_from">Có hiệu lực từ</Label>
                <Input
                  id="edit-valid_from"
                  type="date"
                  value={editingVoucher.valid_from || ""}
                  onChange={(e) =>
                    setEditingVoucher((prev) => ({
                      ...prev,
                      valid_from: e.target.value,
                    }))
                  }
                  className="luxury-focus"
                />
              </div>
              <div>
                <Label htmlFor="edit-valid_until">Có hiệu lực đến</Label>
                <Input
                  id="edit-valid_until"
                  type="date"
                  value={editingVoucher.valid_until || ""}
                  onChange={(e) =>
                    setEditingVoucher((prev) => ({
                      ...prev,
                      valid_until: e.target.value,
                    }))
                  }
                  className="luxury-focus"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={editingVoucher.active || false}
                onChange={(e) =>
                  setEditingVoucher((prev) => ({
                    ...prev,
                    active: e.target.checked,
                  }))
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="edit-active">Kích hoạt voucher</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Hủy
            </Button>
            <Button onClick={updateVoucher} className="luxury-button">
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Xác nhận xóa voucher
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa voucher {voucherToDelete?.code}? Hành
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
              onClick={deleteVoucher}
              className="bg-destructive hover:bg-destructive/90"
            >
              Xóa voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default VoucherManagementEnhanced;
