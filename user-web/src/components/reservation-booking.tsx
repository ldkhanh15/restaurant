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
import { Badge } from "@/components/ui/badge";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  CalendarIcon,
  Clock,
  Users,
  MapPin,
  CheckCircle,
  Sparkles,
  Gift,
  Heart,
  PartyPopper,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

const timeSlots = [
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
];

const eventTypes = [
  {
    id: "birthday",
    name: "Tiệc Sinh Nhật",
    description: "Tổ chức tiệc sinh nhật với trang trí đặc biệt",
    icon: PartyPopper,
    additionalCost: 200000,
  },
  {
    id: "anniversary",
    name: "Kỷ Niệm",
    description: "Không gian lãng mạn cho ngày đặc biệt",
    icon: Heart,
    additionalCost: 150000,
  },
  {
    id: "celebration",
    name: "Tiệc Mừng",
    description: "Ăn mừng thành công, thăng tiến",
    icon: Sparkles,
    additionalCost: 300000,
  },
];

interface ReservationData {
  date: Date | undefined;
  time: string;
  num_people: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  special_requests: string;
  event_type?: string;
  table_preference?: string;
}

const steps = [
  { id: 1, name: "Thông tin cơ bản", icon: CalendarIcon },
  { id: 2, name: "Chọn sự kiện", icon: Gift },
  { id: 3, name: "Xác nhận", icon: CheckCircle },
];

