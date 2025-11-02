"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Wallet, QrCode, Gift, CheckCircle } from "lucide-react";
import { useReservationStore } from "@/store/reservationStore";

const paymentMethods = [
  {
    id: "vnpay",
    name: "VNPay",
    icon: CreditCard,
    description: "Thanh toán online",
  },
  { id: "momo", name: "MoMo", icon: Wallet, description: "Ví điện tử" },
  { id: "qr", name: "QR Code", icon: QrCode, description: "Quét mã QR" },
];

export default function DepositPaymentStep() {
  const { draft, updateDraft, isVIP } = useReservationStore();
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherApplied, setVoucherApplied] = useState(false);

  // Calculate costs
  const eventCost =
    draft.event_type && draft.event_type !== "none"
      ? eventTypes.find((e) => e.id === draft.event_type)?.additionalCost || 0
      : 0;
  const preOrderCost = draft.pre_orders.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const subtotal = eventCost + preOrderCost;
  const discount = draft.voucher_discount || 0;
  const total = subtotal - discount;

  // Deposit: 20% of total, minimum 200k (VIP skip)
  const depositAmount = isVIP ? 0 : Math.max(total * 0.2, 200000);

  const handleApplyVoucher = () => {
    // Mock voucher validation
    if (voucherCode.toUpperCase() === "MAISON20") {
      updateDraft({
        voucher_code: voucherCode,
        voucher_discount: subtotal * 0.2,
      });
      setVoucherApplied(true);
    } else {
      alert("Mã voucher không hợp lệ");
    }
  };

  const handlePayment = async () => {
    updateDraft({ deposit_amount: depositAmount });

    if (!draft.payment_method && !isVIP) {
      alert("Vui lòng chọn phương thức thanh toán");
      return;
    }

    // Mock VNPay payment
    try {
      const mockCreatePayment = async () => {
        await new Promise((res) => setTimeout(res, 800));
        const txnRef = `TXN-${Date.now()}`;
        return {
          paymentUrl: `/mock-vnpay?txnRef=${txnRef}&amount=${depositAmount}`,
        };
      };

      const result = await mockCreatePayment();
      window.location.href = result.paymentUrl;
    } catch (error) {
      console.error("Payment error:", error);
      alert("Có lỗi xảy ra khi tạo thanh toán");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-2 border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-accent" />
            Thanh Toán Đặt Cọc
          </CardTitle>
          <CardDescription>
            {isVIP
              ? "Bạn là khách VIP, không cần đặt cọc"
              : "Vui lòng đặt cọc để hoàn tất đặt bàn"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cost Summary */}
          <div className="space-y-3">
            <h3 className="font-semibold">Tổng Kết Chi Phí</h3>
            {eventCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sự kiện:</span>
                <span>{eventCost.toLocaleString("vi-VN")}đ</span>
              </div>
            )}
            {preOrderCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Món đặt trước:</span>
                <span>{preOrderCost.toLocaleString("vi-VN")}đ</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Tạm tính:</span>
              <span>{subtotal.toLocaleString("vi-VN")}đ</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Giảm giá:</span>
                <span>-{discount.toLocaleString("vi-VN")}đ</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Tổng cộng:</span>
              <span className="text-primary">
                {total.toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>

          {/* Voucher */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Mã Voucher
            </Label>
            <div className="flex gap-2">
              <Input
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã voucher"
                disabled={voucherApplied}
                className="border-accent/20 focus:border-accent"
              />
              <Button
                onClick={handleApplyVoucher}
                disabled={!voucherCode || voucherApplied}
                variant="outline"
              >
                Áp dụng
              </Button>
            </div>
            {voucherApplied && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Đã áp dụng mã {draft.voucher_code}</span>
              </div>
            )}
          </div>

          {!isVIP && (
            <>
              <Separator />
              <div className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">Số tiền đặt cọc:</p>
                  <p className="text-2xl font-bold text-primary">
                    {depositAmount.toLocaleString("vi-VN")}đ
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    (20% tổng giá trị hoặc tối thiểu 200.000đ)
                  </p>
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                  <Label>Phương Thức Thanh Toán</Label>
                  <RadioGroup
                    value={draft.payment_method || ""}
                    onValueChange={(value) =>
                      updateDraft({ payment_method: value })
                    }
                  >
                    {paymentMethods.map((method) => {
                      const IconComponent = method.icon;
                      return (
                        <div
                          key={method.id}
                          className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        >
                          <RadioGroupItem value={method.id} id={method.id} />
                          <Label
                            htmlFor={method.id}
                            className="flex items-center gap-2 flex-1 cursor-pointer"
                          >
                            <IconComponent className="h-4 w-4" />
                            <div>
                              <span className="font-medium">{method.name}</span>
                              <p className="text-xs text-muted-foreground">
                                {method.description}
                              </p>
                            </div>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              </div>
            </>
          )}

          {isVIP && (
            <div className="p-4 bg-accent/10 rounded-lg border border-accent/20 text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-accent" />
              <p className="font-semibold text-accent">
                Bạn là khách VIP, không cần đặt cọc
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Event types for cost calculation - should be imported from shared constants
const eventTypes = [
  { id: "birthday", additionalCost: 200000 },
  { id: "anniversary", additionalCost: 150000 },
  { id: "celebration", additionalCost: 300000 },
];
