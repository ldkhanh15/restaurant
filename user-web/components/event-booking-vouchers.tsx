"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, Gift, Users, Clock, Ticket, CheckCircle, Heart, Sparkles, Star, Utensils } from "lucide-react"

const mockEvents = [
  {
    id: "event-1",
    name: "Tiệc Sinh Nhật",
    description: "Gói tiệc sinh nhật hoàn hảo với trang trí và bánh kem đặc biệt",
    price: 2500000,
    inclusions: ["Trang trí bàn chuyên nghiệp", "Bánh kem sinh nhật", "Nhạc sống", "Photographer", "Menu đặc biệt"],
    decorations: "Bóng bay, hoa tươi và đèn LED",
    duration: "3 giờ",
    max_people: 20,
    image: "/birthday-party-elegant-restaurant.jpg",
    rating: 4.8,
    reviews_count: 45,
    popular: true,
    features: ["Trang trí theo chủ đề", "Bánh kem tùy chỉnh", "Nhạc sống", "Chụp ảnh chuyên nghiệp"],
    sample_menu: ["Khai vị: Salad trái cây", "Món chính: Cá hồi nướng", "Tráng miệng: Bánh sinh nhật"],
    recent_reviews: [
      {
        name: "Nguyễn Thị Lan",
        rating: 5,
        comment: "Tiệc sinh nhật con tôi rất thành công! Trang trí đẹp và món ăn ngon.",
        date: "2024-01-10",
      },
      {
        name: "Trần Văn Minh",
        rating: 5,
        comment: "Dịch vụ tuyệt vời, nhân viên nhiệt tình. Sẽ quay lại lần sau.",
        date: "2024-01-08",
      },
    ],
  },
  {
    id: "event-2",
    name: "Tiệc Cưới",
    description: "Không gian lãng mạn cho ngày trọng đại của bạn",
    price: 15000000,
    inclusions: [
      "Menu cưới cao cấp",
      "Trang trí hoa hồng",
      "MC chuyên nghiệp",
      "Nhạc sống",
      "Photographer & Videographer",
    ],
    decorations: "Hoa hồng, đèn LED và backdrop cưới",
    duration: "5 giờ",
    max_people: 100,
    image: "/wedding-reception-elegant-restaurant.jpg",
    rating: 4.9,
    reviews_count: 28,
    popular: true,
    features: ["Trang trí cưới lãng mạn", "Menu cưới đặc biệt", "MC & nhạc sống", "Chụp ảnh & quay phim"],
    sample_menu: ["Khai vị: Tôm hùm nướng", "Món chính: Bò Wellington", "Tráng miệng: Bánh cưới 3 tầng"],
    recent_reviews: [
      {
        name: "Lê Thị Hoa",
        rating: 5,
        comment: "Đám cưới trong mơ! Mọi thứ đều hoàn hảo từ trang trí đến món ăn.",
        date: "2024-01-12",
      },
      {
        name: "Phạm Văn Đức",
        rating: 5,
        comment: "Không gian lãng mạn, dịch vụ chuyên nghiệp. Cảm ơn team rất nhiều!",
        date: "2024-01-05",
      },
    ],
  },
  {
    id: "event-3",
    name: "Tiệc Công Ty",
    description: "Tổ chức sự kiện doanh nghiệp chuyên nghiệp",
    price: 5000000,
    inclusions: ["Menu buffet", "Âm thanh ánh sáng", "MC", "Trang trí corporate", "Welcome drink"],
    decorations: "Backdrop công ty và hoa tươi",
    duration: "4 giờ",
    max_people: 50,
    image: "/corporate-event-elegant-restaurant.jpg",
    rating: 4.7,
    reviews_count: 32,
    popular: false,
    features: [
      "Menu buffet đa dạng",
      "Hệ thống âm thanh chuyên nghiệp",
      "MC dẫn chương trình",
      "Trang trí theo thương hiệu",
    ],
    sample_menu: ["Buffet: Đa dạng món Á - Âu", "Đồ uống: Cocktail & mocktail", "Tráng miệng: Bánh ngọt cao cấp"],
    recent_reviews: [
      {
        name: "Công ty ABC",
        rating: 5,
        comment: "Sự kiện công ty rất thành công. Nhân viên chuyên nghiệp và chu đáo.",
        date: "2024-01-14",
      },
      {
        name: "Nguyễn Văn Tùng",
        rating: 4,
        comment: "Không gian đẹp, thức ăn ngon. Phù hợp cho các sự kiện doanh nghiệp.",
        date: "2024-01-09",
      },
    ],
  },
  {
    id: "event-4",
    name: "Tiệc Kỷ Niệm",
    description: "Kỷ niệm những dấu mốc quan trọng trong cuộc sống",
    price: 3500000,
    inclusions: ["Menu đặc biệt", "Trang trí theo chủ đề", "Nhạc nền", "Bánh kỷ niệm", "Hoa tươi"],
    decorations: "Trang trí theo yêu cầu và hoa tươi",
    duration: "3 giờ",
    max_people: 30,
    image: "/anniversary-celebration-elegant-restaurant.jpg",
    rating: 4.6,
    reviews_count: 18,
    popular: false,
    features: ["Trang trí cá nhân hóa", "Menu theo yêu cầu", "Không gian ấm cúng", "Dịch vụ tận tâm"],
    sample_menu: ["Khai vị: Pate gan ngỗng", "Món chính: Thịt cừu nướng", "Tráng miệng: Bánh kỷ niệm"],
    recent_reviews: [
      {
        name: "Vũ Thị Mai",
        rating: 5,
        comment: "Kỷ niệm 10 năm cưới rất ý nghĩa. Cảm ơn nhà hàng đã tạo ra khoảnh khắc đẹp.",
        date: "2024-01-11",
      },
      {
        name: "Hoàng Văn Nam",
        rating: 4,
        comment: "Dịch vụ tốt, món ăn ngon. Không gian phù hợp cho các dịp đặc biệt.",
        date: "2024-01-07",
      },
    ],
  },
]

