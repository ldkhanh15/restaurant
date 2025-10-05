"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "@/lib/router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  Gift,
  Heart,
  Sparkles,
  PartyPopper,
  ArrowRight,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
} from "lucide-react"

const eventTypes = [
  {
    id: "birthday",
    name: "Tiệc Sinh Nhật",
    description: "Tổ chức tiệc sinh nhật đáng nhớ với không gian riêng tư và menu đặc biệt",
    fullDescription:
      "Biến ngày sinh nhật thành kỷ niệm không thể quên với không gian được trang trí theo chủ đề yêu thích, bánh kem độc đáo và những món ăn ngon miệng. Chúng tôi chăm sóc từng chi tiết nhỏ để tạo nên một bữa tiệc hoàn hảo.",
    icon: PartyPopper,
    color: "bg-pink-500",
    minGuests: 5,
    maxGuests: 50,
    basePrice: 500000,
    features: [
      "Bánh sinh nhật miễn phí",
      "Trang trí bàn tiệc",
      "Nhạc nền theo yêu cầu",
      "Chụp ảnh lưu niệm",
      "Không gian riêng tư",
      "Menu trẻ em đặc biệt",
    ],
    image: "/birthday-party-setup.jpg",
    gallery: ["/birthday-party-setup.jpg", "/elegant-restaurant-interior.png"],
    testimonial: {
      name: "Nguyễn Thị Lan",
      content: "Tiệc sinh nhật con tôi thật tuyệt vời! Không gian được trang trí rất đẹp và món ăn ngon tuyệt.",
      rating: 5,
    },
  },
  {
    id: "wedding",
    name: "Tiệc Cưới",
    description: "Không gian lãng mạn cho ngày trọng đại với dịch vụ cao cấp",
    fullDescription:
      "Ngày cưới là một trong những ngày quan trọng nhất trong đời. Chúng tôi tạo ra không gian lãng mạn và sang trọng với dịch vụ đẳng cấp, từ trang trí hoa tươi đến menu cưới đặc biệt, giúp bạn có một đám cưới trong mơ.",
    icon: Heart,
    color: "bg-red-500",
    minGuests: 20,
    maxGuests: 200,
    basePrice: 2000000,
    features: [
      "Trang trí hoa tươi",
      "Menu cưới đặc biệt",
      "Nhạc sống",
      "Photographer chuyên nghiệp",
      "Xe hoa",
      "MC chuyên nghiệp",
      "Không gian VIP",
    ],
    image: "/wedding-reception-elegant.jpg",
    gallery: ["/wedding-reception-elegant.jpg", "/elegant-restaurant-interior.png"],
    testimonial: {
      name: "Trần Văn Minh",
      content: "Đám cưới của chúng tôi thật hoàn hảo! Dịch vụ chuyên nghiệp và không gian tuyệt đẹp.",
      rating: 5,
    },
  },
  {
    id: "corporate",
    name: "Sự Kiện Doanh Nghiệp",
    description: "Tổ chức hội nghị, tiệc công ty với không gian chuyên nghiệp",
    fullDescription:
      "Tạo ấn tượng mạnh mẽ với đối tác và nhân viên thông qua các sự kiện doanh nghiệp được tổ chức chuyên nghiệp. Từ hội nghị quan trọng đến tiệc tất niên, chúng tôi cung cấp đầy đủ thiết bị và dịch vụ cần thiết.",
    icon: Users,
    color: "bg-blue-500",
    minGuests: 10,
    maxGuests: 100,
    basePrice: 800000,
    features: [
      "Thiết bị âm thanh",
      "Projector & màn hình",
      "WiFi tốc độ cao",
      "Menu buffet",
      "Dịch vụ MC",
      "Không gian hội nghị",
      "Dịch vụ trà coffee break",
    ],
    image: "/corporate-event-setup.jpg",
    gallery: ["/corporate-event-setup.jpg", "/elegant-restaurant-interior.png"],
    testimonial: {
      name: "Lê Minh Cường",
      content: "Sự kiện công ty được tổ chức rất chuyên nghiệp. Khách hàng và nhân viên đều hài lòng.",
      rating: 5,
    },
  },
  {
    id: "anniversary",
    name: "Kỷ Niệm",
    description: "Không gian ấm cúng cho các dịp kỷ niệm đặc biệt",
    fullDescription:
      "Những dịp kỷ niệm đặc biệt xứng đáng được tôn vinh trong không gian ấm cúng và lãng mạn. Chúng tôi tạo ra bầu không khí hoàn hảo để bạn chia sẻ những khoảnh khắc quý giá cùng người thân yêu.",
    icon: Sparkles,
    color: "bg-purple-500",
    minGuests: 2,
    maxGuests: 30,
    basePrice: 300000,
    features: [
      "Trang trí lãng mạn",
      "Menu đặc biệt",
      "Nến thơm",
      "Hoa tươi",
      "Quà lưu niệm",
      "Không gian riêng tư",
      "Nhạc nền nhẹ nhàng",
    ],
    image: "/anniversary-dinner-romantic.jpg",
    gallery: ["/anniversary-dinner-romantic.jpg", "/elegant-restaurant-interior.png"],
    testimonial: {
      name: "Phạm Thị Hoa",
      content: "Kỷ niệm ngày cưới của chúng tôi thật ý nghĩa. Không gian lãng mạn và dịch vụ tuyệt vời.",
      rating: 5,
    },
  },
]

