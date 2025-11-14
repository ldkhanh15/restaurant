"use client";

import { useState, useEffect } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Minus,
  XCircle,
  CreditCard,
  Receipt,
  Gift,
  MessageCircle,
  Star,
  CheckCircle,
  Clock,
  ChefHat,
  ShoppingCart,
  Loader2,
  ArrowLeft,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import DishSelectionDialog from "@/components/shared/DishSelectionDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  orderService,
  type Order,
  type OrderItem,
} from "@/services/orderService";
import { useOrderStore } from "@/store/orderStore";
import { useEnsureAuthenticated } from "@/hooks/useEnsureAuthenticated";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import type { SelectableDish } from "@/components/shared/DishSelectionDialog";
import InvoiceForm from "@/components/shared/InvoiceForm";

const itemStatusConfig: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: "Chờ xác nhận",
    color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
    icon: Clock,
  },
  preparing: {
    label: "Đang chuẩn bị",
    color: "bg-blue-500/20 text-blue-600 border-blue-500/30",
    icon: ChefHat,
  },
  ready: {
    label: "Sẵn sàng",
    color: "bg-green-500/20 text-green-600 border-green-500/30",
    icon: CheckCircle,
  },
  completed: {
    label: "Hoàn thành",
    color: "bg-green-500/20 text-green-600 border-green-500/30",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-red-500/20 text-red-600 border-red-500/30",
    icon: XCircle,
  },
};

