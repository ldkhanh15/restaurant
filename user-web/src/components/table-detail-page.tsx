"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Users,
  MapPin,
  Wifi,
  Zap,
  Trees,
  Music,
  GlassWater,
  Lock,
  Mic2,
  Circle,
  Tag,
  Volume2,
  Tv,
  Car,
  Coffee,
  Utensils,
  Clock,
  Calendar,
  Phone,
  DollarSign,
  XCircle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { TableAttributes, tableService } from "../services/tableService";

export default function TableDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [table, setTable] = useState<TableAttributes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Slider state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const tableId = params.id as string;

  /* --------------------------------------------------------------
   *  Fetch & normalise table data
   * ------------------------------------------------------------ */
  useEffect(() => {
    if (!tableId) return;

    const fetchTable = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await tableService.getById(tableId);

        if (!response?.data) throw new Error("Không tìm thấy bàn");

        const fetched = response.data;

        const normalizedTable: TableAttributes = {
          ...(fetched || {}),

          // ---- panorama_urls -------------------------------------------------
          panorama_urls: Array.isArray(fetched?.panorama_urls)
            ? fetched.panorama_urls
            : fetched?.panorama_urls
            ? [fetched.panorama_urls]
            : ["/placeholder.svg"],

          // ---- amenities (object JSON) ---------------------------------------
          amenities:
            fetched?.amenities &&
            typeof fetched.amenities === "object" &&
            !Array.isArray(fetched.amenities)
              ? fetched.amenities
              : {},
        };

        setTable(normalizedTable);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchTable();
  }, [tableId]);

  /* --------------------------------------------------------------
   *  Helpers
   * ------------------------------------------------------------ */
  const formatVND = (amount: number | string) => {
    const n = Number(amount);
    return isNaN(n) ? "0đ" : n.toLocaleString("vi-VN") + "đ";
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "available":
        return {
          color: "bg-green-500/20 text-green-600 border-green-500/30",
          text: "Có sẵn",
          icon: <CheckCircle className="w-4 h-4" />,
        };
      case "occupied":
        return {
          color: "bg-red-500/20 text-red-600 border-red-500/30",
          text: "Đang sử dụng",
          icon: <XCircle className="w-4 h-4" />,
        };
      case "reserved":
        return {
          color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
          text: "Đã đặt",
          icon: <Calendar className="w-4 h-4" />,
        };
      case "cleaning":
        return {
          color: "bg-blue-500/20 text-blue-600 border-blue-500/30",
          text: "Đang dọn",
          icon: <AlertCircle className="w-4 h-4" />,
        };
      default:
        return {
          color: "bg-gray-500/20 text-gray-600 border-gray-500/30",
          text: "Không xác định",
          icon: null,
        };
    }
  };

  // amenity label
  const getAmenityLabel = (key: string, value: any): string => {
    const labels: Record<string, string> = {
      wifi: "WiFi",
      power: "Ổ cắm",
      garden_view: "View vườn",
      music: "Nhạc nền",
      bar: "Quầy bar",
      minibar: "Minibar",
      private: "Riêng tư",
      karaoke: "Karaoke",
      round: "Bàn tròn",
      stage: "Sân khấu",
      sound: "Hệ thống âm thanh",
      projector: "Máy chiếu",
      parking: "Bãi đỗ xe",
      coffee: "Máy pha cà phê",
      kitchen: "Bếp",
    };

    const base =
      labels[key] ??
      key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    return typeof value === "boolean"
      ? `${base}: ${value ? "Có" : "Không có"}`
      : `${base}: ${value}`;
  };

  // ICON TỰ ĐỘNG – KHÔNG HARDCODE
  const getAmenityIcon = (key: string): JSX.Element => {
    const iconMap: Record<string, JSX.Element> = {
      wifi: <Wifi className="w-5 h-5" />,
      power: <Zap className="w-5 h-5" />,
      garden_view: <Trees className="w-5 h-5" />,
      music: <Music className="w-5 h-5" />,
      bar: <GlassWater className="w-5 h-5" />,
      minibar: <GlassWater className="w-5 h-5" />,
      private: <Lock className="w-5 h-5" />,
      karaoke: <Mic2 className="w-5 h-5" />,
      round: <Circle className="w-5 h-5" />,
      stage: <Tag className="w-5 h-5" />,
      sound: <Volume2 className="w-5 h-5" />,
      projector: <Tv className="w-5 h-5" />,
      parking: <Car className="w-5 h-5" />,
      coffee: <Coffee className="w-5 h-5" />,
      kitchen: <Utensils className="w-5 h-5" />,
    };

    if (iconMap[key]) return iconMap[key];

    const firstLetter = key.charAt(0).toUpperCase();
    const displayName = key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return (
      <div
        className="w-5 h-5 flex items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground"
        title={displayName}
      >
        {firstLetter}
      </div>
    );
  };

  // fake time slots
  const timeSlots = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
  ].map((time) => ({
    time,
    available: Math.random() > 0.3,
  }));

  const images = table?.panorama_urls || ["/placeholder.svg"];
  const totalImages = images.length;

  useEffect(() => {
    if (totalImages <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
    }, 3000); // 3 giây

    return () => clearInterval(interval);
  }, [currentImageIndex, totalImages, isPaused]);

  /* --------------------------------------------------------------
   *  Render loading / error
   * ------------------------------------------------------------ */
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !table) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Lỗi</CardTitle>
            <CardDescription>{error || "Không tìm thấy bàn"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/tables")} className="w-full">
              Quay lại danh sách bàn
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = getStatusConfig(table.status);

  // Format location: Tầng X – Khu Y
  const locationText =
    table.location?.floor && table.location?.area
      ? `Tầng ${table.location.floor} – ${table.location.area}`
      : table.location?.floor
      ? `Tầng ${table.location.floor}`
      : table.location?.area
      ? table.location.area
      : "Không xác định vị trí";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header: Nút "Quay lại" ở góc trên trái */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </div>

        {/* Tên bàn + vị trí nằm ngang, dưới nút quay lại */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Bàn {table.table_number}</h1>
          <p className="text-muted-foreground flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {locationText}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Slider - TỰ ĐỘNG 3s (không nút, không dot) */}
            <div
              className="relative rounded-2xl overflow-hidden shadow-lg bg-muted"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div className="relative aspect-video">
                <img
                  key={currentImageIndex}
                  src={images[currentImageIndex]}
                  alt={`Bàn ${table.table_number} - ảnh ${
                    currentImageIndex + 1
                  }`}
                  className="w-full h-full object-cover transition-opacity duration-500"
                />
              </div>

              {/* Badge trạng thái & sức chứa */}
              <div className="absolute top-6 left-6 flex gap-3">
                <Badge className={status.color}>
                  {status.icon}
                  <span className="ml-1">{status.text}</span>
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-background/80 text-foreground"
                >
                  <Users className="w-4 h-4 mr-2" />
                  {table.capacity} khách
                </Badge>
              </div>
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Về bàn này</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {table.description ??
                    "Bàn ăn thoải mái, phù hợp cho mọi dịp."}
                </p>

                {/* Amenities */}
                {Object.keys(table.amenities).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-4">Tiện ích</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {Object.entries(table.amenities).map(([key, value]) => (
                        <div
                          key={key}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            value === true
                              ? "bg-green-50 border-green-300 text-green-700"
                              : value === false
                              ? "bg-red-50 border-red-300 text-red-700"
                              : "bg-muted/30 border-border"
                          }`}
                        >
                          {getAmenityIcon(key)}
                          <span className="font-medium">
                            {getAmenityLabel(key, value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Policy */}
            <Card>
              <CardHeader>
                <CardTitle>Chính sách đặt bàn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Tiền đặt cọc
                  </span>
                  <span className="font-semibold">
                    {formatVND(table.deposit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Hủy miễn phí
                  </span>
                  <span className="font-semibold">
                    Trước {table.cancel_minutes} phút
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Đặt bàn
                  <span className="text-sm font-normal text-muted-foreground">
                    1 giờ
                  </span>
                </CardTitle>
                <CardDescription>Chọn khung giờ phù hợp</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Time Selection */}
                <div>
                  <h4 className="font-semibold mb-3">Khung giờ hôm nay</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={
                          selectedTime === slot.time ? "default" : "outline"
                        }
                        size="sm"
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className="text-xs"
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Booking Summary */}
                {selectedTime && (
                  <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Bàn {table.table_number}</span>
                      <span>{table.capacity} khách</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Thời gian</span>
                      <span>{selectedTime}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t border-border">
                      <span>Đặt cọc</span>
                      <span>{formatVND(table.deposit)}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                    size="lg"
                    disabled={!selectedTime || table.status !== "available"}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {table.status === "available"
                      ? "Đặt ngay"
                      : "Không khả dụng"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                    size="lg"
                    onClick={() => router.push(`/tables/${tableId}/order`)}
                  >
                    <Utensils className="w-4 h-4 mr-2" />
                    Sử dụng bàn này (Khách vãng lai)
                  </Button>
                  <Button variant="outline" className="w-full" size="lg">
                    <Phone className="w-4 h-4 mr-2" />
                    Gọi nhà hàng
                  </Button>
                </div>

                {/* Quick Info */}
                <div className="pt-4 border-t border-border space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Hủy miễn phí trước {table.cancel_minutes} phút</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{locationText}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
