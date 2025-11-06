"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Sparkles,
  ChefHat,
} from "lucide-react";
import Image from "next/image";

// Mock data
const dishes = [
  {
    id: "dish-1",
    name: "Cá Hồi Nướng",
    description:
      "Cá hồi tươi nướng với gia vị đặc biệt, kèm rau củ và khoai tây nghiền",
    price: 350000,
    media_urls: ["/grilled-salmon-dish.jpg"],
  },
  {
    id: "dish-2",
    name: "Bánh Chocolate",
    description: "Bánh chocolate đậm đà với kem tươi và dâu tây tươi ngon",
    price: 120000,
    media_urls: ["/chocolate-cake-dessert.jpg"],
  },
  {
    id: "dish-3",
    name: "Bò Beefsteak",
    description: "Thịt bò Úc cao cấp nướng tại bàn, kèm khoai tây và rau củ",
    price: 450000,
    media_urls: ["/premium-beef-steak.jpg"],
  },
  {
    id: "dish-4",
    name: "Tôm Hùm Nướng",
    description: "Tôm hùm tươi nướng bơ tỏi, kèm cơm và rau củ",
    price: 680000,
    media_urls: ["/grilled-lobster.jpg"],
  },
];

const availableVouchers = [
  {
    id: "voucher-1",
    code: "WELCOME10",
    description: "Giảm 10% cho đơn hàng đầu tiên",
    discount_type: "percentage",
    discount_value: 10,
  },
  {
    id: "voucher-2",
    code: "SAVE50K",
    description: "Giảm 50.000đ cho đơn hàng trên 500.000đ",
    discount_type: "fixed",
    discount_value: 50000,
  },
];

interface CartItem {
  dish_id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export default function OrderPlacement() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<string>("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "vnpay" | "">("");
  const [showVoucherDialog, setShowVoucherDialog] = useState(false);
  const [flyingItem, setFlyingItem] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);