const upcomingEvents = [
  {
    id: "event-1",
    type: "birthday",
    title: "Tiệc Sinh Nhật Bé An",
    date: "2024-01-20",
    time: "15:00",
    guests: 15,
    status: "confirmed",
    customer: "Nguyễn Thị Lan",
    phone: "0901234567",
    specialRequests: "Bánh kem hình công chúa, trang trí màu hồng",
    image: "/birthday-party-setup.jpg",
  },
  {
    id: "event-2",
    type: "wedding",
    title: "Tiệc Cưới Minh & Hoa",
    date: "2024-01-25",
    time: "18:00",
    guests: 80,
    status: "confirmed",
    customer: "Trần Văn Minh",
    phone: "0987654321",
    specialRequests: "Menu chay cho 10 khách, nhạc sống từ 19:00",
    image: "/wedding-reception-elegant.jpg",
  },
  {
    id: "event-3",
    type: "corporate",
    title: "Hội Nghị Thường Niên ABC Corp",
    date: "2024-01-28",
    time: "09:00",
    guests: 45,
    status: "confirmed",
    customer: "Lê Minh Cường",
    phone: "0912345678",
    specialRequests: "Cần projector, micro không dây, coffee break 2 lần",
    image: "/corporate-event-setup.jpg",
  },
]

const successStories = [
  {
    id: 1,
    title: "Đám Cưới Cổ Tích của Minh & Hoa",
    description: "Một đám cưới hoàn hảo với 150 khách mời trong không gian lãng mạn và sang trọng",
    image: "/wedding-reception-elegant.jpg",
    date: "2023-12-15",
    type: "wedding",
  },
  {
    id: 2,
    title: "Tiệc Sinh Nhật 5 Tuổi Đáng Nhớ",
    description: "Bữa tiệc sinh nhật với chủ đề công chúa khiến bé An vô cùng hạnh phúc",
    image: "/birthday-party-setup.jpg",
    date: "2023-11-20",
    type: "birthday",
  },
  {
    id: 3,
    title: "Hội Nghị Quốc Tế Thành Công",
    description: "Sự kiện doanh nghiệp quy mô lớn với 200 đại biểu từ khắp châu Á",
    image: "/corporate-event-setup.jpg",
    date: "2023-10-10",
    type: "corporate",
  },
]

