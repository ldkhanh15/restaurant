"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Tag,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle,
  Clock,
} from "lucide-react"

// Mock data
const dishes = [
  {
    id: "dish-1",
    name: "Cá Hồi Nướng",
    price: 350000,
    media_urls: ["/grilled-salmon-dish.jpg"],
  },
  {
    id: "dish-2",
    name: "Bánh Chocolate",
    price: 120000,
    media_urls: ["/chocolate-cake-dessert.jpg"],
  },
  {
    id: "dish-3",
    name: "Bò Beefsteak",
    price: 450000,
    media_urls: ["/premium-beef-steak.jpg"],
  },
]

const availableVouchers = [
  {
    id: "voucher-1",
    code: "WELCOME10",
    description: "Giảm 10% cho đơn hàng đầu tiên",
    discount_type: "percentage",
    discount_value: 10,
    min_order_value: 200000,
    max_discount: 50000,
    is_active: true,
    expires_at: "2024-12-31",
  },
  {
    id: "voucher-2",
    code: "SUMMER20",
    description: "Giảm 20,000đ cho đơn hàng từ 300,000đ",
    discount_type: "fixed",
    discount_value: 20000,
    min_order_value: 300000,
    max_discount: 20000,
    is_active: true,
    expires_at: "2024-08-31",
  },
  {
    id: "voucher-3",
    code: "VIP15",
    description: "Giảm 15% dành cho thành viên VIP",
    discount_type: "percentage",
    discount_value: 15,
    min_order_value: 500000,
    max_discount: 100000,
    is_active: true,
    expires_at: "2024-12-31",
  },
]

interface CartItem {
  dish_id: string
  quantity: number
  customizations: Record<string, any>
  special_requests?: string
}

interface OrderPlacementProps {
  initialCart?: CartItem[]
  onOrderComplete?: (orderId: string) => void
}