  const addToCart = (
    dish: (typeof dishes)[0],
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const cartButton = document.querySelector("[data-cart-button]");
    const cartRect = cartButton?.getBoundingClientRect();

    if (cartRect) {
      setFlyingItem({
        id: dish.id,
        x: cartRect.left - buttonRect.left,
        y: cartRect.top - buttonRect.top,
      });

      setTimeout(() => {
        setFlyingItem(null);
        const existingItem = cart.find((item) => item.dish_id === dish.id);
        if (existingItem) {
          setCart(
            cart.map((item) =>
              item.dish_id === dish.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          );
    } else {
          setCart([
            ...cart,
            {
              dish_id: dish.id,
              name: dish.name,
              price: dish.price,
              quantity: 1,
              image: dish.media_urls[0],
            },
          ]);
        }
      }, 800);
    }
  };

  const updateQuantity = (dishId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.dish_id === dishId) {
            const newQuantity = item.quantity + delta;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (dishId: string) => {
    setCart(cart.filter((item) => item.dish_id !== dishId));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const selectedVoucherData = availableVouchers.find(
    (v) => v.code === selectedVoucher
  );
  let discount = 0;
  if (selectedVoucherData) {
    if (selectedVoucherData.discount_type === "percentage") {
      discount = (subtotal * selectedVoucherData.discount_value) / 100;
    } else {
      discount = selectedVoucherData.discount_value;
    }
  }

  const total = subtotal - discount;

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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-gold rounded-full flex items-center justify-center shadow-lg">
              <ShoppingCart className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-elegant text-4xl md:text-5xl font-bold text-primary">
                Đặt Món
              </h1>
              <p className="text-muted-foreground font-serif italic">
                Chọn món ăn yêu thích của bạn
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8"
            >
              <div className="flex items-center gap-2 mb-6">
                <ChefHat className="h-5 w-5 text-accent" />
                <h2 className="font-elegant text-2xl font-semibold text-primary">
                  Thực Đơn
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {dishes.map((dish, index) => (
                  <motion.div
                    key={dish.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card className="group overflow-hidden border-2 border-transparent hover:border-accent/30 transition-all duration-300 shadow-md hover:shadow-xl bg-card">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
                        <img
                          src={dish.media_urls[0] || "/placeholder.jpg"}
                        alt={dish.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {flyingItem?.id === dish.id && (
                          <motion.div
                            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                            animate={{
                              x: flyingItem.x,
                              y: flyingItem.y,
                              scale: 0.3,
                              opacity: 0,
                            }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                            className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl z-20 pointer-events-none"
                          >
                            <ShoppingCart className="h-8 w-8 text-accent" />
                          </motion.div>
                        )}
                      </div>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="font-elegant text-xl text-primary group-hover:text-accent transition-colors">
                            {dish.name}
                          </CardTitle>
                          <Badge className="bg-accent/10 text-accent border border-accent/20">
                            {dish.price.toLocaleString("vi-VN")}đ
                          </Badge>
                        </div>
                        <CardDescription className="font-serif text-sm leading-relaxed line-clamp-2">
                          {dish.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            onClick={(e) => addToCart(dish, e)}
                            className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-200 group"
                            size="lg"
                          >
                            <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" />
                            Thêm Vào Giỏ
                          </Button>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                            ))}
                          </div>
            </motion.div>
                        </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="sticky top-24"
            >
              <Card className="border-2 border-accent/20 shadow-xl bg-card/95 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-accent/10 to-accent/5 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-elegant text-2xl text-primary">
                      Giỏ Hàng
                    </CardTitle>
                    <Badge
                      data-cart-button
                      className="bg-accent text-accent-foreground px-3 py-1"
                    >
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px] px-4 py-4">
                    <AnimatePresence mode="popLayout">
                      {cart.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-col items-center justify-center h-full text-center py-12"
                        >
                          <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mb-4" />
                          <p className="text-muted-foreground font-serif">
                            Giỏ hàng của bạn đang trống
                          </p>
                        </motion.div>
                      ) : (
                        cart.map((item, index) => (
                          <motion.div
                            key={item.dish_id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20, scale: 0.8 }}
                            transition={{ duration: 0.3 }}
                            className="mb-4 pb-4 border-b last:border-0"
                          >
                            <div className="flex gap-3">
                              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-border">
                                <img
                                  src={item.image || "/placeholder.jpg"}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                    />
                  </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-primary truncate mb-1">
                                  {item.name}
                                </h4>
                                <p className="text-sm text-accent font-semibold mb-2">
                                  {item.price.toLocaleString("vi-VN")}đ
                                </p>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 border-accent/20 hover:bg-accent/10"
                                    onClick={() =>
                                      updateQuantity(item.dish_id, -1)
                                    }
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="text-sm font-medium w-8 text-center">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 border-accent/20 hover:bg-accent/10"
                                    onClick={() =>
                                      updateQuantity(item.dish_id, 1)
                                    }
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => removeFromCart(item.dish_id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  </div>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </ScrollArea>
                </CardContent>

                {cart.length > 0 && (
                  <div className="px-4 pb-4 space-y-4">
                    <Separator />

                    {/* Voucher */}
                          <div>
                          <Button
                            variant="outline"
                        className="w-full justify-between border-accent/20 hover:bg-accent/5"
                        onClick={() => setShowVoucherDialog(true)}
                      >
                        <span className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-accent" />
                          {selectedVoucher
                            ? selectedVoucher
                            : "Áp dụng voucher"}
                        </span>
                        <Sparkles className="h-4 w-4 text-accent" />
                          </Button>
                        </div>

                    {/* Summary */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tạm tính:</span>
                        <span className="font-medium">
                          {subtotal.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                      {discount > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex justify-between text-accent"
                        >
                          <span>Giảm giá:</span>
                          <span className="font-semibold">
                            -{discount.toLocaleString("vi-VN")}đ
                          </span>
                        </motion.div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-lg font-bold text-primary">
                        <span>Tổng cộng:</span>
                        <span className="text-gradient-gold">
                          {total.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                </div>

            {/* Payment Method */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Phương thức thanh toán
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={
                            paymentMethod === "cash" ? "default" : "outline"
                          }
                          className={
                            paymentMethod === "cash" ? "bg-gradient-gold" : ""
                          }
                          onClick={() => setPaymentMethod("cash")}
                          size="sm"
                        >
                          <Banknote className="h-4 w-4 mr-2" />
                      Tiền mặt
                        </Button>
                        <Button
                          variant={
                            paymentMethod === "vnpay" ? "default" : "outline"
                          }
                          className={
                            paymentMethod === "vnpay" ? "bg-gradient-gold" : ""
                          }
                          onClick={() => setPaymentMethod("vnpay")}
                          size="sm"
                        >
                          <Smartphone className="h-4 w-4 mr-2" />
                          VNPay
                        </Button>
                  </div>
                </div>

                    {/* Special Requests */}
                    <div>
                      <Label htmlFor="requests" className="text-sm font-medium">
                        Yêu cầu đặc biệt
                      </Label>
                      <Textarea
                        id="requests"
                        placeholder="Không cay, không hành, v.v..."
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        className="mt-1 min-h-[80px] border-accent/20 focus:border-accent"
                      />
                </div>

                    {/* Order Button */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-200 h-12 text-base font-semibold"
                        disabled={cart.length === 0 || !paymentMethod}
                        size="lg"
                      >
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Đặt Món Ngay
                      </Button>
                    </motion.div>
                  </div>
                )}
            </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