const mockVouchers = [
  {
    id: "voucher-1",
    code: "WELCOME10",
    title: "Chào Mừng Khách Hàng Mới",
    description: "Giảm 10% cho đơn hàng đầu tiên",
    discount_type: "percentage",
    discount_value: 10,
    min_order_value: 200000,
    max_discount: 100000,
    valid_from: "2024-01-01T00:00:00Z",
    valid_until: "2024-12-31T23:59:59Z",
    is_active: true,
    usage_limit: 1,
    used_count: 0,
    category: "new_customer",
    terms: ["Chỉ áp dụng cho khách hàng mới", "Không áp dụng cùng voucher khác", "Áp dụng cho tất cả món ăn"],
  },
  {
    id: "voucher-2",
    code: "SUMMER20",
    title: "Khuyến Mãi Mùa Hè",
    description: "Giảm 20,000đ cho đơn hàng từ 500,000đ",
    discount_type: "fixed",
    discount_value: 20000,
    min_order_value: 500000,
    max_discount: 20000,
    valid_from: "2024-06-01T00:00:00Z",
    valid_until: "2024-08-31T23:59:59Z",
    is_active: true,
    usage_limit: 3,
    used_count: 1,
    category: "seasonal",
    terms: ["Áp dụng từ 1/6 đến 31/8", "Sử dụng tối đa 3 lần", "Không áp dụng cho đồ uống"],
  },
  {
    id: "voucher-3",
    code: "VIP15",
    title: "Ưu Đãi Khách VIP",
    description: "Giảm 15% cho khách hàng VIP",
    discount_type: "percentage",
    discount_value: 15,
    min_order_value: 300000,
    max_discount: 200000,
    valid_from: "2024-01-01T00:00:00Z",
    valid_until: "2024-12-31T23:59:59Z",
    is_active: true,
    usage_limit: 5,
    used_count: 2,
    category: "vip",
    terms: ["Chỉ dành cho khách VIP", "Sử dụng tối đa 5 lần/tháng", "Áp dụng cho tất cả dịch vụ"],
  },
  {
    id: "voucher-4",
    code: "BIRTHDAY50",
    title: "Sinh Nhật Vui Vẻ",
    description: "Giảm 50,000đ cho tiệc sinh nhật",
    discount_type: "fixed",
    discount_value: 50000,
    min_order_value: 1000000,
    max_discount: 50000,
    valid_from: "2024-01-01T00:00:00Z",
    valid_until: "2024-12-31T23:59:59Z",
    is_active: true,
    usage_limit: 2,
    used_count: 0,
    category: "event",
    terms: ["Chỉ áp dụng cho tiệc sinh nhật", "Đơn hàng tối thiểu 1,000,000đ", "Sử dụng tối đa 2 lần/năm"],
  },
  {
    id: "voucher-5",
    code: "WEEKEND25",
    title: "Cuối Tuần Vui Vẻ",
    description: "Giảm 25% cho đơn hàng cuối tuần",
    discount_type: "percentage",
    discount_value: 25,
    min_order_value: 400000,
    max_discount: 150000,
    valid_from: "2024-01-01T00:00:00Z",
    valid_until: "2024-12-31T23:59:59Z",
    is_active: true,
    usage_limit: 4,
    used_count: 1,
    category: "weekend",
    terms: ["Chỉ áp dụng thứ 7 & chủ nhật", "Giảm tối đa 150,000đ", "Không áp dụng ngày lễ"],
  },
  {
    id: "voucher-6",
    code: "COUPLE30",
    title: "Ưu Đãi Cặp Đôi",
    description: "Giảm 30,000đ cho bàn 2 người",
    discount_type: "fixed",
    discount_value: 30000,
    min_order_value: 600000,
    max_discount: 30000,
    valid_from: "2024-01-01T00:00:00Z",
    valid_until: "2024-12-31T23:59:59Z",
    is_active: true,
    usage_limit: 3,
    used_count: 0,
    category: "couple",
    terms: ["Chỉ áp dụng cho bàn 2 người", "Áp dụng tất cả các ngày", "Không áp dụng cùng voucher khác"],
  },
]

