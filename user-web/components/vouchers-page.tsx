"use client"

import { useState } from "react"
import { useRouter } from "@/lib/router"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Gift, Calendar, Star, Copy, Check, AlertCircle, Sparkles, Tag, Users } from "lucide-react"

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
  {
    id: "GROUP25",
    title: "Nhóm Đông Vui",
    description: "Giảm 25% cho nhóm từ 8 người trở lên",
    discount: 25,
    type: "percentage",
    minOrder: 800000,
    maxDiscount: 300000,
    validUntil: "2024-04-30",
    category: "group",
    usageLimit: 3,
    used: 0,
    image: "/voucher-group.jpg",
  },
]

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
]

const voucherCategories = {
  new_member: { name: "Thành Viên Mới", color: "bg-green-500", icon: Sparkles },
  birthday: { name: "Sinh Nhật", color: "bg-pink-500", icon: Gift },
  weekend: { name: "Cuối Tuần", color: "bg-blue-500", icon: Calendar },
  vip: { name: "VIP", color: "bg-yellow-500", icon: Star },
  group: { name: "Nhóm", color: "bg-purple-500", icon: Users },
  compensation: { name: "Bồi Thường", color: "bg-orange-500", icon: AlertCircle },
  loyalty: { name: "Thân Thiết", color: "bg-red-500", icon: Star },
}