export default function EventsPage() {
  const { navigate } = useRouter()
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    eventType: "",
    date: "",
    time: "",
    guests: 0,
    customerName: "",
    phone: "",
    email: "",
    specialRequests: "",
    budget: "",
  })

  const handleBookEvent = (eventTypeId: string) => {
    setBookingForm((prev) => ({ ...prev, eventType: eventTypeId }))
    setShowBookingForm(true)
  }

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setShowBookingForm(false)
  }

  const getEventTypeById = (id: string) => {
    return eventTypes.find((type) => type.id === id)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate("home")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Về Trang Chủ
              </Button>
              <div>
                <h1 className="text-xl font-bold">Tổ Chức Sự Kiện</h1>
                <p className="text-sm text-muted-foreground">Không gian đẳng cấp cho mọi dịp đặc biệt</p>
              </div>
            </div>
            <Button
              onClick={() => navigate("vouchers")}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Gift className="h-4 w-4 mr-2" />
              Xem Voucher
            </Button>
          </div>
        </div>
      </div>

      <section className="relative py-24 px-6 bg-gradient-to-br from-card/50 to-background overflow-hidden">
        <div className="absolute inset-0 bg-[url('/elegant-restaurant-interior.png')] bg-cover bg-center opacity-5" />
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-accent/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-accent border border-accent/20">
              <Sparkles className="w-4 h-4" />
              Chuyên gia tổ chức sự kiện
            </div>
          </div>

          <h1 className="font-bold text-5xl md:text-6xl lg:text-7xl mb-8 text-balance leading-[0.9] tracking-tight text-primary">
            Tổ chức sự kiện
            <span className="block font-light italic text-accent">đẳng cấp và đáng nhớ</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-12 text-pretty max-w-4xl mx-auto font-light leading-relaxed">
            Từ tiệc sinh nhật ấm cúng đến đám cưới hoành tráng, chúng tôi mang đến trải nghiệm không gian và dịch vụ
            hoàn hảo cho mọi dịp đặc biệt của bạn với hơn 15 năm kinh nghiệm.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 h-auto text-base font-medium"
              onClick={() => setShowBookingForm(true)}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Đặt Sự Kiện Ngay
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 h-auto text-base font-medium border-primary/20 hover:bg-primary/5 bg-transparent"
              onClick={() => document.getElementById("event-types")?.scrollIntoView({ behavior: "smooth" })}
            >
              <PartyPopper className="mr-2 h-5 w-5" />
              Xem Các Loại Sự Kiện
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <section id="event-types" className="mb-20">
          <div className="text-center mb-16">
            <div className="inline-block text-sm font-medium text-accent mb-4 tracking-wider uppercase">
              Loại Sự Kiện
            </div>
            <h2 className="font-bold text-4xl md:text-5xl mb-6 text-balance text-primary">
              Dịch vụ tổ chức sự kiện
              <span className="block italic text-accent">chuyên nghiệp và đa dạng</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Chúng tôi cung cấp dịch vụ tổ chức sự kiện toàn diện với đội ngũ chuyên nghiệp và kinh nghiệm nhiều năm
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {eventTypes.map((eventType, index) => {
              const IconComponent = eventType.icon
              return (
                <Card
                  key={eventType.id}
                  className={`group hover:shadow-2xl transition-all duration-500 border-2 hover:border-accent/50 overflow-hidden ${
                    index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                  }`}
                >
                  <div className="relative">
                    <div className="aspect-[4/3] lg:aspect-square lg:w-80 overflow-hidden">
                      <img
                        src={eventType.image || "/placeholder.svg"}
                        alt={eventType.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="absolute top-4 left-4">
                      <div
                        className={`w-12 h-12 ${eventType.color} rounded-xl flex items-center justify-center shadow-lg`}
                      >
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <CardTitle className="text-2xl text-primary">{eventType.name}</CardTitle>
                        <Badge className="bg-accent/10 text-accent border-accent/20">
                          Từ {eventType.basePrice.toLocaleString("vi-VN")}đ
                        </Badge>
                      </div>
                      <CardDescription className="text-base leading-relaxed mb-4">
                        {eventType.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Số khách:</span>
                          <span className="font-medium">
                            {eventType.minGuests} - {eventType.maxGuests} người
                          </span>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm mb-3 text-primary">Dịch vụ bao gồm:</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {eventType.features.slice(0, 4).map((feature, featureIndex) => (
                              <div key={featureIndex} className="flex items-center space-x-2">
                                <CheckCircle className="h-3 w-3 text-accent flex-shrink-0" />
                                <span className="text-xs text-muted-foreground">{feature}</span>
                              </div>
                            ))}
                          </div>
                          {eventType.features.length > 4 && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              và {eventType.features.length - 4} dịch vụ khác...
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                          onClick={() => {
                            localStorage.setItem("selectedEventType", JSON.stringify(eventType))
                            navigate("event-detail")
                          }}
                        >
                          Xem Chi Tiết
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleBookEvent(eventType.id)
                          }}
                        >
                          Đặt Ngay
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="mb-20">
          <div className="text-center mb-16">
            <div className="inline-block text-sm font-medium text-accent mb-4 tracking-wider uppercase">
              Câu Chuyện Thành Công
            </div>
            <h2 className="font-bold text-4xl md:text-5xl mb-6 text-balance text-primary">
              Những sự kiện
              <span className="block italic text-accent">đáng nhớ chúng tôi đã tạo ra</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {successStories.map((story) => {
              const eventType = getEventTypeById(story.type)
              const IconComponent = eventType?.icon || PartyPopper

              return (
                <Card key={story.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={story.image || "/placeholder.svg"}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <div
                        className={`w-10 h-10 ${eventType?.color || "bg-primary"} rounded-lg flex items-center justify-center`}
                      >
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {formatDate(story.date)}
                      </Badge>
                      <Badge className="bg-accent/10 text-accent border-accent/20 text-xs">{eventType?.name}</Badge>
                    </div>
                    <CardTitle className="text-lg text-primary leading-tight">{story.title}</CardTitle>
                    <CardDescription className="leading-relaxed">{story.description}</CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="mb-20">
          <div className="text-center mb-16">
            <div className="inline-block text-sm font-medium text-accent mb-4 tracking-wider uppercase">
              Sự Kiện Sắp Tới
            </div>
            <h2 className="font-bold text-4xl md:text-5xl mb-6 text-balance text-primary">
              Những sự kiện
              <span className="block italic text-accent">đang được chuẩn bị</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => {
              const eventType = getEventTypeById(event.type)
              if (!eventType) return null
              const IconComponent = eventType.icon

              return (
                <Card key={event.id} className="hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <div className={`w-10 h-10 ${eventType.color} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-green-500 text-white border-0">Đã xác nhận</Badge>
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="text-lg text-primary">{event.title}</CardTitle>
                    <CardDescription>{eventType.name}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{event.time}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{event.guests} khách mời</span>
                      </div>

                      <div className="text-sm">
                        <p className="font-medium text-primary">{event.customer}</p>
                        <p className="text-muted-foreground">{event.phone}</p>
                      </div>

                      {event.specialRequests && (
                        <div className="bg-card/50 rounded-lg p-3 border border-border/50">
                          <p className="text-xs text-muted-foreground">
                            <strong>Yêu cầu:</strong> {event.specialRequests}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="bg-primary text-primary-foreground rounded-2xl p-12 text-center">
          <h2 className="font-bold text-4xl md:text-5xl mb-6 text-balance">
            Sẵn sàng tổ chức sự kiện
            <span className="block italic opacity-90">của bạn?</span>
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto leading-relaxed mb-8">
            Liên hệ với chúng tôi ngay hôm nay để được tư vấn miễn phí và nhận báo giá chi tiết cho sự kiện của bạn
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              variant="secondary"
              className="px-8 py-6 h-auto text-base bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              onClick={() => setShowBookingForm(true)}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Đặt Sự Kiện Ngay
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 h-auto text-base border-primary-foreground/20 hover:bg-primary-foreground/10 bg-transparent text-primary-foreground"
            >
              <Phone className="mr-2 h-5 w-5" />
              Gọi Tư Vấn: 0901 234 567
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center text-sm opacity-75">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>123 Đường ABC, Quận 1, TP.HCM</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>events@maisonelegante.vn</span>
            </div>
          </div>
        </section>
      </div>

      {showBookingForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Đặt Sự Kiện</CardTitle>
              <CardDescription>
                Điền thông tin để chúng tôi tư vấn và báo giá chi tiết cho sự kiện của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitBooking} className="space-y-6">
                <div>
                  <Label htmlFor="eventType">Loại sự kiện</Label>
                  <Select
                    value={bookingForm.eventType}
                    onValueChange={(value) => setBookingForm((prev) => ({ ...prev, eventType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại sự kiện" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Ngày tổ chức</Label>
                    <Input
                      id="date"
                      type="date"
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Giờ bắt đầu</Label>
                    <Select
                      value={bookingForm.time}
                      onValueChange={(value) => setBookingForm((prev) => ({ ...prev, time: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giờ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10:00">10:00</SelectItem>
                        <SelectItem value="11:00">11:00</SelectItem>
                        <SelectItem value="12:00">12:00</SelectItem>
                        <SelectItem value="14:00">14:00</SelectItem>
                        <SelectItem value="15:00">15:00</SelectItem>
                        <SelectItem value="16:00">16:00</SelectItem>
                        <SelectItem value="17:00">17:00</SelectItem>
                        <SelectItem value="18:00">18:00</SelectItem>
                        <SelectItem value="19:00">19:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guests">Số khách dự kiến</Label>
                    <Input
                      id="guests"
                      type="number"
                      value={bookingForm.guests || ""}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, guests: Number.parseInt(e.target.value) || 0 }))
                      }
                      placeholder="Nhập số khách"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget">Ngân sách dự kiến</Label>
                    <Select
                      value={bookingForm.budget}
                      onValueChange={(value) => setBookingForm((prev) => ({ ...prev, budget: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn mức ngân sách" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under-5m">Dưới 5 triệu</SelectItem>
                        <SelectItem value="5m-10m">5 - 10 triệu</SelectItem>
                        <SelectItem value="10m-20m">10 - 20 triệu</SelectItem>
                        <SelectItem value="20m-50m">20 - 50 triệu</SelectItem>
                        <SelectItem value="over-50m">Trên 50 triệu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Họ và tên</Label>
                    <Input
                      id="customerName"
                      value={bookingForm.customerName}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, customerName: e.target.value }))}
                      placeholder="Nhập họ và tên"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                      id="phone"
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Nhập số điện thoại"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={bookingForm.email}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Nhập email"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="specialRequests">Yêu cầu đặc biệt</Label>
                  <Textarea
                    id="specialRequests"
                    value={bookingForm.specialRequests}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, specialRequests: e.target.value }))}
                    placeholder="Mô tả chi tiết về yêu cầu trang trí, menu, âm nhạc..."
                    rows={4}
                  />
                </div>

                <div className="flex space-x-3">
                  <Button type="submit" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                    <Calendar className="mr-2 h-4 w-4" />
                    Gửi Yêu Cầu Đặt Sự Kiện
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowBookingForm(false)}>
                    Hủy
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
