"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import {
  CreditCard,
  Wallet,
  QrCode,
  Gift,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { useReservationStore } from "@/store/reservationStore";
import {
  slideInRight,
  containerVariants,
  itemVariants,
  cardVariants,
  buttonVariants,
  scaleInVariants,
} from "@/lib/motion-variants";

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

// Event types for cost calculation
const eventTypes = [
  { id: "birthday", additionalCost: 200000 },
  { id: "anniversary", additionalCost: 150000 },
  { id: "celebration", additionalCost: 300000 },
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
    if (voucherCode.toUpperCase() === "HIWELL20") {
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
      variants={slideInRight}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-2 border-accent/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CardTitle className="flex items-center gap-2 font-elegant text-2xl">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                <CreditCard className="h-6 w-6 text-accent" />
              </motion.div>
              Thanh Toán Đặt Cọc
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {isVIP
                ? "Bạn là khách VIP, không cần đặt cọc"
                : "Vui lòng đặt cọc để hoàn tất đặt bàn"}
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cost Summary */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            <motion.h3
              variants={itemVariants}
              className="font-semibold text-lg"
            >
              Tổng Kết Chi Phí
            </motion.h3>
            <AnimatePresence>
              {eventCost > 0 && (
                <motion.div
                  variants={itemVariants}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-between text-sm"
                >
                  <span className="text-muted-foreground">Sự kiện:</span>
                  <span>{eventCost.toLocaleString("vi-VN")}đ</span>
                </motion.div>
              )}
              {preOrderCost > 0 && (
                <motion.div
                  variants={itemVariants}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-between text-sm"
                >
                  <span className="text-muted-foreground">Món đặt trước:</span>
                  <span>{preOrderCost.toLocaleString("vi-VN")}đ</span>
                </motion.div>
              )}
            </AnimatePresence>
            <Separator />
            <motion.div
              variants={itemVariants}
              className="flex justify-between font-semibold"
            >
              <span>Tạm tính:</span>
              <span>{subtotal.toLocaleString("vi-VN")}đ</span>
            </motion.div>
            {discount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-between text-sm text-green-600"
              >
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Giảm giá:
                </span>
                <span>-{discount.toLocaleString("vi-VN")}đ</span>
              </motion.div>
            )}
            <Separator />
            <motion.div
              variants={itemVariants}
              className="flex justify-between text-lg font-bold"
            >
              <span>Tổng cộng:</span>
              <motion.span
                key={total}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-primary"
              >
                {total.toLocaleString("vi-VN")}đ
              </motion.span>
            </motion.div>
          </motion.div>

          {/* Voucher */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            <Label className="flex items-center gap-2 font-medium">
              <Gift className="h-4 w-4 text-accent" />
              Mã Voucher
            </Label>
            <div className="flex gap-2">
              <Input
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã voucher"
                disabled={voucherApplied}
                className="border-accent/20 focus:border-accent transition-all duration-200"
              />
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  onClick={handleApplyVoucher}
                  disabled={!voucherCode || voucherApplied}
                  variant="outline"
                  className="border-accent/20 hover:bg-accent/10"
                >
                  Áp dụng
                </Button>
              </motion.div>
            </div>
            <AnimatePresence>
              {voucherApplied && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-sm text-green-600"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Đã áp dụng mã {draft.voucher_code}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {!isVIP && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Separator />
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <motion.div variants={itemVariants}>
                    <p className="font-semibold mb-2">Số tiền đặt cọc:</p>
                    <motion.p
                      key={depositAmount}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className="text-2xl font-bold text-primary"
                    >
                      {depositAmount.toLocaleString("vi-VN")}đ
                    </motion.p>
                    <p className="text-sm text-muted-foreground mt-1">
                      (20% tổng giá trị hoặc tối thiểu 200.000đ)
                    </p>
                  </motion.div>

                  {/* Payment Method */}
                  <motion.div variants={itemVariants} className="space-y-3">
                    <Label className="font-medium">
                      Phương Thức Thanh Toán
                    </Label>
                    <RadioGroup
                      value={draft.payment_method || ""}
                      onValueChange={(value) =>
                        updateDraft({ payment_method: value })
                      }
                    >
                      {paymentMethods.map((method, index) => {
                        const IconComponent = method.icon;
                        return (
                          <motion.div
                            key={method.id}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            whileTap="tap"
                            custom={index}
                          >
                            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-200 hover:border-accent/50">
                              <RadioGroupItem
                                value={method.id}
                                id={method.id}
                              />
                              <Label
                                htmlFor={method.id}
                                className="flex items-center gap-2 flex-1 cursor-pointer"
                              >
                                <motion.div
                                  whileHover={{ rotate: 360 }}
                                  transition={{ duration: 0.5 }}
                                >
                                  <IconComponent className="h-4 w-4 text-accent" />
                                </motion.div>
                                <div>
                                  <span className="font-medium">
                                    {method.name}
                                  </span>
                                  <p className="text-xs text-muted-foreground">
                                    {method.description}
                                  </p>
                                </div>
                              </Label>
                            </div>
                          </motion.div>
                        );
                      })}
                    </RadioGroup>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {isVIP && (
            <motion.div
              variants={scaleInVariants}
              initial="hidden"
              animate="visible"
              className="p-4 bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg border-2 border-accent/20"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="text-center"
              >
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-accent" />
              </motion.div>
              <p className="font-semibold text-accent text-center">
                Bạn là khách VIP, không cần đặt cọc
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