const mockVoucherUsages = [
  {
    id: "usage-1",
    voucher_id: "voucher-2",
    order_id: "ORD-2024-001",
    used_at: "2024-01-10T18:30:00Z",
    discount_applied: 20000,
    original_amount: 520000,
    final_amount: 500000,
  },
  {
    id: "usage-2",
    voucher_id: "voucher-3",
    order_id: "ORD-2024-002",
    used_at: "2024-01-08T19:15:00Z",
    discount_applied: 45000,
    original_amount: 300000,
    final_amount: 255000,
  },
  {
    id: "usage-3",
    voucher_id: "voucher-3",
    order_id: "ORD-2024-003",
    used_at: "2024-01-05T20:00:00Z",
    discount_applied: 30000,
    original_amount: 200000,
    final_amount: 170000,
  },
  {
    id: "usage-4",
    voucher_id: "voucher-5",
    order_id: "ORD-2024-004",
    used_at: "2024-01-13T12:30:00Z",
    discount_applied: 100000,
    original_amount: 400000,
    final_amount: 300000,
  },
]

interface EventBookingVouchersProps {
  onClose: () => void
}

export default function EventBookingVouchers({ onClose }: EventBookingVouchersProps) {
  const [activeTab, setActiveTab] = useState<"events" | "vouchers">("events")
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [showEventDetails, setShowEventDetails] = useState<string | null>(null)
  const [voucherFilter, setVoucherFilter] = useState<string>("all")
  const [bookingData, setBookingData] = useState({
    event_date: "",
    event_time: "",
    num_people: "",
    special_requests: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
  })

  const handleEventBooking = () => {
    // Simulate booking process
    const bookingId = `EVT-${Date.now()}`
    alert(`Đặt sự kiện thành công! Mã đặt chỗ: ${bookingId}`)
    setShowBookingForm(false)
    setSelectedEvent(null)
    setBookingData({
      event_date: "",
      event_time: "",
      num_people: "",
      special_requests: "",
      contact_name: "",
      contact_phone: "",
      contact_email: "",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN")
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN") + "đ"
  }

  const getEventIcon = (eventName: string) => {
    if (eventName.includes("Sinh Nhật")) return <Gift className="h-5 w-5" />
    if (eventName.includes("Cưới")) return <Heart className="h-5 w-5" />
    if (eventName.includes("Công Ty")) return <Users className="h-5 w-5" />
    if (eventName.includes("Kỷ Niệm")) return <Sparkles className="h-5 w-5" />
    return <Calendar className="h-5 w-5" />
  }

  const getVoucherCategoryName = (category: string) => {
    const categories = {
      new_customer: "Khách Mới",
      seasonal: "Theo Mùa",
      vip: "VIP",
      event: "Sự Kiện",
      weekend: "Cuối Tuần",
      couple: "Cặp Đôi",
    }
    return categories[category as keyof typeof categories] || "Khác"
  }

  const filteredVouchers =
    voucherFilter === "all" ? mockVouchers : mockVouchers.filter((v) => v.category === voucherFilter)

  const selectedEventData = mockEvents.find((event) => event.id === selectedEvent)
  const eventDetailsData = mockEvents.find((event) => event.id === showEventDetails)

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Sự Kiện & Voucher</DialogTitle>
              <DialogDescription>Tổ chức sự kiện đáng nhớ và sử dụng voucher tiết kiệm</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "events" | "vouchers")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="events" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Đặt Sự Kiện</span>
            </TabsTrigger>
            <TabsTrigger value="vouchers" className="flex items-center space-x-2">
              <Ticket className="w-4 h-4" />
              <span>Voucher ({mockVouchers.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            {!showBookingForm && !showEventDetails ? (
              <div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">Các Gói Sự Kiện</h3>
                  <p className="text-muted-foreground">Tổ chức sự kiện đáng nhớ với các gói dịch vụ chuyên nghiệp</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {mockEvents.map((event) => (
                    <Card key={event.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                      <div className="relative overflow-hidden">
                        <img
                          src={event.image || "/placeholder.svg"}
                          alt={event.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 left-4 flex gap-2">
                          {event.popular && (
                            <Badge className="bg-yellow-500/90 text-yellow-900">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              Phổ Biến
                            </Badge>
                          )}
                          <Badge className="bg-primary/90 text-primary-foreground">
                            {getEventIcon(event.name)}
                            <span className="ml-1">{event.name}</span>
                          </Badge>
                        </div>
                        <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{event.rating}</span>
                            <span className="text-xs text-muted-foreground">({event.reviews_count})</span>
                          </div>
                        </div>
                      </div>

                      <CardHeader>
                        <CardTitle className="text-xl flex items-center justify-between">
                          <div className="flex items-center">
                            {getEventIcon(event.name)}
                            <span className="ml-2">{event.name}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setShowEventDetails(event.id)}>
                            Chi Tiết
                          </Button>
                        </CardTitle>
                        <CardDescription>{event.description}</CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="h-4 w-4 mr-2" />
                            {event.duration}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Users className="h-4 w-4 mr-2" />
                            Tối đa {event.max_people} người
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2 flex items-center">
                            <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                            Điểm Nổi Bật:
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {event.features.slice(0, 3).map((feature, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-border">
                          <div>
                            <span className="text-2xl font-bold text-primary">{formatCurrency(event.price)}</span>
                            <p className="text-xs text-muted-foreground">Giá trọn gói</p>
                          </div>
                          <Button
                            onClick={() => {
                              setSelectedEvent(event.id)
                              setShowBookingForm(true)
                            }}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Đặt Ngay
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : showEventDetails ? (
              /* Added detailed event view with reviews */
              <div>
                <Button variant="ghost" onClick={() => setShowEventDetails(null)} className="mb-4">
                  ← Quay lại danh sách sự kiện
                </Button>

                {eventDetailsData && (
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="relative overflow-hidden rounded-lg">
                        <img
                          src={eventDetailsData.image || "/placeholder.svg"}
                          alt={eventDetailsData.name}
                          className="w-full h-64 object-cover"
                        />
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-primary/90 text-primary-foreground">
                            {getEventIcon(eventDetailsData.name)}
                            <span className="ml-1">{eventDetailsData.name}</span>
                          </Badge>
                        </div>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{eventDetailsData.name}</span>
                            <div className="flex items-center space-x-1">
                              <Star className="w-5 h-5 text-yellow-500 fill-current" />
                              <span className="font-bold">{eventDetailsData.rating}</span>
                              <span className="text-muted-foreground">({eventDetailsData.reviews_count} đánh giá)</span>
                            </div>
                          </CardTitle>
                          <CardDescription>{eventDetailsData.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-primary" />
                              <span>{eventDetailsData.duration}</span>
                            </div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-primary" />
                              <span>Tối đa {eventDetailsData.max_people} người</span>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2 flex items-center">
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                              Dịch Vụ Bao Gồm:
                            </h4>
                            <ul className="space-y-1">
                              {eventDetailsData.inclusions.map((item, index) => (
                                <li key={index} className="flex items-center text-sm">
                                  <div className="w-1 h-1 bg-primary rounded-full mr-2" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2 flex items-center">
                              <Utensils className="h-4 w-4 mr-2 text-orange-500" />
                              Menu Mẫu:
                            </h4>
                            <ul className="space-y-1">
                              {eventDetailsData.sample_menu.map((item, index) => (
                                <li key={index} className="text-sm text-muted-foreground">
                                  • {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Đánh Giá Gần Đây</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {eventDetailsData.recent_reviews.map((review, index) => (
                            <div key={index} className="border-b border-border pb-4 last:border-b-0">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{review.name}</span>
                                <div className="flex items-center space-x-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${
                                        i < review.rating ? "text-yellow-500 fill-current" : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">{review.comment}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(review.date)}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Thông Tin Giá</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span>Giá gói cơ bản:</span>
                              <span className="text-2xl font-bold text-primary">
                                {formatCurrency(eventDetailsData.price)}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>• Giá đã bao gồm VAT</p>
                              <p>• Có thể tùy chỉnh theo yêu cầu</p>
                              <p>• Đặt cọc 30% để giữ chỗ</p>
                            </div>
                            <Button
                              className="w-full"
                              onClick={() => {
                                setSelectedEvent(eventDetailsData.id)
                                setShowEventDetails(null)
                                setShowBookingForm(true)
                              }}
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              Đặt Sự Kiện Này
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Event Booking Form - keeping existing implementation */
              <div>
                <Button variant="ghost" onClick={() => setShowBookingForm(false)} className="mb-4">
                  ← Quay lại danh sách sự kiện
                </Button>
                <h3 className="text-2xl font-bold mb-2">Đặt Sự Kiện: {selectedEventData?.name}</h3>
                <p className="text-muted-foreground mb-6">{selectedEventData?.description}</p>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Thông Tin Sự Kiện</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="event_date">Ngày tổ chức *</Label>
                            <Input
                              id="event_date"
                              type="date"
                              value={bookingData.event_date}
                              onChange={(e) => setBookingData((prev) => ({ ...prev, event_date: e.target.value }))}
                              min={new Date().toISOString().split("T")[0]}
                            />
                          </div>
                          <div>
                            <Label htmlFor="event_time">Giờ bắt đầu *</Label>
                            <Input
                              id="event_time"
                              type="time"
                              value={bookingData.event_time}
                              onChange={(e) => setBookingData((prev) => ({ ...prev, event_time: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="num_people">Số lượng khách *</Label>
                          <Input
                            id="num_people"
                            type="number"
                            placeholder="Nhập số lượng khách"
                            value={bookingData.num_people}
                            onChange={(e) => setBookingData((prev) => ({ ...prev, num_people: e.target.value }))}
                            max={selectedEventData?.max_people}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Tối đa {selectedEventData?.max_people} người
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="special_requests">Yêu cầu đặc biệt</Label>
                          <Textarea
                            id="special_requests"
                            placeholder="Nhập yêu cầu đặc biệt (trang trí thêm, menu đặc biệt, v.v.)"
                            value={bookingData.special_requests}
                            onChange={(e) => setBookingData((prev) => ({ ...prev, special_requests: e.target.value }))}
                            rows={3}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Thông Tin Liên Hệ</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="contact_name">Họ và tên *</Label>
                          <Input
                            id="contact_name"
                            placeholder="Nhập họ và tên"
                            value={bookingData.contact_name}
                            onChange={(e) => setBookingData((prev) => ({ ...prev, contact_name: e.target.value }))}
                          />
                        </div>

                        <div>
                          <Label htmlFor="contact_phone">Số điện thoại *</Label>
                          <Input
                            id="contact_phone"
                            placeholder="Nhập số điện thoại"
                            value={bookingData.contact_phone}
                            onChange={(e) => setBookingData((prev) => ({ ...prev, contact_phone: e.target.value }))}
                          />
                        </div>

                        <div>
                          <Label htmlFor="contact_email">Email</Label>
                          <Input
                            id="contact_email"
                            type="email"
                            placeholder="Nhập email"
                            value={bookingData.contact_email}
                            onChange={(e) => setBookingData((prev) => ({ ...prev, contact_email: e.target.value }))}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <Card className="sticky top-0">
                      <CardHeader>
                        <CardTitle className="text-lg">Tóm Tắt Đặt Chỗ</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Gói sự kiện:</span>
                            <span className="font-medium">{selectedEventData?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Thời gian:</span>
                            <span className="font-medium">{selectedEventData?.duration}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Số khách:</span>
                            <span className="font-medium">{bookingData.num_people || "Chưa chọn"} người</span>
                          </div>
                        </div>

                        <div className="border-t border-border pt-4">
                          <div className="flex justify-between text-lg font-bold">
                            <span>Tổng cộng:</span>
                            <span className="text-primary">{formatCurrency(selectedEventData?.price || 0)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">* Giá đã bao gồm VAT</p>
                        </div>

                        <Button
                          className="w-full"
                          onClick={handleEventBooking}
                          disabled={
                            !bookingData.event_date ||
                            !bookingData.event_time ||
                            !bookingData.num_people ||
                            !bookingData.contact_name ||
                            !bookingData.contact_phone
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Xác Nhận Đặt Sự Kiện
                        </Button>

                        <p className="text-xs text-muted-foreground text-center">
                          Chúng tôi sẽ liên hệ xác nhận trong vòng 24h
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="vouchers" className="space-y-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Voucher Của Bạn</h3>
              <p className="text-muted-foreground">Sử dụng voucher để tiết kiệm chi phí cho đơn hàng</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={voucherFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setVoucherFilter("all")}
              >
                Tất Cả ({mockVouchers.length})
              </Button>
              {Array.from(new Set(mockVouchers.map((v) => v.category))).map((category) => (
                <Button
                  key={category}
                  variant={voucherFilter === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVoucherFilter(category)}
                >
                  {getVoucherCategoryName(category)} ({mockVouchers.filter((v) => v.category === category).length})
                </Button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredVouchers.map((voucher) => {
                const isExpired = new Date(voucher.valid_until) < new Date()
                const isUsedUp = voucher.used_count >= voucher.usage_limit
                const canUse = voucher.is_active && !isExpired && !isUsedUp

                return (
                  <Card
                    key={voucher.id}
                    className={`relative overflow-hidden transition-all duration-300 ${
                      canUse ? "border-primary/50 bg-primary/5 hover:shadow-lg" : "opacity-60"
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-16 h-16">
                      <div
                        className={`absolute transform rotate-45 text-xs font-bold py-1 right-[-35px] top-[32px] w-[170px] text-center ${
                          canUse
                            ? "bg-green-500 text-white"
                            : isExpired
                              ? "bg-red-500 text-white"
                              : "bg-gray-500 text-white"
                        }`}
                      >
                        {canUse ? "Có thể dùng" : isExpired ? "Hết hạn" : "Đã dùng hết"}
                      </div>
                    </div>

                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center">
                          <Ticket className="h-5 w-5 mr-2 text-primary" />
                          {voucher.title}
                        </CardTitle>
                        <Badge variant={canUse ? "default" : "secondary"} className="text-xs">
                          {voucher.code}
                        </Badge>
                      </div>
                      <CardDescription>{voucher.description}</CardDescription>
                      <Badge variant="outline" className="w-fit">
                        {getVoucherCategoryName(voucher.category)}
                      </Badge>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Giảm giá:</span>
                          <p className="font-medium">
                            {voucher.discount_type === "percentage"
                              ? `${voucher.discount_value}%`
                              : formatCurrency(voucher.discount_value)}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Đơn tối thiểu:</span>
                          <p className="font-medium">{formatCurrency(voucher.min_order_value)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Hạn sử dụng:</span>
                          <p className="font-medium">{formatDate(voucher.valid_until)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Đã dùng:</span>
                          <p className="font-medium">
                            {voucher.used_count}/{voucher.usage_limit}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium mb-1">Điều kiện:</p>
                        <ul className="space-y-1">
                          {voucher.terms.slice(0, 2).map((term, index) => (
                            <li key={index}>• {term}</li>
                          ))}
                        </ul>
                      </div>

                      {voucher.discount_type === "percentage" && (
                        <div className="text-xs text-muted-foreground">
                          * Giảm tối đa {formatCurrency(voucher.max_discount)}
                        </div>
                      )}

                      <Button className="w-full" disabled={!canUse} variant={canUse ? "default" : "secondary"}>
                        {canUse ? "Sử Dụng Voucher" : "Không Thể Sử Dụng"}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  Lịch Sử Sử Dụng Voucher
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockVoucherUsages.map((usage) => {
                    const voucher = mockVouchers.find((v) => v.id === usage.voucher_id)
                    return (
                      <div
                        key={usage.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium">{voucher?.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Mã: {voucher?.code} • Đơn hàng: {usage.order_id}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Giá gốc: {formatCurrency(usage.original_amount)} → Thanh toán:{" "}
                              {formatCurrency(usage.final_amount)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">-{formatCurrency(usage.discount_applied)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(usage.used_at)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
