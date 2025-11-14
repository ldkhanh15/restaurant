"use client";

import React, { useState, useEffect, useMemo } from "react";
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
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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
  Save,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { Voucher } from "@/type/Voucher";
import { voucherService } from "@/services/voucherService";

const VOUCHER_TYPES = [
  { value: "percentage", label: "Phần trăm", icon: Percent },
  { value: "fixed", label: "Số tiền cố định", icon: DollarSign },
];

const VOUCHER_STATUS = {
  ACTIVE: "active",
  EXPIRED: "expired",
  UPCOMING: "upcoming",
  INACTIVE: "inactive",
} as const;

interface VoucherFormData {
  code: string;
  discount_type: "percentage" | "fixed";
  value: string | number;
  min_order_value: number | null;
  max_uses: number;
  active: boolean;
  expiry_date: string;
}

interface VoucherManagementEnhancedProps {
  className?: string;
}

// Simple Loading Component
const SimpleLoading = () => (
  <div className="text-center py-8">
    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
    <p className="text-muted-foreground">Đang tải voucher...</p>
  </div>
);

export function VoucherManagementEnhanced({
  className,
}: VoucherManagementEnhancedProps) {
  const { toast } = useToast();

  // State management
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Edit/Delete voucher tracking
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [voucherToDelete, setVoucherToDelete] = useState<Voucher | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<VoucherFormData>({
    code: "",
    discount_type: "percentage",
    value: "",
    min_order_value: null,
    max_uses: 0,
    active: true,
    expiry_date: "",
  });

  // Bulk operations
  const [selectedVoucherIds, setSelectedVoucherIds] = useState<number[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load vouchers on component mount
  useEffect(() => {
    loadVouchers();
  }, []);

  // Memoized filtered vouchers
  const filteredVouchers = useMemo(() => {
    let filtered = vouchers;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((voucher) =>
        voucher.code.toLowerCase().includes(searchLower) ||
        (voucher.discount_type && voucher.discount_type.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((voucher) => {
        const expiryDate = voucher.expiry_date ? new Date(voucher.expiry_date) : null;
        
        switch (statusFilter) {
          case VOUCHER_STATUS.ACTIVE:
            return voucher.active && (!expiryDate || expiryDate > now);
          case VOUCHER_STATUS.EXPIRED:
            return expiryDate && expiryDate <= now;
          case VOUCHER_STATUS.UPCOMING:
            return voucher.active && expiryDate && expiryDate > now;
          case VOUCHER_STATUS.INACTIVE:
            return !voucher.active;
          default:
            return true;
        }
      });
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((voucher) => voucher.discount_type === typeFilter);
    }

    return filtered;
  }, [vouchers, searchTerm, statusFilter, typeFilter]);

  // Memoized statistics
  const stats = useMemo(() => {
    const now = new Date();
    const total = vouchers.length;
    const active = vouchers.filter((v) => {
      const expiryDate = v.expiry_date ? new Date(v.expiry_date) : null;
      return v.active && (!expiryDate || expiryDate > now);
    }).length;
    const expired = vouchers.filter((v) => {
      const expiryDate = v.expiry_date ? new Date(v.expiry_date) : null;
      return expiryDate && expiryDate <= now;
    }).length;
    const totalUsage = vouchers.reduce((sum, v) => sum + v.current_uses, 0);

    return { total, active, expired, totalUsage };
  }, [vouchers]);

  // API Functions
  const loadVouchers = async () => {
    setIsLoading(true);
    try {
      const response = await voucherService.getAll();
      setVouchers(response.data || []);
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

  const createVoucher = async () => {
    if (!validateForm()) {
      toast({
        title: "Lỗi validation",
        description: "Vui lòng kiểm tra lại thông tin nhập vào",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        code: formData.code.trim().toUpperCase(),
        value: parseFloat(String(formData.value)),
        min_order_value: formData.min_order_value || null,
      };
      
      await voucherService.create(submitData);
      await loadVouchers(); // Reload data
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Thành công",
        description: "Tạo voucher thành công",
      });
    } catch (error: any) {
      console.error("Failed to create voucher:", error);
      const errorMessage = error?.response?.data?.message || "Không thể tạo voucher";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateVoucher = async () => {
    if (!selectedVoucher) return;

    if (!validateForm()) {
      toast({
        title: "Lỗi validation",
        description: "Vui lòng kiểm tra lại thông tin nhập vào",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        code: formData.code.trim().toUpperCase(),
        value: parseFloat(String(formData.value)),
        min_order_value: formData.min_order_value || null,
      };
      
      await voucherService.update(selectedVoucher.id, submitData);
      await loadVouchers(); // Reload data
      setShowEditDialog(false);
      setSelectedVoucher(null);
      resetForm();
      toast({
        title: "Thành công",
        description: "Cập nhật voucher thành công",
      });
    } catch (error: any) {
      console.error("Failed to update voucher:", error);
      const errorMessage = error?.response?.data?.message || "Không thể cập nhật voucher";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteVoucher = async () => {
    if (!voucherToDelete) return;

    try {
      await voucherService.remove(voucherToDelete.id);
      await loadVouchers(); // Reload data
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

  // Validation Functions
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate code
    if (!formData.code.trim()) {
      errors.code = "Mã voucher không được để trống";
    } else if (formData.code.trim().length < 3) {
      errors.code = "Mã voucher phải có ít nhất 3 ký tự";
    } else if (formData.code.trim().length > 20) {
      errors.code = "Mã voucher không được quá 20 ký tự";
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code.trim())) {
      errors.code = "Mã voucher chỉ được chứa chữ hoa, số, dấu gạch ngang và gạch dưới";
    }

    // Check duplicate code (excluding current voucher when editing)
    const isDuplicateCode = vouchers.some(voucher => 
      voucher.code === formData.code.trim() && 
      (!selectedVoucher || voucher.id !== selectedVoucher.id)
    );
    if (isDuplicateCode) {
      errors.code = "Mã voucher đã tồn tại";
    }

    // Validate value
    const valueString = String(formData.value);
    const value = parseFloat(valueString);
    if (!valueString.trim()) {
      errors.value = "Giá trị giảm giá không được để trống";
    } else if (isNaN(value) || value <= 0) {
      errors.value = "Giá trị giảm giá phải là số dương";
    } else if (formData.discount_type === "percentage" && value > 100) {
      errors.value = "Giá trị phần trăm không được vượt quá 100%";
    } else if (formData.discount_type === "fixed" && value > 10000000) {
      errors.value = "Giá trị giảm giá cố định không được vượt quá 10.000.000 VNĐ";
    }

    // Validate min_order_value
    if (formData.min_order_value && formData.min_order_value < 0) {
      errors.min_order_value = "Giá trị đơn hàng tối thiểu không được âm";
    } else if (formData.min_order_value && formData.min_order_value > 100000000) {
      errors.min_order_value = "Giá trị đơn hàng tối thiểu không được vượt quá 100.000.000 VNĐ";
    }

    // Validate max_uses
    if (formData.max_uses < 0) {
      errors.max_uses = "Số lượt sử dụng tối đa không được âm";
    } else if (formData.max_uses > 1000000) {
      errors.max_uses = "Số lượt sử dụng tối đa không được vượt quá 1.000.000";
    }

    // Validate expiry_date
    if (!formData.expiry_date) {
      errors.expiry_date = "Ngày hết hạn không được để trống";
    } else {
      const expiryDate = new Date(formData.expiry_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expiryDate < today) {
        errors.expiry_date = "Ngày hết hạn không được trong quá khứ";
      }
      
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 5);
      if (expiryDate > maxDate) {
        errors.expiry_date = "Ngày hết hạn không được quá 5 năm kể từ hôm nay";
      }
    }

    // Cross-field validation
    if (formData.discount_type === "fixed" && formData.min_order_value && 
        parseFloat(String(formData.value)) >= formData.min_order_value) {
      errors.value = "Giá trị giảm giá phải nhỏ hơn giá trị đơn hàng tối thiểu";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Helper Functions
  const resetForm = () => {
    setFormData({
      code: "",
      discount_type: "percentage",
      value: "",
      min_order_value: null,
      max_uses: 0,
      active: true,
      expiry_date: "",
    });
    setFormErrors({});
    setIsSubmitting(false);
  };

  const clearFieldError = (fieldName: string) => {
    if (formErrors[fieldName]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleCreateClick = () => {
    resetForm();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormData(prev => ({
      ...prev,
      expiry_date: tomorrow.toISOString().split("T")[0],
    }));
    setShowCreateDialog(true);
  };

  const handleEditClick = (voucher: Voucher) => {
    resetForm(); // Clear any previous errors
    setSelectedVoucher(voucher);
    setFormData({
      code: voucher.code || "",
      discount_type: voucher.discount_type || "percentage",
      value: voucher.value || "",
      min_order_value: voucher.min_order_value || null,
      max_uses: voucher.max_uses || 0,
      active: voucher.active ?? true,
      expiry_date: voucher.expiry_date ? voucher.expiry_date.split("T")[0] : "",
    });
    setShowEditDialog(true);
  };

  const handleDeleteClick = (voucher: Voucher) => {
    setVoucherToDelete(voucher);
    setShowDeleteDialog(true);
  };

  const getVoucherStatus = (voucher: Voucher) => {
    const now = new Date();
    const expiryDate = voucher.expiry_date ? new Date(voucher.expiry_date) : null;

    if (expiryDate && expiryDate <= now) {
      return VOUCHER_STATUS.EXPIRED;
    } else if (voucher.active) {
      return VOUCHER_STATUS.ACTIVE;
    } else {
      return VOUCHER_STATUS.INACTIVE;
    }
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Không có";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: vi });
    } catch {
      return "Không có";
    }
  };

  const getUsagePercentage = (currentUses: number, maxUses: number) => {
    if (maxUses === 0) return 0;
    return Math.min((currentUses / maxUses) * 100, 100);
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
                  {stats.total}
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
                  {stats.active}
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
                  {stats.expired}
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
                    const TypeIcon = getTypeIcon(voucher.discount_type);
                    const status = getVoucherStatus(voucher);
                    const usagePercentage = getUsagePercentage(
                      voucher.current_uses,
                      voucher.max_uses
                    );

                    return (
                      <TableRow key={voucher.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">{voucher.code}</p>
                            <p className="text-xs text-muted-foreground">
                              {voucher.created_at ? formatDate(voucher.created_at) : 'Không có'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{voucher.code}</p>
                            <p className="text-sm text-muted-foreground">
                              {getTypeLabel(voucher.discount_type)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{getTypeLabel(voucher.discount_type)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-green-600">
                            {voucher.discount_type === "percentage"
                              ? `${voucher.value}%`
                              : formatCurrency(Number(voucher.value))}
                          </div>
                          {voucher.min_order_value && (
                            <p className="text-xs text-muted-foreground">
                              Tối thiểu: {formatCurrency(voucher.min_order_value)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {voucher.current_uses}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                / {voucher.max_uses}
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${usagePercentage}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {status === VOUCHER_STATUS.ACTIVE ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Hoạt động
                              </Badge>
                            ) : status === VOUCHER_STATUS.EXPIRED ? (
                              <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                                <XCircle className="h-3 w-3 mr-1" />
                                Hết hạn
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                                <XCircle className="h-3 w-3 mr-1" />
                                Không hoạt động
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{formatDate(voucher.expiry_date || null)}</p>
                            {status === VOUCHER_STATUS.EXPIRED && (
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
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(voucher)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <Label htmlFor="code">Mã voucher *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="Nhập mã voucher (VD: SAVE20)"
                  className={`mt-1 ${formErrors.code ? 'border-red-500' : ''}`}
                />
                {formErrors.code && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>
                )}
              </div>
              <div>
                <Label htmlFor="type">Loại voucher *</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: "percentage" | "fixed") =>
                    setFormData((prev) => ({ ...prev, discount_type: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOUCHER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">
                  {formData.discount_type === "percentage" ? "Phần trăm giảm (%)" : "Số tiền giảm (VND)"} *
                </Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  max={formData.discount_type === "percentage" ? "100" : undefined}
                  value={formData.value}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, value: e.target.value }))
                  }
                  placeholder={formData.discount_type === "percentage" ? "VD: 20" : "VD: 50000"}
                  className={`mt-1 ${formErrors.value ? 'border-red-500' : ''}`}
                />
                {formErrors.value && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.value}</p>
                )}
                {formData.discount_type === "percentage" && !formErrors.value && (
                  <p className="text-xs text-muted-foreground mt-1">Từ 1% đến 100%</p>
                )}
              </div>
              <div>
                <Label htmlFor="min_order_value">Đơn hàng tối thiểu (VND)</Label>
                <Input
                  id="min_order_value"
                  type="number"
                  min="0"
                  value={formData.min_order_value || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      min_order_value: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder="VD: 100000 (Tùy chọn)"
                  className={`mt-1 ${formErrors.min_order_value ? 'border-red-500' : ''}`}
                />
                {formErrors.min_order_value && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.min_order_value}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_uses">Số lần sử dụng tối đa *</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="1"
                  value={formData.max_uses}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, max_uses: Number(e.target.value) }))
                  }
                  placeholder="VD: 100"
                  className={`mt-1 ${formErrors.max_uses ? 'border-red-500' : ''}`}
                />
                {formErrors.max_uses && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.max_uses}</p>
                )}
              </div>
              <div>
                <Label htmlFor="expiry_date">Ngày hết hạn *</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, expiry_date: e.target.value }))
                  }
                  className={`mt-1 ${formErrors.expiry_date ? 'border-red-500' : ''}`}
                />
                {formErrors.expiry_date && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.expiry_date}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, active: !!checked }))
                }
              />
              <Label htmlFor="active" className="text-sm font-medium">
                Kích hoạt voucher ngay
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button 
              onClick={createVoucher}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? "Đang tạo..." : "Tạo voucher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Voucher Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <Label htmlFor="edit-code">Mã voucher *</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="Nhập mã voucher"
                  className={`mt-1 ${formErrors.code ? 'border-red-500' : ''}`}
                />
                {formErrors.code && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-type">Loại voucher *</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: "percentage" | "fixed") =>
                    setFormData((prev) => ({ ...prev, discount_type: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOUCHER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-value">
                  {formData.discount_type === "percentage" ? "Phần trăm giảm (%)" : "Số tiền giảm (VND)"} *
                </Label>
                <Input
                  id="edit-value"
                  type="number"
                  min="0"
                  max={formData.discount_type === "percentage" ? "100" : undefined}
                  value={formData.value}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, value: e.target.value }))
                  }
                  placeholder={formData.discount_type === "percentage" ? "VD: 20" : "VD: 50000"}
                  className={`mt-1 ${formErrors.value ? 'border-red-500' : ''}`}
                />
                {formErrors.value && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.value}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-min_order_value">Đơn hàng tối thiểu (VND)</Label>
                <Input
                  id="edit-min_order_value"
                  type="number"
                  min="0"
                  value={formData.min_order_value || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      min_order_value: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder="VD: 100000 (Tùy chọn)"
                  className={`mt-1 ${formErrors.min_order_value ? 'border-red-500' : ''}`}
                />
                {formErrors.min_order_value && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.min_order_value}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-max_uses">Số lần sử dụng tối đa *</Label>
                <Input
                  id="edit-max_uses"
                  type="number"
                  min="1"
                  value={formData.max_uses}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, max_uses: Number(e.target.value) }))
                  }
                  placeholder="VD: 100"
                  className={`mt-1 ${formErrors.max_uses ? 'border-red-500' : ''}`}
                />
                {formErrors.max_uses && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.max_uses}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-expiry_date">Ngày hết hạn *</Label>
                <Input
                  id="edit-expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, expiry_date: e.target.value }))
                  }
                  className={`mt-1 ${formErrors.expiry_date ? 'border-red-500' : ''}`}
                />
                {formErrors.expiry_date && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.expiry_date}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-active"
                checked={formData.active}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, active: !!checked }))
                }
              />
              <Label htmlFor="edit-active" className="text-sm font-medium">
                Kích hoạt voucher
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditDialog(false)}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button 
              onClick={updateVoucher}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
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