export default function OrderPlacement({ initialCart = [], onOrderComplete }: OrderPlacementProps) {
  const [cart, setCart] = useState<CartItem[]>(
    initialCart.length > 0
      ? initialCart
      : [
          { dish_id: "dish-1", quantity: 2, customizations: { spice_level: "medium" }, special_requests: "Không muối" },
          { dish_id: "dish-2", quantity: 1, customizations: {}, special_requests: "" },
        ],
  )

  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null)
  const [voucherCode, setVoucherCode] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"zalopay" | "momo" | "cash">("cash")
  const [customerInfo, setCustomerInfo] = useState({
    phone: "0901234567",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  const updateQuantity = (dishId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart((prev) => prev.filter((item) => item.dish_id !== dishId))
    } else {
      setCart((prev) => prev.map((item) => (item.dish_id === dishId ? { ...item, quantity: newQuantity } : item)))
    }
  }

  const updateSpecialRequest = (dishId: string, request: string) => {
    setCart((prev) => prev.map((item) => (item.dish_id === dishId ? { ...item, special_requests: request } : item)))
  }

  const removeFromCart = (dishId: string) => {
    setCart((prev) => prev.filter((item) => item.dish_id !== dishId))
  }

  const getSubtotal = () => {
    return cart.reduce((total, item) => {
      const dish = dishes.find((d) => d.id === item.dish_id)
      return total + (dish ? dish.price * item.quantity : 0)
    }, 0)
  }

  const applyVoucher = () => {
    const voucher = availableVouchers.find((v) => v.code === voucherCode && v.is_active)
    if (voucher) {
      const subtotal = getSubtotal()
      if (subtotal >= voucher.min_order_value) {
        setAppliedVoucher(voucher.id)
        setVoucherCode("")
      } else {
        alert(`Đơn hàng tối thiểu ${voucher.min_order_value.toLocaleString("vi-VN")}đ để sử dụng voucher này`)
      }
    } else {
      alert("Mã voucher không hợp lệ hoặc đã hết hạn")
    }
  }

  const getDiscountAmount = () => {
    if (!appliedVoucher) return 0

    const voucher = availableVouchers.find((v) => v.id === appliedVoucher)
    if (!voucher) return 0

    const subtotal = getSubtotal()
    let discount = 0

    if (voucher.discount_type === "percentage") {
      discount = (subtotal * voucher.discount_value) / 100
    } else {
      discount = voucher.discount_value
    }

    return Math.min(discount, voucher.max_discount)
  }

  const getTotal = () => {
    return getSubtotal() - getDiscountAmount()
  }

  const submitOrder = async () => {
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const mockOrderId = `ORD-${Date.now()}`
    setOrderId(mockOrderId)
    setOrderComplete(true)
    setIsSubmitting(false)

    if (onOrderComplete) {
      onOrderComplete(mockOrderId)
    }
  }

  if (orderComplete && orderId) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Đặt Hàng Thành Công!</CardTitle>
            <CardDescription>Cảm ơn bạn đã đặt hàng tại nhà hàng của chúng tôi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="font-semibold">Mã đơn hàng: {orderId}</p>
              <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Thời gian chuẩn bị: 25-30 phút</span>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold">Thông tin đơn hàng:</h4>
              <p className="text-sm text-muted-foreground">Tổng tiền: {getTotal().toLocaleString("vi-VN")}đ</p>
              <p className="text-sm text-muted-foreground">
                Phương thức thanh toán:{" "}
                {paymentMethod === "cash" ? "Tiền mặt" : paymentMethod === "zalopay" ? "ZaloPay" : "MoMo"}
              </p>
            </div>
            <Button className="w-full" onClick={() => window.location.reload()}>
              Đặt Đơn Hàng Mới
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Giỏ hàng trống</h2>
            <p className="text-muted-foreground mb-6">Hãy thêm một số món ăn vào giỏ hàng để bắt đầu đặt hàng</p>
            <Button onClick={() => window.history.back()}>Quay lại thực đơn</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Đặt Hàng</h1>
          <p className="text-muted-foreground">Xem lại đơn hàng và hoàn tất thanh toán</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Giỏ Hàng ({cart.length} món)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item) => {
                  const dish = dishes.find((d) => d.id === item.dish_id)
                  if (!dish) return null

                  return (
                    <div key={item.dish_id} className="flex gap-4 p-4 border border-border rounded-lg">
                      <img
                        src={dish.media_urls[0] || "/placeholder.svg"}
                        alt={dish.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold">{dish.name}</h3>
                          <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.dish_id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.dish_id, item.quantity - 1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.dish_id, item.quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Customizations */}
                        {Object.keys(item.customizations).length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Tùy chỉnh: </span>
                            {Object.entries(item.customizations).map(([key, value]) => (
                              <span key={key}>
                                {key}: {String(value)}{" "}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Special Requests */}
                        <div className="space-y-1">
                          <Label htmlFor={`request-${item.dish_id}`} className="text-sm">
                            Yêu cầu đặc biệt:
                          </Label>
                          <Input
                            id={`request-${item.dish_id}`}
                            placeholder="Ví dụ: Không cay, ít muối..."
                            value={item.special_requests || ""}
                            onChange={(e) => updateSpecialRequest(item.dish_id, e.target.value)}
                            className="text-sm"
                          />
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            {dish.price.toLocaleString("vi-VN")}đ x {item.quantity}
                          </span>
                          <span className="font-semibold text-primary">
                            {(dish.price * item.quantity).toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Thông Tin Giao Hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                      id="phone"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Địa chỉ giao hàng</Label>
                    <Input
                      id="address"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo((prev) => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Ghi chú thêm</Label>
                  <Textarea
                    id="notes"
                    placeholder="Ghi chú cho đơn hàng..."
                    value={customerInfo.notes}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Voucher Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tag className="mr-2 h-5 w-5" />
                  Mã Giảm Giá
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {appliedVoucher ? (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-green-600">
                          {availableVouchers.find((v) => v.id === appliedVoucher)?.code}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {availableVouchers.find((v) => v.id === appliedVoucher)?.description}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setAppliedVoucher(null)}>
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Nhập mã giảm giá"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    />
                    <Button onClick={applyVoucher} disabled={!voucherCode}>
                      Áp dụng
                    </Button>
                  </div>
                )}

                {/* Available Vouchers */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Voucher khả dụng:</p>
                  {availableVouchers
                    .filter((v) => v.is_active && getSubtotal() >= v.min_order_value)
                    .map((voucher) => (
                      <div key={voucher.id} className="p-2 border border-border rounded text-sm">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{voucher.code}</span>
                            <p className="text-muted-foreground text-xs">{voucher.description}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setVoucherCode(voucher.code)
                              applyVoucher()
                            }}
                            disabled={appliedVoucher === voucher.id}
                          >
                            Dùng
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Phương Thức Thanh Toán</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="cash"
                      name="payment"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                    />
                    <Label htmlFor="cash" className="flex items-center cursor-pointer">
                      <Banknote className="mr-2 h-4 w-4" />
                      Tiền mặt
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="zalopay"
                      name="payment"
                      value="zalopay"
                      checked={paymentMethod === "zalopay"}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                    />
                    <Label htmlFor="zalopay" className="flex items-center cursor-pointer">
                      <Smartphone className="mr-2 h-4 w-4" />
                      ZaloPay
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="momo"
                      name="payment"
                      value="momo"
                      checked={paymentMethod === "momo"}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                    />
                    <Label htmlFor="momo" className="flex items-center cursor-pointer">
                      <CreditCard className="mr-2 h-4 w-4" />
                      MoMo
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Tổng Kết Đơn Hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span>{getSubtotal().toLocaleString("vi-VN")}đ</span>
                </div>
                {appliedVoucher && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá:</span>
                    <span>-{getDiscountAmount().toLocaleString("vi-VN")}đ</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">{getTotal().toLocaleString("vi-VN")}đ</span>
                </div>
                <Button className="w-full" size="lg" onClick={submitOrder} disabled={isSubmitting}>
                  {isSubmitting ? "Đang xử lý..." : "Đặt Hàng"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
