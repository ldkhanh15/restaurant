"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "@/lib/router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Gift,
  Calendar,
  Star,
  Copy,
  Check,
  Sparkles,
  Tag,
  Users,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const availableVouchers = [
  {
    id: "WELCOME20",
    title: "Chào Mừng Thành Viên Mới",
    description: "Giảm 20% cho đơn hàng đầu tiên",
    discount: 20,
    type: "percentage",
    minOrder: 200000,
    maxDiscount: 100000,
    validUntil: "2024-03-31",
    category: "new_member",
    usageLimit: 1,
    used: 0,
    image: "/voucher-welcome.jpg",
  },
  {
    id: "BIRTHDAY50",
    title: "Sinh Nhật Vui Vẻ",
    description: "Giảm 50,000đ cho tiệc sinh nhật",
    discount: 50000,
    type: "fixed",
    minOrder: 500000,
    maxDiscount: 50000,
    validUntil: "2024-12-31",
    category: "birthday",
    usageLimit: 1,
    used: 0,
    image: "/voucher-birthday.jpg",
  },
  {
    id: "WEEKEND15",
    title: "Cuối Tuần Thư Giãn",
    description: "Giảm 15% cho đơn hàng cuối tuần",
    discount: 15,
    type: "percentage",
    minOrder: 300000,
    maxDiscount: 150000,
    validUntil: "2024-02-29",
    category: "weekend",
    usageLimit: 4,
    used: 1,
    image: "/voucher-weekend.jpg",
  },
  {
    id: "VIP100",
    title: "Ưu Đãi VIP",
    description: "Giảm 100,000đ cho thành viên VIP",
    discount: 100000,
    type: "fixed",
    minOrder: 1000000,
    maxDiscount: 100000,
    validUntil: "2024-06-30",
    category: "vip",
    usageLimit: 2,
    used: 0,
    image: "/voucher-vip.jpg",
  },
];

const myVouchers = [
  {
    id: "SAVE30-USER1",
    title: "Tiết Kiệm 30%",
    description: "Voucher đặc biệt từ khiếu nại được giải quyết",
    discount: 30,
    type: "percentage",
    minOrder: 400000,
    maxDiscount: 200000,
    validUntil: "2024-02-15",
    category: "compensation",
    status: "active",
    obtainedDate: "2024-01-10",
  },
  {
    id: "LOYAL50-USER1",
    title: "Khách Hàng Thân Thiết",
    description: "Phần thưởng cho khách hàng trung thành",
    discount: 50000,
    type: "fixed",
    minOrder: 300000,
    maxDiscount: 50000,
    validUntil: "2024-03-01",
    category: "loyalty",
    status: "used",
    obtainedDate: "2024-01-05",
    usedDate: "2024-01-12",
  },
];

const voucherCategories = {
  new_member: { name: "Thành Viên Mới", icon: Sparkles },
  birthday: { name: "Sinh Nhật", icon: Gift },
  weekend: { name: "Cuối Tuần", icon: Calendar },
  vip: { name: "VIP", icon: Star },
  group: { name: "Nhóm", icon: Users },
  compensation: { name: "Bồi Thường", icon: AlertCircle },
  loyalty: { name: "Thân Thiết", icon: Star },
};