export default function VouchersPage() {
  const { navigate } = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"available" | "my">("available")
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null)
  const [voucherCode, setVoucherCode] = useState("")
  const [showRedeemDialog, setShowRedeemDialog] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [redeemResult, setRedeemResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleRedeemVoucher = async () => {
    if (!voucherCode.trim()) return

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock response
    const success = Math.random() > 0.3 // 70% success rate
    setRedeemResult({
      success,
      message: success ? "Voucher đã được thêm vào ví của bạn!" : "Mã voucher không hợp lệ hoặc đã hết hạn.",
    })

    if (success) {
      setVoucherCode("")
      setTimeout(() => {
        setShowRedeemDialog(false)
        setRedeemResult(null)
      }, 2000)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const isVoucherExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date()
  }

  const getDiscountText = (voucher: any) => {
    if (voucher.type === "percentage") {
      return `${voucher.discount}%`
    }
    return `${voucher.discount.toLocaleString("vi-VN")}đ`
  }

  const getCategoryInfo = (category: string) => {
    return (
      voucherCategories[category as keyof typeof voucherCategories] || {
        name: "Khác",
        color: "bg-gray-500",
        icon: Tag,
      }
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate("home")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Về Trang Chủ
              </Button>
              <div>
                <h1 className="text-xl font-bold">Voucher & Ưu Đãi</h1>
                <p className="text-sm text-muted-foreground">Tiết kiệm với các voucher hấp dẫn</p>
              </div>
            </div>
            <Button onClick={() => setShowRedeemDialog(true)}>
              <Tag className="h-4 w-4 mr-2" />
              Nhập Mã Voucher
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-8 w-fit">
          <Button
            variant={activeTab === "available" ? "default" : "ghost"}
            onClick={() => setActiveTab("available")}
            className="rounded-md"
          >
            <Gift className="h-4 w-4 mr-2" />
            Voucher Có Sẵn ({availableVouchers.length})
          </Button>
          <Button
            variant={activeTab === "my" ? "default" : "ghost"}
            onClick={() => setActiveTab("my")}
            className="rounded-md"
          >
            <Star className="h-4 w-4 mr-2" />
            Voucher Của Tôi ({myVouchers.length})
          </Button>
        </div>

        {/* Available Vouchers */}
        {activeTab === "available" && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Voucher Có Sẵn</h2>
              <p className="text-muted-foreground">Khám phá các ưu đãi hấp dẫn dành cho bạn</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableVouchers.map((voucher) => {
                const categoryInfo = getCategoryInfo(voucher.category)
                const IconComponent = categoryInfo.icon
                const expired = isVoucherExpired(voucher.validUntil)

                return (
                  <Card
                    key={voucher.id}
                    className={`group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 ${expired ? "opacity-60" : ""}`}
                    onClick={() => setSelectedVoucher(voucher.id)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 ${categoryInfo.color} rounded-lg flex items-center justify-center`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <Badge variant={expired ? "secondary" : "default"}>{expired ? "Hết hạn" : "Có sẵn"}</Badge>
                      </div>
                      <CardTitle className="text-lg">{voucher.title}</CardTitle>
                      <CardDescription>{voucher.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-center py-4 bg-primary/10 rounded-lg">
                          <div className="text-3xl font-bold text-primary">{getDiscountText(voucher)}</div>
                          <div className="text-sm text-muted-foreground">
                            Giảm{" "}
                            {voucher.type === "percentage"
                              ? "tối đa " + voucher.maxDiscount.toLocaleString("vi-VN") + "đ"
                              : ""}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Đơn tối thiểu:</span>
                            <span>{voucher.minOrder.toLocaleString("vi-VN")}đ</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Hạn sử dụng:</span>
                            <span>{formatDate(voucher.validUntil)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Còn lại:</span>
                            <span>
                              {voucher.usageLimit - voucher.used}/{voucher.usageLimit}
                            </span>
                          </div>
                        </div>

                        <Button
                          className="w-full"
                          disabled={expired || voucher.used >= voucher.usageLimit}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCopyCode(voucher.id)
                          }}
                        >
                          {copiedCode === voucher.id ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Đã sao chép
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Sao chép mã
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* My Vouchers */}
        {activeTab === "my" && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Voucher Của Tôi</h2>
              <p className="text-muted-foreground">Quản lý các voucher bạn đã sưu tập</p>
            </div>

            {myVouchers.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Chưa có voucher nào</h3>
                <p className="text-muted-foreground mb-6">Khám phá các voucher có sẵn để bắt đầu tiết kiệm</p>
                <Button onClick={() => setActiveTab("available")}>Xem Voucher Có Sẵn</Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myVouchers.map((voucher) => {
                  const categoryInfo = getCategoryInfo(voucher.category)
                  const IconComponent = categoryInfo.icon
                  const expired = isVoucherExpired(voucher.validUntil)
                  const used = voucher.status === "used"

                  return (
                    <Card
                      key={voucher.id}
                      className={`group hover:shadow-xl transition-all duration-300 border-2 ${
                        used
                          ? "border-gray-300 opacity-60"
                          : expired
                            ? "border-red-300 opacity-60"
                            : "hover:border-primary/50"
                      }`}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between mb-3">
                          <div
                            className={`w-10 h-10 ${categoryInfo.color} rounded-lg flex items-center justify-center`}
                          >
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <Badge variant={used ? "secondary" : expired ? "destructive" : "default"}>
                            {used ? "Đã dùng" : expired ? "Hết hạn" : "Có thể dùng"}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{voucher.title}</CardTitle>
                        <CardDescription>{voucher.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-center py-4 bg-primary/10 rounded-lg">
                            <div className="text-3xl font-bold text-primary">{getDiscountText(voucher)}</div>
                            <div className="text-sm text-muted-foreground">
                              Giảm{" "}
                              {voucher.type === "percentage"
                                ? "tối đa " + voucher.maxDiscount.toLocaleString("vi-VN") + "đ"
                                : ""}
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Đơn tối thiểu:</span>
                              <span>{voucher.minOrder.toLocaleString("vi-VN")}đ</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Hạn sử dụng:</span>
                              <span>{formatDate(voucher.validUntil)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Nhận ngày:</span>
                              <span>{formatDate(voucher.obtainedDate)}</span>
                            </div>
                            {used && voucher.usedDate && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Đã dùng:</span>
                                <span>{formatDate(voucher.usedDate)}</span>
                              </div>
                            )}
                          </div>

                          <Button
                            className="w-full"
                            disabled={used || expired}
                            onClick={() => handleCopyCode(voucher.id)}
                          >
                            {copiedCode === voucher.id ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Đã sao chép
                              </>
                            ) : used ? (
                              "Đã sử dụng"
                            ) : expired ? (
                              "Hết hạn"
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                Sao chép mã
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Redeem Voucher Dialog */}
        {showRedeemDialog && (
          <Dialog open={true} onOpenChange={() => setShowRedeemDialog(false)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nhập Mã Voucher</DialogTitle>
                <DialogDescription>Nhập mã voucher để thêm vào ví của bạn</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="voucher_code">Mã voucher</Label>
                  <Input
                    id="voucher_code"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    placeholder="Nhập mã voucher"
                    className="uppercase"
                  />
                </div>

                {redeemResult && (
                  <Alert variant={redeemResult.success ? "default" : "destructive"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{redeemResult.message}</AlertDescription>
                  </Alert>
                )}

                <div className="flex space-x-3">
                  <Button onClick={handleRedeemVoucher} disabled={!voucherCode.trim()} className="flex-1">
                    Xác Nhận
                  </Button>
                  <Button variant="outline" onClick={() => setShowRedeemDialog(false)}>
                    Hủy
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