export default function ReservationBooking() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [reservationData, setReservationData] = useState<ReservationData>({
    date: undefined,
    time: "",
    num_people: 2,
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    special_requests: "",
  });

  const updateData = (updates: Partial<ReservationData>) => {
    setReservationData((prev) => ({ ...prev, ...updates }));
  };

  const canProceedToStep2 = () => {
    return !!(
      reservationData.date &&
      reservationData.time &&
      reservationData.customer_name &&
      reservationData.customer_phone
    );
  };

  const canSubmit = () => {
    return canProceedToStep2() && reservationData.num_people > 0;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const mockId = `RES-${Date.now()}`;
    setReservationId(mockId);
    setCurrentStep(4); // Success step
    setIsSubmitting(false);
  };

  const totalCost = () => {
    let total = 0;
    if (reservationData.event_type) {
      const event = eventTypes.find((e) => e.id === reservationData.event_type);
      if (event) total += event.additionalCost;
    }
    return total;
  };

  if (currentStep === 4 && reservationId) {
    return (
      <div className="min-h-screen bg-gradient-cream flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full"
        >
          <Card className="border-2 border-accent/30 shadow-2xl bg-card">
            <CardContent className="p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <CheckCircle className="h-12 w-12 text-primary-foreground" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-elegant text-3xl font-bold text-primary mb-4"
              >
                Đặt Bàn Thành Công!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground font-serif mb-6"
              >
                Cảm ơn bạn đã đặt bàn tại Maison Élégante
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-accent/10 border border-accent/20 rounded-lg p-6 mb-6"
              >
                <p className="text-sm text-muted-foreground mb-2">Mã đặt bàn</p>
                <p className="font-mono text-2xl font-bold text-accent">
                  {reservationId}
                </p>
                <Separator className="my-4" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Ngày</p>
                    <p className="font-semibold">
                      {reservationData.date &&
                        format(reservationData.date, "dd/MM/yyyy", {
                          locale: vi,
                        })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Giờ</p>
                    <p className="font-semibold">{reservationData.time}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Số người</p>
                    <p className="font-semibold">
                      {reservationData.num_people} người
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tổng phí</p>
                    <p className="font-semibold text-accent">
                      {totalCost().toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-md"
                  size="lg"
                >
                  Đặt Bàn Mới
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-cream py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-gold rounded-full flex items-center justify-center shadow-lg">
              <CalendarIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-elegant text-4xl md:text-5xl font-bold text-primary">
                Đặt Bàn
              </h1>
              <p className="text-muted-foreground font-serif italic">
                Đặt bàn trước để đảm bảo có chỗ ngồi tốt nhất
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                        isCompleted
                          ? "bg-gradient-gold border-accent text-primary-foreground"
                          : isActive
                          ? "bg-accent/20 border-accent text-accent"
                          : "bg-muted border-border text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </motion.div>
                    <span
                      className={cn(
                        "mt-2 text-xs font-medium text-center hidden sm:block",
                        isActive || isCompleted
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 mx-2 transition-colors duration-300",
                        isCompleted ? "bg-gradient-gold" : "bg-border"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-2 border-accent/20 shadow-xl bg-card/95 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-accent/10 to-accent/5 border-b">
                  <CardTitle className="font-elegant text-2xl text-primary flex items-center gap-2">
                    <CalendarIcon className="h-6 w-6 text-accent" />
                    Thông Tin Đặt Bàn
                  </CardTitle>
                  <CardDescription>
                    Điền thông tin cơ bản để bắt đầu đặt bàn
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Date Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-accent" />
                      Chọn Ngày *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal border-accent/20 hover:border-accent",
                            !reservationData.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {reservationData.date ? (
                            format(reservationData.date, "EEEE, dd MMMM yyyy", {
                              locale: vi,
                            })
                          ) : (
                            <span>Chọn ngày</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={reservationData.date}
                          onSelect={(date) => updateData({ date })}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="rounded-md border-accent/20"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-accent" />
                      Chọn Giờ *
                    </Label>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {timeSlots.map((slot) => (
                        <motion.div
                          key={slot}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant={
                              reservationData.time === slot
                                ? "default"
                                : "outline"
                            }
                            className={cn(
                              "w-full border-accent/20",
                              reservationData.time === slot &&
                                "bg-gradient-gold text-primary-foreground border-accent shadow-md"
                            )}
                            onClick={() => updateData({ time: slot })}
                            size="sm"
                          >
                            {slot}
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Number of People */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 text-accent" />
                      Số Lượng Người *
                    </Label>
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-accent/20"
                          onClick={() =>
                            updateData({
                              num_people: Math.max(
                                1,
                                reservationData.num_people - 1
                              ),
                            })
                          }
                        >
                          -
                        </Button>
                      </motion.div>
                      <div className="flex-1 text-center">
                        <span className="text-2xl font-bold text-primary">
                          {reservationData.num_people}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          người
                        </span>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-accent/20"
                          onClick={() =>
                            updateData({
                              num_people: reservationData.num_people + 1,
                            })
                          }
                        >
                          +
                        </Button>
                      </motion.div>
                    </div>
                  </div>

                  <Separator />

                  {/* Customer Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-primary">
                      Thông Tin Liên Hệ
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Họ và tên *</Label>
                        <Input
                          id="name"
                          value={reservationData.customer_name}
                          onChange={(e) =>
                            updateData({ customer_name: e.target.value })
                          }
                          placeholder="Nguyễn Văn A"
                          className="border-accent/20 focus:border-accent"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại *</Label>
                        <Input
                          id="phone"
                          value={reservationData.customer_phone}
                          onChange={(e) =>
                            updateData({ customer_phone: e.target.value })
                          }
                          placeholder="0901234567"
                          className="border-accent/20 focus:border-accent"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={reservationData.customer_email}
                        onChange={(e) =>
                          updateData({ customer_email: e.target.value })
                        }
                        placeholder="email@example.com"
                        className="border-accent/20 focus:border-accent"
                      />
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div className="space-y-2">
                    <Label htmlFor="requests">Yêu cầu đặc biệt</Label>
                    <Textarea
                      id="requests"
                      placeholder="Ví dụ: Gần cửa sổ, khu vực yên tĩnh, kỷ niệm sinh nhật..."
                      value={reservationData.special_requests}
                      onChange={(e) =>
                        updateData({ special_requests: e.target.value })
                      }
                      className="min-h-[100px] border-accent/20 focus:border-accent"
                    />
                  </div>

                  {/* Next Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => setCurrentStep(2)}
                      disabled={!canProceedToStep2()}
                      className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-200 h-12 text-base font-semibold"
                      size="lg"
                    >
                      Tiếp Theo
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Event Selection */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-2 border-accent/20 shadow-xl bg-card/95 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-accent/10 to-accent/5 border-b">
                  <CardTitle className="font-elegant text-2xl text-primary flex items-center gap-2">
                    <Gift className="h-6 w-6 text-accent" />
                    Chọn Sự Kiện (Tùy chọn)
                  </CardTitle>
                  <CardDescription>
                    Thêm sự kiện đặc biệt cho bữa ăn của bạn
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    {eventTypes.map((event) => {
                      const Icon = event.icon;
                      const isSelected =
                        reservationData.event_type === event.id;

                      return (
                        <motion.div
                          key={event.id}
                          whileHover={{ y: -4 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card
                            className={cn(
                              "cursor-pointer transition-all duration-300 border-2 h-full",
                              isSelected
                                ? "border-accent shadow-lg bg-accent/5"
                                : "border-border hover:border-accent/30"
                            )}
                            onClick={() =>
                              updateData({
                                event_type: isSelected ? undefined : event.id,
                              })
                            }
                          >
                            <CardHeader>
                              <div className="flex items-center justify-between mb-2">
                                <div
                                  className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center",
                                    isSelected
                                      ? "bg-gradient-gold"
                                      : "bg-accent/10"
                                  )}
                                >
                                  <Icon
                                    className={cn(
                                      "h-6 w-6",
                                      isSelected
                                        ? "text-primary-foreground"
                                        : "text-accent"
                                    )}
                                  />
                                </div>
                                {isSelected && (
                                  <Badge className="bg-accent text-accent-foreground">
                                    Đã chọn
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="text-lg">
                                {event.name}
                              </CardTitle>
                              <CardDescription className="text-sm">
                                {event.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="text-sm font-semibold text-accent">
                                +{event.additionalCost.toLocaleString("vi-VN")}đ
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="flex gap-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="w-full border-accent/20 hover:bg-accent/5 h-12"
                        size="lg"
                      >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Quay Lại
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1"
                    >
                      <Button
                        onClick={() => setCurrentStep(3)}
                        className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-200 h-12 text-base font-semibold"
                        size="lg"
                      >
                        Xác Nhận
                        <CheckCircle className="ml-2 h-5 w-5" />
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-2 border-accent/20 shadow-xl bg-card/95 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-accent/10 to-accent/5 border-b">
                  <CardTitle className="font-elegant text-2xl text-primary flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-accent" />
                    Xác Nhận Đặt Bàn
                  </CardTitle>
                  <CardDescription>
                    Vui lòng kiểm tra lại thông tin trước khi xác nhận
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Summary */}
                  <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Ngày</Label>
                        <p className="font-semibold text-primary">
                          {reservationData.date &&
                            format(reservationData.date, "EEEE, dd MMMM yyyy", {
                              locale: vi,
                            })}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Giờ</Label>
                        <p className="font-semibold text-primary">
                          {reservationData.time}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">
                          Số người
                        </Label>
                        <p className="font-semibold text-primary">
                          {reservationData.num_people} người
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">
                          Khách hàng
                        </Label>
                        <p className="font-semibold text-primary">
                          {reservationData.customer_name}
                        </p>
                      </div>
                      {reservationData.event_type && (
                        <div className="md:col-span-2">
                          <Label className="text-muted-foreground">
                            Sự kiện
                          </Label>
                          <p className="font-semibold text-primary">
                            {
                              eventTypes.find(
                                (e) => e.id === reservationData.event_type
                              )?.name
                            }
                          </p>
                        </div>
                      )}
                    </div>
                    {reservationData.special_requests && (
                      <div>
                        <Label className="text-muted-foreground">
                          Yêu cầu đặc biệt
                        </Label>
                        <p className="font-semibold text-primary">
                          {reservationData.special_requests}
                        </p>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Tổng phí:</span>
                      <span className="text-2xl font-bold text-accent">
                        {totalCost().toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                        className="w-full border-accent/20 hover:bg-accent/5 h-12"
                        size="lg"
                      >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Quay Lại
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1"
                    >
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !canSubmit()}
                        className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-200 h-12 text-base font-semibold"
                        size="lg"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-foreground mr-2" />
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-5 w-5" />
                            Xác Nhận Đặt Bàn
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