// Reusable VoucherCard Component
const VoucherCard = ({
  voucher,
  index,
  variant = "available",
  onAction,
}: {
  voucher: any;
  index: number;
  variant?: "available" | "my";
  onAction?: () => void;
}) => {
  const categoryInfo = voucherCategories[
    voucher.category as keyof typeof voucherCategories
  ] || {
    name: "Khác",
    icon: Tag,
  };
  const IconComponent = categoryInfo.icon;
  const expired = new Date(voucher.validUntil) < new Date();
  const daysUntilExpiry = Math.ceil(
    (new Date(voucher.validUntil).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  const used = variant === "my" && voucher.status === "used";

  const getDiscountText = () => {
    if (voucher.type === "percentage") {
      return `${voucher.discount}%`;
    }
    return `${voucher.discount.toLocaleString("vi-VN")}đ`;
  };

  const getVoucherStatus = () => {
    if (used) return { label: "Đã dùng", color: "bg-gray-500" };
    if (expired) return { label: "Hết hạn", color: "bg-red-500" };
    if (isExpiringSoon) return { label: "Sắp hết hạn", color: "bg-orange-500" };
    return { label: "Đang diễn ra", color: "bg-green-500" };
  };

  const status = getVoucherStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
    >
      <Card className="group relative overflow-hidden border-2 border-transparent hover:border-accent/40 transition-all duration-300 shadow-md hover:shadow-xl bg-gradient-to-br from-yellow-50/50 via-amber-50/30 to-yellow-50/50 h-full flex flex-col">
        {/* Shimmer Effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-yellow-200/20 to-transparent" />

        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        <CardHeader className="relative z-10 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-gold rounded-full flex items-center justify-center shadow-lg">
              <IconComponent className="h-6 w-6 text-primary-foreground" />
            </div>
            <Badge className={`${status.color} text-white border-0 shadow-md`}>
              {status.label}
            </Badge>
          </div>
          <CardTitle className="font-elegant text-xl text-primary mb-2">
            {voucher.title}
          </CardTitle>
          <CardDescription className="font-serif text-sm leading-relaxed">
            {voucher.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 space-y-4 flex-1 flex flex-col">
          {/* Discount Display */}
          <div className="text-center py-6 bg-gradient-gold rounded-lg shadow-md">
            <div className="text-4xl font-bold text-primary-foreground mb-2">
              {getDiscountText()}
            </div>
            <div className="text-sm text-primary-foreground/80">
              {voucher.type === "percentage"
                ? `Tối đa ${voucher.maxDiscount.toLocaleString("vi-VN")}đ`
                : "Giảm giá cố định"}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm flex-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Đơn tối thiểu:</span>
              <span className="font-semibold">
                {voucher.minOrder.toLocaleString("vi-VN")}đ
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hạn sử dụng:</span>
              <span className="font-semibold">
                {format(new Date(voucher.validUntil), "dd/MM/yyyy", {
                  locale: vi,
                })}
              </span>
            </div>
            {voucher.usageLimit && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Còn lại:</span>
                <span className="font-semibold">
                  {voucher.usageLimit - (voucher.used || 0)}/
                  {voucher.usageLimit}
                </span>
              </div>
            )}
            {isExpiringSoon && !expired && (
              <div className="flex items-center gap-2 text-orange-600 text-xs">
                <Clock className="h-3 w-3" />
                <span>Còn {daysUntilExpiry} ngày</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-200"
              disabled={expired || used || voucher.used >= voucher.usageLimit}
              onClick={onAction}
              size="lg"
            >
              {variant === "available" ? (
                <>
                  <Gift className="mr-2 h-4 w-4" />
                  Nhận Ngay
                </>
              ) : used ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Đã Sử Dụng
                </>
              ) : expired ? (
                "Hết Hạn"
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Sử Dụng Ngay
                </>
              )}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function VouchersPage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"available" | "my">("available");
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [redeemResult, setRedeemResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleReceiveVoucher = async (voucherId: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setCopiedCode(voucherId);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRedeemVoucher = async () => {
    if (!voucherCode.trim()) return;

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const success = Math.random() > 0.3;
    setRedeemResult({
      success,
      message: success
        ? "Voucher đã được thêm vào ví của bạn!"
        : "Mã voucher không hợp lệ hoặc đã hết hạn.",
    });

    if (success) {
      setVoucherCode("");
      setTimeout(() => {
        setShowRedeemDialog(false);
        setRedeemResult(null);
      }, 2000);
    }
  };

  // Group vouchers by status
  const groupedMyVouchers = useMemo(() => {
    const active = myVouchers.filter(
      (v) =>
        v.status === "active" &&
        new Date(v.validUntil) >= new Date() &&
        new Date(v.validUntil).getTime() - new Date().getTime() >
          7 * 24 * 60 * 60 * 1000
    );
    const expiringSoon = myVouchers.filter(
      (v) =>
        v.status === "active" &&
        new Date(v.validUntil) >= new Date() &&
        new Date(v.validUntil).getTime() - new Date().getTime() <=
          7 * 24 * 60 * 60 * 1000
    );
    const used = myVouchers.filter((v) => v.status === "used");
    const expired = myVouchers.filter(
      (v) => v.status === "active" && new Date(v.validUntil) < new Date()
    );

    return { active, expiringSoon, used, expired };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-cream py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-gold rounded-full flex items-center justify-center shadow-lg">
                <Gift className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-elegant text-4xl md:text-5xl font-bold text-primary">
                  Voucher & Ưu Đãi
                </h1>
                <p className="text-muted-foreground font-serif italic">
                  Khám phá các ưu đãi hấp dẫn dành cho bạn
                </p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setShowRedeemDialog(true)}
                className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-md"
              >
                <Tag className="h-4 w-4 mr-2" />
                Nhập Mã
              </Button>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-muted/50 p-1 rounded-lg w-fit">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant={activeTab === "available" ? "default" : "ghost"}
                onClick={() => setActiveTab("available")}
                className={activeTab === "available" ? "bg-gradient-gold" : ""}
              >
                <Gift className="h-4 w-4 mr-2" />
                Voucher Có Sẵn ({availableVouchers.length})
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant={activeTab === "my" ? "default" : "ghost"}
                onClick={() => setActiveTab("my")}
                className={activeTab === "my" ? "bg-gradient-gold" : ""}
              >
                <Star className="h-4 w-4 mr-2" />
                Voucher Của Tôi ({myVouchers.length})
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Available Vouchers */}
        <AnimatePresence mode="wait">
          {activeTab === "available" && (
            <motion.div
              key="available"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableVouchers.map((voucher, index) => (
                  <VoucherCard
                    key={voucher.id}
                    voucher={voucher}
                    index={index}
                    variant="available"
                    onAction={() => handleReceiveVoucher(voucher.id)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* My Vouchers */}
          {activeTab === "my" && (
            <motion.div
              key="my"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-12"
            >
              {/* Active Vouchers */}
              {groupedMyVouchers.active.length > 0 && (
                <section>
                  <h2 className="font-elegant text-2xl font-semibold text-primary mb-6 flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    Đang Diễn Ra ({groupedMyVouchers.active.length})
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedMyVouchers.active.map((voucher, index) => (
                      <VoucherCard
                        key={voucher.id}
                        voucher={voucher}
                        index={index}
                        variant="my"
                        onAction={() => navigate("orders")}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Expiring Soon */}
              {groupedMyVouchers.expiringSoon.length > 0 && (
                <section>
                  <h2 className="font-elegant text-2xl font-semibold text-primary mb-6 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    Sắp Hết Hạn ({groupedMyVouchers.expiringSoon.length})
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedMyVouchers.expiringSoon.map((voucher, index) => (
                      <VoucherCard
                        key={voucher.id}
                        voucher={voucher}
                        index={index}
                        variant="my"
                        onAction={() => navigate("orders")}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Used */}
              {groupedMyVouchers.used.length > 0 && (
                <section>
                  <h2 className="font-elegant text-2xl font-semibold text-primary mb-6 flex items-center gap-2">
                    <Check className="h-5 w-5 text-gray-500" />
                    Đã Dùng ({groupedMyVouchers.used.length})
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedMyVouchers.used.map((voucher, index) => (
                      <VoucherCard
                        key={voucher.id}
                        voucher={voucher}
                        index={index}
                        variant="my"
                      />
                    ))}
                  </div>
                </section>
              )}

              {myVouchers.length === 0 && (
                <div className="text-center py-16">
                  <Gift className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-serif text-lg mb-6">
                    Chưa có voucher nào
                  </p>
                  <Button
                    onClick={() => setActiveTab("available")}
                    className="bg-gradient-gold text-primary-foreground"
                  >
                    Xem Voucher Có Sẵn
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Redeem Dialog */}
      <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
        <DialogContent className="border-2 border-accent/20">
          <DialogHeader>
            <DialogTitle className="font-elegant text-2xl">
              Nhập Mã Voucher
            </DialogTitle>
            <DialogDescription className="font-serif">
              Nhập mã voucher để nhận ưu đãi đặc biệt
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="voucher-code">Mã Voucher</Label>
              <Input
                id="voucher-code"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã voucher"
                className="border-accent/20 focus:border-accent mt-1"
              />
            </div>
            {redeemResult && (
              <div
                className={`p-3 rounded-lg ${
                  redeemResult.success
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {redeemResult.message}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRedeemDialog(false)}
                className="flex-1 border-accent/20"
              >
                Hủy
              </Button>
              <Button
                onClick={handleRedeemVoucher}
                className="flex-1 bg-gradient-gold text-primary-foreground hover:opacity-90"
              >
                Xác Nhận
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