const orderStatusConfig: Record<string, { label: string; color: string }> = {
  pending: {
    label: "Chờ xác nhận",
    color: "bg-yellow-500",
  },
  preparing: {
    label: "Đang chuẩn bị",
    color: "bg-blue-500",
  },
  dining: {
    label: "Đang phục vụ",
    color: "bg-blue-500",
  },
  waiting_payment: {
    label: "Chờ thanh toán",
    color: "bg-orange-500",
  },
  paid: {
    label: "Đã thanh toán",
    color: "bg-green-500",
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-red-500",
  },
  completed: {
    label: "Hoàn thành",
    color: "bg-green-500",
  },
};

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  // Allow guest access for walk-in customers
  const { user, isLoading: authLoading } = useEnsureAuthenticated({
    optional: true,
  });
  const orderSocket = useOrderSocket();
  const {
    selectedOrder,
    isLoadingDetail,
    detailError,
    setSelectedOrder,
    setLoadingDetail,
    setDetailError,
    updateSelectedOrder,
    updateOrderItem,
    removeItemFromSelectedOrder,
  } = useOrderStore();

  const [isAddingDishes, setIsAddingDishes] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [isVoucherApplied, setIsVoucherApplied] = useState(false);
  const [isVoucherProcessing, setIsVoucherProcessing] = useState(false);
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState<string | null>(
    null
  );
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isViewInvoiceDialogOpen, setIsViewInvoiceDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "vnpay" | "cash"
  >("vnpay");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cashNote, setCashNote] = useState("");
  const [pointsToUse, setPointsToUse] = useState(0);

  // Load order on mount - allow guest access for walk-in customers
  useEffect(() => {
    if (authLoading) {
      return;
    }

    const loadOrder = async () => {
      try {
        setLoadingDetail(true);
        setDetailError(null);
        const response = await orderService.getOrderById(id);

        if (response.status === "success") {
          const orderData = response.data;
          setSelectedOrder(orderData);
          const appliedVoucherCode = orderData.voucher?.code || "";
          setVoucherCode(appliedVoucherCode);
          setIsVoucherApplied(Boolean(appliedVoucherCode));
          setIsVoucherProcessing(false);
        }
      } catch (err: any) {
        console.error("Failed to load order:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Không thể tải chi tiết đơn hàng";

        // If 401 and user is not authenticated (walk-in customer), try without token
        if (err.response?.status === 401 && !user) {
          // This is a walk-in customer - the token might be invalid
          // Try to clear any invalid token and retry
          const token = localStorage.getItem("auth_token");
          if (token) {
            console.log(
              "[OrderDetail] Clearing invalid token for walk-in customer"
            );
            localStorage.removeItem("auth_token");
            // Retry the request
            try {
              const retryResponse = await orderService.getOrderById(id);
              if (retryResponse.status === "success") {
                const orderData = retryResponse.data;
                setSelectedOrder(orderData);
                const appliedVoucherCode = orderData.voucher?.code || "";
                setVoucherCode(appliedVoucherCode);
                setIsVoucherApplied(Boolean(appliedVoucherCode));
                setIsVoucherProcessing(false);
                return; // Success, exit early
              }
            } catch (retryErr) {
              console.error("Retry failed:", retryErr);
            }
          }
        }

        setDetailError(errorMessage);
        toast({
          title: "Lỗi",
          description: errorMessage,
          variant: "destructive",
        });

        // Redirect if 403 or 404
        if (err.response?.status === 403 || err.response?.status === 404) {
          setTimeout(() => router.push("/orders"), 2000);
        }
      } finally {
        setLoadingDetail(false);
      }
    };

    loadOrder();
  }, [
    id,
    authLoading,
    router,
    setSelectedOrder,
    setLoadingDetail,
    setDetailError,
  ]);

  // Refresh order after actions
  const refreshOrder = async () => {
    try {
      const response = await orderService.getOrderById(id);
      if (response.status === "success") {
        const orderData = response.data;
        setSelectedOrder(orderData);
        const appliedVoucherCode = orderData.voucher?.code || "";
        setVoucherCode(appliedVoucherCode);
        setIsVoucherApplied(Boolean(appliedVoucherCode));
        setIsVoucherProcessing(false);
      }
    } catch (err) {
      console.error("Failed to refresh order:", err);
    }
  };

  // Join order room for real-time updates
  useEffect(() => {
    if (orderSocket.isConnected && id) {
      orderSocket.joinOrder(id);
      return () => {
        orderSocket.leaveOrder(id);
      };
    }
  }, [orderSocket.isConnected, id, orderSocket]);

  // Listen to real-time order updates
  useEffect(() => {
    if (!orderSocket.isConnected || !selectedOrder) return;

    // Listen to order updates
    orderSocket.onOrderUpdated((order) => {
      console.log("[OrderDetail] Order updated:", order);
      if (order.id === id) {
        updateSelectedOrder({
          status: order.status as any,
          updated_at: order.updated_at,
          total_amount: order.total || 0,
          final_amount: order.total || 0,
        });
      }
    });

    // Listen to status changes
    orderSocket.onOrderStatusChanged((order) => {
      console.log("[OrderDetail] Order status changed:", order);
      if (order.id === id) {
        updateSelectedOrder({
          status: order.status as any,
          updated_at: order.updated_at,
        });
        toast({
          title: "Trạng thái thay đổi",
          description: `Đơn hàng đã chuyển sang "${
            orderStatusConfig[order.status]?.label || order.status
          }"`,
          variant: "info",
        });
      }
    });

    // Listen to payment completion
    orderSocket.onPaymentCompleted((order) => {
      console.log("[OrderDetail] Payment completed:", order);
      if (order.id === id) {
        updateSelectedOrder({
          status: "paid" as any,
          payment_status: "paid" as any,
          updated_at: order.updated_at,
        });
        toast({
          title: "Thanh toán thành công",
          description: "Đơn hàng đã được thanh toán thành công",
          variant: "success",
        });
      }
    });

    // Listen to payment failed
    orderSocket.onPaymentFailed((order) => {
      console.log("[OrderDetail] Payment failed:", order);
      if (order.id === id) {
        updateSelectedOrder({
          payment_status: "failed" as any,
          updated_at: order.updated_at,
        });
        toast({
          title: "Thanh toán thất bại",
          description: "Thanh toán không thành công. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    });

    // Listen to support request confirmation
    orderSocket.onSupportRequested((data) => {
      console.log("[OrderDetail] Support requested:", data);
      const orderId = (data as any).orderId || (data as any).id;
      if (orderId === id) {
        toast({
          title: "Đã gửi yêu cầu hỗ trợ",
          description: "Nhân viên đã nhận được yêu cầu của bạn",
          variant: "info",
        });
      }
    });

    // Listen to voucher applied
    orderSocket.onVoucherApplied((order) => {
      console.log("[OrderDetail] Voucher applied:", order);
      if (order.id === id) {
        updateSelectedOrder({
          voucher_id: order.voucher_id,
          voucher_discount_amount: order.voucher_discount_amount || 0,
          final_amount: order.final_amount || order.total_amount || 0,
        });
        if (order.voucher?.code) {
          setVoucherCode(order.voucher.code);
        } else if (order.voucher_code) {
          setVoucherCode(order.voucher_code);
        }
        setIsVoucherApplied(true);
        setIsVoucherProcessing(false);
        toast({
          title: "Áp dụng voucher thành công",
          description: `Giảm ${(
            order.voucher_discount_amount || 0
          ).toLocaleString("vi-VN")}đ`,
        });
      }
    });

    // Listen to voucher removed
    orderSocket.onVoucherRemoved((order) => {
      console.log("[OrderDetail] Voucher removed:", order);
      if (order.id === id) {
        updateSelectedOrder({
          voucher_id: undefined,
          voucher_discount_amount: 0,
          final_amount: order.total_amount || 0,
        });
        setVoucherCode("");
        setIsVoucherApplied(false);
        setIsVoucherProcessing(false);
        toast({
          title: "Đã xóa voucher",
          description: "Voucher đã được xóa khỏi đơn hàng",
        });
      }
    });

    // Listen to order item events - update items and totals
    const handleItemCreated = (data: any) => {
      console.log("[OrderDetail] Order item created:", data);
      if (data.orderId === id && data.item) {
        // Thêm item mới vào danh sách (không merge với item cũ)
        updateSelectedOrder({
          items: [
            ...(selectedOrder?.items || []),
            data.item, // Thêm item mới vào cuối danh sách
          ],
          total_amount:
            data.order.total_amount || selectedOrder?.total_amount || 0,
          final_amount:
            data.order.final_amount || selectedOrder?.final_amount || 0,
        });
        toast({
          title: "Đã thêm món",
          description: `${
            data.item.dish?.name || data.item.dish_id
          } đã được thêm vào đơn hàng`,
        });
      }
    };

    const handleItemQuantityChanged = (data: any) => {
      console.log("[OrderDetail] Order item quantity changed:", data);
      if (data.orderId === id && data.item) {
        // Update item in selected order
        updateSelectedOrder({
          items: selectedOrder?.items?.map((item: OrderItem) =>
            item.id === data.itemId ? { ...item, ...data.item } : item
          ),
          total_amount:
            data.order.total_amount || selectedOrder?.total_amount || 0,
          final_amount:
            data.order.final_amount || selectedOrder?.final_amount || 0,
        });
      }
    };

    const handleItemDeleted = (data: any) => {
      console.log("[OrderDetail] Order item deleted:", data);
      if (data.orderId === id && data.itemId) {
        // Remove item from selected order
        updateSelectedOrder({
          items: selectedOrder?.items?.filter(
            (item: OrderItem) => item.id !== data.itemId
          ),
          total_amount:
            data.order.total_amount || selectedOrder?.total_amount || 0,
          final_amount:
            data.order.final_amount || selectedOrder?.final_amount || 0,
        });
        toast({
          title: "Đã xóa món",
          description: "Món đã được xóa khỏi đơn hàng",
        });
      }
    };

    const handleItemStatusChanged = (data: any) => {
      console.log("[OrderDetail] Order item status changed:", data);
      if (data.orderId === id && data.item) {
        // Update item status in selected order
        updateSelectedOrder({
          items: selectedOrder?.items?.map((item: OrderItem) =>
            item.id === data.itemId ? { ...item, ...data.item } : item
          ),
          total_amount:
            data.order.total_amount || selectedOrder?.total_amount || 0,
          final_amount:
            data.order.final_amount || selectedOrder?.final_amount || 0,
        });
        const itemStatusLabels: Record<string, string> = {
          pending: "Chờ xác nhận",
          preparing: "Đang chuẩn bị",
          ready: "Sẵn sàng",
          completed: "Hoàn thành",
          cancelled: "Đã hủy",
        };
        toast({
          title: "Trạng thái món đã thay đổi",
          description: `${data.item.dish?.name || "Món"} đã chuyển sang "${
            itemStatusLabels[data.item.status] || data.item.status
          }"`,
          variant: "info",
        });
      }
    };

    // Register listeners
    orderSocket.onOrderItemCreated(handleItemCreated);
    orderSocket.onOrderItemQuantityChanged(handleItemQuantityChanged);
    orderSocket.onOrderItemDeleted(handleItemDeleted);
    orderSocket.onOrderItemStatusChanged(handleItemStatusChanged);

    // Cleanup function
    return () => {
      // Note: Socket listeners are managed by the hook, but we can add cleanup if needed
    };
  }, [
    orderSocket.isConnected,
    orderSocket,
    selectedOrder,
    id,
    updateSelectedOrder,
    refreshOrder,
  ]);

  // Handle add dish
  const handleAddDish = async (dish: SelectableDish) => {
    if (!selectedOrder) return;

    try {
      const response = await orderService.addItemToOrder(id, {
        dish_id: dish.id,
        quantity: 1,
      });

      if (response.status === "success") {
        await refreshOrder();
        toast({
          title: "Đã thêm món",
          description: `${dish.name} đã được thêm vào đơn hàng`,
        });
        setIsAddingDishes(false);
      }
    } catch (err: any) {
      console.error("Failed to add dish:", err);
      toast({
        title: "Lỗi",
        description:
          err.response?.data?.message ||
          err.message ||
          "Không thể thêm món vào đơn hàng",
        variant: "destructive",
      });
    }
  };

  // Handle update quantity
  const handleUpdateQuantity = async (itemId: string, delta: number) => {
    if (!selectedOrder?.items) return;

    const item = selectedOrder.items.find((i) => i.id === itemId);
    if (!item) return;

    const newQuantity = Math.max(0, item.quantity + delta);

    if (newQuantity === 0) {
      // Delete item if quantity is 0
      await handleCancelItem(itemId);
      return;
    }

    try {
      setIsUpdatingQuantity(itemId);
      const response = await orderService.updateItemQuantity(
        itemId,
        newQuantity
      );

      if (response.status === "success") {
        await refreshOrder();
        toast({
          title: "Đã cập nhật",
          description: `Số lượng đã được cập nhật thành ${newQuantity}`,
        });
      }
    } catch (err: any) {
      console.error("Failed to update quantity:", err);
      toast({
        title: "Lỗi",
        description:
          err.response?.data?.message ||
          err.message ||
          "Không thể cập nhật số lượng",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingQuantity(null);
    }
  };

  // Handle cancel item
  const handleCancelItem = async (itemId: string) => {
    if (!selectedOrder?.items) return;

    const item = selectedOrder.items.find((i) => i.id === itemId);
    if (!item) return;

    // Check if item can be cancelled
    if (item.status !== "pending" && item.status !== "preparing") {
      toast({
        title: "Không thể hủy",
        description:
          "Chỉ có thể hủy món đang ở trạng thái chờ xác nhận hoặc đang chuẩn bị",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Hủy món "${item.dish?.name || item.dish_id}"?`)) {
      return;
    }

    try {
      await orderService.deleteItem(itemId);
      await refreshOrder();
      toast({
        title: "Đã hủy món",
        description: `Món đã được xóa khỏi đơn hàng`,
      });
    } catch (err: any) {
      console.error("Failed to cancel item:", err);
      toast({
        title: "Lỗi",
        description:
          err.response?.data?.message || err.message || "Không thể hủy món",
        variant: "destructive",
      });
    }
  };

  // Handle request support
  const handleRequestSupport = async () => {
    try {
      const response = await orderService.requestSupport(id);
      if (response.status === "success") {
        orderSocket.requestSupport(id);
        toast({
          title: "Đã gọi nhân viên",
          description: "Nhân viên đang đến bàn của bạn...",
        });
      }
    } catch (err: any) {
      console.error("Failed to request support:", err);
      toast({
        title: "Lỗi",
        description:
          err.response?.data?.message ||
          err.message ||
          "Không thể gọi nhân viên",
        variant: "destructive",
      });
    }
  };

  // Handle apply voucher
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast({
        title: "Vui lòng nhập mã voucher",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsVoucherProcessing(true);
      const response = await orderService.applyVoucher(id, voucherCode.trim());
      if (response.status === "success") {
        setIsVoucherApplied(true);
        await refreshOrder();
        toast({
          title: "Áp dụng voucher thành công",
          description: `Giảm ${(
            response.data.voucher_discount_amount || 0
          ).toLocaleString("vi-VN")}đ cho đơn hàng này`,
        });
      }
    } catch (err: any) {
      console.error("Failed to apply voucher:", err);
      toast({
        title: "Voucher không hợp lệ",
        description:
          err.response?.data?.message ||
          err.message ||
          "Vui lòng kiểm tra lại mã voucher",
        variant: "destructive",
      });
    } finally {
      setIsVoucherProcessing(false);
    }
  };

  // Handle remove voucher
  const handleRemoveVoucher = async () => {
    try {
      setIsVoucherProcessing(true);
      const response = await orderService.removeVoucher(id);
      if (response.status === "success") {
        setIsVoucherApplied(false);
        setVoucherCode("");
        await refreshOrder();
        toast({
          title: "Đã xóa voucher",
          description: "Voucher đã được xóa khỏi đơn hàng",
        });
      }
    } catch (err: any) {
      console.error("Failed to remove voucher:", err);
      toast({
        title: "Lỗi",
        description:
          err.response?.data?.message || err.message || "Không thể xóa voucher",
        variant: "destructive",
      });
    } finally {
      setIsVoucherProcessing(false);
    }
  };

  const openInvoiceDialog = () => {
    setSelectedPaymentMethod("vnpay");
    setCashNote("");
    setPointsToUse(0);
    setIsInvoiceDialogOpen(true);
  };

  const handleInvoiceDialogChange = (open: boolean) => {
    if (!open) {
      setIsProcessingPayment(false);
      setCashNote("");
      setPointsToUse(0);
    }
    setIsInvoiceDialogOpen(open);
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrder) return;
    setIsProcessingPayment(true);
    try {
      // Only allow points for authenticated users
      const pointsUsed = user && user.points ? pointsToUse : 0;

      if (selectedPaymentMethod === "vnpay") {
        // Check if order is waiting_payment - use retry API
        const isWaitingPayment = selectedOrder.status === "waiting_payment";

        if (isWaitingPayment) {
          const response = await orderService.requestPaymentRetry(id, "vnpay", {
            pointsUsed,
          });
          if (response.status === "success" && response.data.redirect_url) {
            window.location.href = response.data.redirect_url;
            return;
          }
        } else {
          const response = await orderService.requestPayment(id, {
            client: "user",
            pointsUsed,
          });
          if (response.status === "success" && response.data.redirect_url) {
            window.location.href = response.data.redirect_url;
            return;
          }
        }

        toast({
          title: "Lỗi thanh toán",
          description:
            "Không thể tạo link thanh toán VNPAY. Vui lòng thử lại hoặc chọn hình thức khác.",
          variant: "destructive",
        });
      } else {
        // Cash payment
        const payload: { note?: string; pointsUsed?: number } = {};
        if (cashNote.trim()) payload.note = cashNote.trim();
        if (pointsUsed > 0) payload.pointsUsed = pointsUsed;

        // Check if order is waiting_payment - use retry API
        const isWaitingPayment = selectedOrder.status === "waiting_payment";

        let response;
        if (isWaitingPayment) {
          response = await orderService.requestPaymentRetry(
            id,
            "cash",
            payload
          );
        } else {
          response = await orderService.requestCashPayment(id, payload);
        }

        if (response.status === "success") {
          toast({
            title: "Đã gửi yêu cầu thanh toán tiền mặt",
            description: "Nhân viên sẽ hỗ trợ bạn trong giây lát.",
            variant: "success",
          });
          setIsInvoiceDialogOpen(false);
          setCashNote("");
          setPointsToUse(0);
          await refreshOrder();
        } else {
          // Handle error response
          toast({
            title: "Lỗi",
            description:
              response.message ||
              "Không thể xử lý thanh toán. Vui lòng thử lại.",
            variant: "destructive",
          });
        }
      }
    } catch (err: any) {
      console.error("Failed to confirm payment:", err);
      toast({
        title: "Lỗi thanh toán",
        description:
          err.response?.data?.message ||
          err.message ||
          "Không thể gửi yêu cầu thanh toán. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Calculate totals
  const subtotal = selectedOrder?.total_amount || 0;
  const voucherDiscount = selectedOrder?.voucher_discount_amount || 0;
  const finalAmount = selectedOrder?.final_amount || 0;
  const paidAmount =
    selectedOrder?.payments?.reduce(
      (sum, payment: any) => sum + (payment.amount || 0),
      0
    ) || 0;
  const outstandingAmount = Math.max(0, finalAmount - paidAmount);
  const canSubmitPayment = true;

  if (authLoading || isLoadingDetail) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  if (detailError || !selectedOrder) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-2 border-red-200 bg-red-50">
              <CardContent className="p-6 text-center">
                <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
                <p className="text-red-600 text-lg mb-4">
                  {detailError || "Không tìm thấy đơn hàng"}
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push("/orders")}
                  className="mt-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại danh sách
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  const status =
    orderStatusConfig[selectedOrder.status] || orderStatusConfig["pending"];
  const orderItems = selectedOrder.items || [];
  const canModifyOrder = ["pending", "dining", "preparing"].includes(
    selectedOrder.status
  );
  const canRequestPayment =
    selectedOrder.payment_status !== "paid" &&
    selectedOrder.status !== "cancelled";

  console.log("Selected Order:", selectedOrder);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/orders")}
              className="border-accent/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-elegant text-4xl font-bold text-primary mb-2">
                Chi Tiết Đơn Hàng
              </h1>
              <p className="text-muted-foreground text-lg">
                Mã đơn: <span className="font-mono font-semibold">{id}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {format(
                  new Date(selectedOrder.created_at),
                  "dd/MM/yyyy HH:mm",
                  {
                    locale: vi,
                  }
                )}
                {selectedOrder.table?.table_number && (
                  <>
                    {" • "}Bàn {selectedOrder.table.table_number}
                  </>
                )}
              </p>
            </div>
            <Badge
              className={cn(`${status.color} text-white px-4 py-2 text-base`)}
            >
              {status.label}
            </Badge>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Invoice Dialog */}
            <Dialog
              open={isInvoiceDialogOpen}
              onOpenChange={handleInvoiceDialogChange}
            >
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Xác Nhận Thanh Toán</DialogTitle>
                  <DialogDescription>
                    Kiểm tra hóa đơn và chọn hình thức thanh toán trước khi gửi
                    yêu cầu.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Professional Invoice Form */}
                  {selectedOrder && (
                    <div className="max-h-[60vh] overflow-y-auto pr-2">
                      <InvoiceForm
                        order={selectedOrder}
                        vatAmount={(selectedOrder as any).vat_amount}
                        pointsUsed={(selectedOrder as any).points_used}
                        finalPaymentAmount={
                          (selectedOrder as any).final_payment_amount
                        }
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-sm">
                      Chọn phương thức thanh toán
                    </Label>
                    <RadioGroup
                      value={selectedPaymentMethod}
                      onValueChange={(value) =>
                        setSelectedPaymentMethod(value as "vnpay" | "cash")
                      }
                      className="grid gap-3"
                    >
                      <div className="flex items-center gap-3 rounded-md border border-accent/20 p-3">
                        <RadioGroupItem value="vnpay" id="method-vnpay" />
                        <Label
                          htmlFor="method-vnpay"
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">VNPAY</span>
                            <CreditCard className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Thanh toán trực tuyến qua cổng VNPAY.
                          </p>
                        </Label>
                      </div>
                      <div className="flex items-center gap-3 rounded-md border border-accent/20 p-3">
                        <RadioGroupItem value="cash" id="method-cash" />
                        <Label
                          htmlFor="method-cash"
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Tiền mặt</span>
                            <Wallet className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Nhân viên sẽ nhận thông báo để hỗ trợ thanh toán
                            trực tiếp.
                          </p>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Points usage (only for authenticated users) */}
                  {user && user.points && user.points > 0 && (
                    <div className="space-y-2 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                      <div className="flex items-center justify-between mb-2">
                        <Label
                          htmlFor="points"
                          className="text-sm font-semibold flex items-center gap-2"
                        >
                          <Star className="h-4 w-4 text-amber-600" />
                          Sử dụng điểm tích lũy
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          Có {user.points.toLocaleString()} điểm (1 điểm = 1đ)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          id="points"
                          type="number"
                          min={0}
                          max={Math.min(user.points || 0, finalAmount)}
                          value={pointsToUse}
                          onChange={(e) => {
                            const value = Math.max(
                              0,
                              Math.min(
                                parseInt(e.target.value) || 0,
                                user.points || 0,
                                finalAmount
                              )
                            );
                            setPointsToUse(value);
                          }}
                          placeholder="0"
                          className="border-amber-300 focus:border-amber-500"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const maxPoints = Math.min(
                              user.points || 0,
                              finalAmount
                            );
                            setPointsToUse(maxPoints);
                          }}
                          className="border-amber-300 text-amber-700 hover:bg-amber-100"
                        >
                          Dùng tối đa
                        </Button>
                      </div>
                      {pointsToUse > 0 && (
                        <p className="text-xs text-amber-700 mt-1">
                          Sẽ giảm {pointsToUse.toLocaleString()}đ từ tổng thanh
                          toán
                        </p>
                      )}
                    </div>
                  )}

                  {selectedPaymentMethod === "cash" && (
                    <div className="space-y-2">
                      <Label htmlFor="cash-note" className="text-sm">
                        Ghi chú cho nhân viên (tuỳ chọn)
                      </Label>
                      <Textarea
                        id="cash-note"
                        placeholder="Ví dụ: Thanh toán bằng tiền mặt, cần xuất hoá đơn VAT..."
                        value={cashNote}
                        onChange={(e) => setCashNote(e.target.value)}
                        rows={3}
                        className="border-accent/20 focus:border-accent"
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => handleInvoiceDialogChange(false)}
                    disabled={isProcessingPayment}
                  >
                    Huỷ
                  </Button>
                  <Button
                    className="bg-gradient-gold text-primary-foreground hover:opacity-90"
                    onClick={handleConfirmPayment}
                    disabled={isProcessingPayment || !canSubmitPayment}
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : selectedPaymentMethod === "vnpay" ? (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Thanh toán VNPAY
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-2 h-4 w-4" />
                        Yêu cầu thanh toán tiền mặt
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* View Invoice Dialog */}
            <Dialog
              open={isViewInvoiceDialogOpen}
              onOpenChange={setIsViewInvoiceDialogOpen}
            >
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Hóa Đơn Thanh Toán</DialogTitle>
                  <DialogDescription>
                    Chi tiết hóa đơn cho đơn hàng #
                    {selectedOrder?.id.slice(0, 8).toUpperCase()}
                  </DialogDescription>
                </DialogHeader>
                {selectedOrder && (
                  <div className="max-h-[80vh] overflow-y-auto pr-2">
                    <InvoiceForm
                      order={selectedOrder}
                      vatAmount={(selectedOrder as any).vat_amount}
                      pointsUsed={(selectedOrder as any).points_used}
                      finalPaymentAmount={
                        (selectedOrder as any).final_payment_amount
                      }
                    />
                  </div>
                )}
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsViewInvoiceDialogOpen(false)}
                  >
                    Đóng
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Dish Selection Dialog */}
            <DishSelectionDialog
              open={isAddingDishes}
              onOpenChange={setIsAddingDishes}
              onSelectDish={handleAddDish}
              selectedDishIds={orderItems.map((item) => item.dish_id)}
              title="Chọn Món Thêm"
              description="Chọn món ăn bạn muốn thêm vào đơn hàng"
            />

            {/* Order Items */}
            <Card className="border-2 border-accent/20 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-elegant text-xl">
                    <ShoppingCart className="h-6 w-6 text-accent" />
                    Món Đã Đặt ({orderItems.length})
                  </CardTitle>
                  {canModifyOrder && (
                    <Button
                      className="bg-gradient-gold text-primary-foreground hover:opacity-90"
                      size="sm"
                      onClick={() => setIsAddingDishes(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm Món
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <AnimatePresence>
                  {orderItems.map((item, index) => {
                    const dish = item.dish;
                    const itemStatus =
                      itemStatusConfig[item.status] ||
                      itemStatusConfig["pending"];
                    const StatusIcon = itemStatus.icon;
                    const canCancel =
                      canModifyOrder &&
                      (item.status === "pending" ||
                        item.status === "preparing");

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        layout
                      >
                        <Card className="border-2 border-accent/10 hover:border-accent/30 transition-all hover:shadow-lg">
                          <CardContent className="p-5">
                            <div className="flex gap-4">
                              {/* Dish Image */}
                              {dish?.media_urls?.[0] && (
                                <motion.div
                                  className="relative w-28 h-28 rounded-lg overflow-hidden flex-shrink-0"
                                  whileHover={{ scale: 1.05 }}
                                >
                                  <Image
                                    src={
                                      dish.media_urls[0] || "/placeholder.svg"
                                    }
                                    alt={dish.name || "Dish"}
                                    fill
                                    className="object-cover"
                                  />
                                </motion.div>
                              )}

                              {/* Dish Info */}
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h4 className="font-bold text-lg text-primary mb-1">
                                      {dish?.name || item.dish_id}
                                    </h4>
                                    <Badge
                                      className={cn(
                                        "text-xs",
                                        itemStatus.color
                                      )}
                                    >
                                      <StatusIcon className="h-3 w-3 mr-1" />
                                      {itemStatus.label}
                                    </Badge>
                                  </div>
                                  {canCancel && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCancelItem(item.id)}
                                      disabled={isUpdatingQuantity === item.id}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>

                                <div className="flex items-center justify-between">
                                  {/* Quantity Controls */}
                                  {canModifyOrder && (
                                    <div className="flex items-center gap-3">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleUpdateQuantity(item.id, -1)
                                        }
                                        disabled={
                                          item.quantity <= 1 ||
                                          isUpdatingQuantity === item.id
                                        }
                                        className="border-accent/20"
                                      >
                                        {isUpdatingQuantity === item.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Minus className="h-4 w-4" />
                                        )}
                                      </Button>
                                      <span className="font-bold text-lg w-8 text-center">
                                        {item.quantity}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleUpdateQuantity(item.id, 1)
                                        }
                                        disabled={
                                          isUpdatingQuantity === item.id
                                        }
                                        className="border-accent/20"
                                      >
                                        {isUpdatingQuantity === item.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Plus className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  )}
                                  {!canModifyOrder && (
                                    <div className="text-sm text-muted-foreground">
                                      Số lượng: {item.quantity}
                                    </div>
                                  )}

                                  {/* Price */}
                                  <div className="text-right">
                                    <p className="text-sm text-muted-foreground">
                                      {item.price.toLocaleString("vi-VN")}đ /món
                                    </p>
                                    <p className="font-bold text-xl text-primary">
                                      {(
                                        item.price * item.quantity
                                      ).toLocaleString("vi-VN")}
                                      đ
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {orderItems.length === 0 && (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Đơn hàng trống</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="border-2 border-accent/20">
              <CardHeader>
                <CardTitle>Thao Tác</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleRequestSupport}
                  className="border-accent/20 hover:bg-accent/10"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Gọi Nhân Viên
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/complaints?orderId=${id}`)}
                  className="border-accent/20 hover:bg-accent/10"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Khiếu Nại / Góp Ý
                </Button>
                {/* Payment Retry Button - Show when status is waiting_payment */}
                {selectedOrder.status === "waiting_payment" && (
                  <div className="space-y-3 w-full">
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800 font-medium mb-2">
                        💳 Chờ thanh toán
                      </p>
                      <p className="text-xs text-orange-600">
                        Đơn hàng đang chờ thanh toán. Vui lòng chọn phương thức
                        thanh toán.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={async () => {
                          setIsProcessingPayment(true);
                          try {
                            const response =
                              await orderService.requestPaymentRetry(
                                id,
                                "vnpay",
                                {
                                  pointsUsed:
                                    user && user.points ? pointsToUse : 0,
                                }
                              );
                            if (
                              response.status === "success" &&
                              response.data.redirect_url
                            ) {
                              window.location.href = response.data.redirect_url;
                              return;
                            }
                            toast({
                              title: "Lỗi",
                              description:
                                response.message ||
                                "Không thể tạo link thanh toán VNPay",
                              variant: "destructive",
                            });
                          } catch (error: any) {
                            console.error("Payment retry error:", error);
                            const errorMessage =
                              error.message ||
                              error.response?.data?.message ||
                              "Không thể yêu cầu thanh toán lại";
                            toast({
                              title: "Lỗi thanh toán",
                              description: errorMessage,
                              variant: "destructive",
                            });
                          } finally {
                            setIsProcessingPayment(false);
                          }
                        }}
                        disabled={isProcessingPayment}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                      >
                        {isProcessingPayment ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CreditCard className="h-4 w-4 mr-2" />
                        )}
                        Thanh toán lại VNPay
                      </Button>
                      <Button
                        onClick={() => {
                          // Open invoice dialog for cash payment to allow note and points
                          setSelectedPaymentMethod("cash");
                          setIsInvoiceDialogOpen(true);
                        }}
                        variant="outline"
                        className="border-2"
                      >
                        <Wallet className="h-4 w-4 mr-2" />
                        Thanh toán lại tiền mặt
                      </Button>
                    </div>
                  </div>
                )}
                {canRequestPayment &&
                  selectedOrder.status !== "waiting_payment" && (
                    <Button
                      className="bg-gradient-gold text-primary-foreground hover:opacity-90"
                      onClick={openInvoiceDialog}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Yêu Cầu Thanh Toán
                    </Button>
                  )}
                {selectedOrder.payment_status === "paid" &&
                  orderItems.every(
                    (i) => i.status === "completed" || i.status === "ready"
                  ) && (
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/reviews/${id}`)}
                      className="border-accent/20 hover:bg-accent/10"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Đánh Giá Bữa Ăn
                    </Button>
                  )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card className="sticky top-24 border-2 border-accent/20 shadow-xl">
              <CardHeader>
                <CardTitle className="font-elegant text-xl">Tổng Kết</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tạm tính:</span>
                    <span>{subtotal.toLocaleString("vi-VN")}đ</span>
                  </div>
                  {voucherDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm giá:</span>
                      <span>-{voucherDiscount.toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-xl">
                    <span>Tổng cộng:</span>
                    <span className="text-primary">
                      {finalAmount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>

                {/* Voucher Input */}
                {canModifyOrder && (
                  <div className="pt-4 border-t">
                    <Label className="text-sm mb-2 block">Mã Giảm Giá</Label>
                    {!isVoucherApplied ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nhập mã..."
                          value={voucherCode}
                          onChange={(e) => setVoucherCode(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleApplyVoucher();
                            }
                          }}
                          className="border-accent/20 focus:border-accent"
                          disabled={isVoucherProcessing}
                        />
                        <Button
                          variant="outline"
                          onClick={handleApplyVoucher}
                          disabled={!voucherCode.trim() || isVoucherProcessing}
                          className="border-accent/20"
                        >
                          {isVoucherProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Gift className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <span className="text-sm text-green-700 font-medium">
                            {selectedOrder.voucher?.code || voucherCode}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveVoucher}
                            className="text-red-500 hover:text-red-700 h-auto p-1"
                            disabled={isVoucherProcessing}
                          >
                            {isVoucherProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-green-600">
                          ✓ Đã áp dụng voucher
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Status */}
                {paidAmount > 0 && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Đã thanh toán:
                      </span>
                      <span className="text-green-600 font-semibold">
                        {paidAmount.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Còn lại:</span>
                      <span className="font-semibold">
                        {outstandingAmount.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  </div>
                )}

                {/* Invoice Button */}
                {selectedOrder && (
                  <Button
                    variant="outline"
                    className="w-full border-accent/20 hover:bg-accent/10"
                    onClick={() => setIsViewInvoiceDialogOpen(true)}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Xem Hóa Đơn
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
