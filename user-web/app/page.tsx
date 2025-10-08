"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "@/lib/router"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Calendar,
  ShoppingCart,
  MessageCircle,
  User,
  Clock,
  ArrowRight,
  Star,
  Phone,
  MapPin,
  Mail,
  ChefHat,
  PartyPopper,
  Award,
  Heart,
  CheckCircle,
} from "lucide-react"
import LoginPage from "@/components/login-page"
import RegisterPage from "@/components/register-page"
import MenuBrowser from "@/components/menu-browser"
import OrderPlacement from "@/components/order-placement"
import ReservationBooking from "@/components/reservation-booking"
import UserProfile from "@/components/user-profile"
import ChatPopup from "@/components/chat-popup"
import TableListing from "@/components/table-listing"
import BlogSystem from "@/components/blog-system"
import EventsPage from "@/components/events-page"
import VouchersPage from "@/components/vouchers-page"
import TableDetailPage from "@/components/table-detail-page"
import DishDetailPage from "@/components/dish-detail-page"
import EventDetailPage from "@/components/event-detail-page"
import OrderTrackingPage from "@/components/order-tracking-page"
import ReservationTrackingPage from "@/components/reservation-tracking-page"

const featuredDishes = [
  {
    id: "dish-1",
    name: "Cá Hồi Nướng",
    description: "Cá hồi tươi nướng với gia vị đặc biệt, kèm rau củ",
    price: 350000,
    media_urls: ["/grilled-salmon-dish.jpg"],
    is_best_seller: true,
    seasonal: false,
    rating: 4.8,
    reviews_count: 124,
  },
  {
    id: "dish-2",
    name: "Bánh Chocolate",
    description: "Bánh chocolate đậm đà với kem tươi và dâu tây",
    price: 120000,
    media_urls: ["/chocolate-cake-dessert.jpg"],
    is_best_seller: false,
    seasonal: true,
    rating: 4.9,
    reviews_count: 89,
  },
  {
    id: "dish-3",
    name: "Bò Beefsteak",
    description: "Thịt bò Úc cao cấp nướng tại bàn, kèm khoai tây",
    price: 450000,
    media_urls: ["/premium-beef-steak.jpg"],
    is_best_seller: true,
    seasonal: false,
    rating: 4.7,
    reviews_count: 156,
  },
]

const services = [
  {
    id: "fine-dining",
    title: "Fine Dining Experience",
    description: "Trải nghiệm ẩm thực cao cấp với không gian sang trọng và dịch vụ chuyên nghiệp",
    icon: ChefHat,
    features: ["Menu đa dạng", "Đầu bếp chuyên nghiệp", "Không gian sang trọng", "Dịch vụ tận tâm"],
    action: "menu",
  },
  {
    id: "table-reservations",
    title: "Table Reservations",
    description: "Đặt bàn trước để đảm bảo có chỗ ngồi tốt nhất cho bữa ăn của bạn",
    icon: Calendar,
    features: ["Đặt bàn online", "Chọn vị trí", "Đặt món trước", "Xác nhận tức thì"],
    action: "reservations",
  },
  {
    id: "private-events",
    title: "Private Events",
    description: "Tổ chức sự kiện riêng tư với menu và không gian được thiết kế riêng",
    icon: PartyPopper,
    features: ["Không gian riêng", "Menu tùy chỉnh", "Trang trí theo chủ đề", "Dịch vụ chuyên nghiệp"],
    action: "events",
  },
]

const stats = [
  { label: "Năm Kinh Nghiệm", value: "15+", icon: Award },
  { label: "Khách Hàng Hài Lòng", value: "10K+", icon: Heart },
  { label: "Món Ăn Đặc Biệt", value: "200+", icon: ChefHat },
  { label: "Đánh Giá 5 Sao", value: "98%", icon: Star },
]

const testimonials = [
  {
    id: 1,
    name: "Nguyễn Văn An",
    role: "Khách hàng VIP",
    content: "Dịch vụ tuyệt vời, món ăn ngon và không gian sang trọng. Tôi sẽ quay lại nhiều lần nữa!",
    rating: 5,
    avatar: "/professional-asian-man.png",
  },
  {
    id: 2,
    name: "Trần Thị Bình",
    role: "Khách hàng thường xuyên",
    content: "Nhà hàng có menu đa dạng và chất lượng phục vụ rất chuyên nghiệp. Rất đáng để thử!",
    rating: 5,
    avatar: "/professional-asian-woman.png",
  },
  {
    id: 3,
    name: "Lê Minh Cường",
    role: "Doanh nhân",
    content: "Không gian lý tưởng cho các buổi gặp gỡ kinh doanh. Món ăn ngon và dịch vụ chu đáo.",
    rating: 5,
    avatar: "/business-asian-man.jpg",
  },
]

export default function HomePage() {
  const { user, logout } = useAuth()
  const { currentRoute, navigate } = useRouter()
  const [showChatPopup, setShowChatPopup] = useState(false)
  const [isChatMinimized, setIsChatMinimized] = useState(false)
  const [reservationForm, setReservationForm] = useState({
    date: "",
    time: "",
    guests: "",
    name: "",
    phone: "",
  })

  const renderCurrentPage = () => {
    if (!user && currentRoute !== "home" && currentRoute !== "login" && currentRoute !== "register") {
      return <LoginPage />
    }

    switch (currentRoute) {
      case "login":
        return <LoginPage />
      case "register":
        return <RegisterPage />
      case "menu":
        return <MenuBrowser />
      case "tables":
        return <TableListing />
      case "reservations":
        return <ReservationBooking />
      case "order":
        return <OrderPlacement />
      case "profile":
        return <UserProfile />
      case "blog":
        return <BlogSystem />
      case "events":
        return <EventsPage />
      case "vouchers":
        return <VouchersPage />
      case "order-tracking":
        return <OrderTrackingPage />
      case "reservation-tracking":
        return <ReservationTrackingPage />
      case "tracking":
        return <OrderTrackingPage />
      case "table-detail":
        return <TableDetailPage />
      case "dish-detail":
        return <DishDetailPage />
      case "event-detail":
        return <EventDetailPage />
      default:
        return renderHomePage()
    }
  }

  const handleQuickReservation = (e: React.FormEvent) => {
    e.preventDefault()
    if (user) {
      navigate("reservations")
    } else {
      navigate("login")
    }
  }

  const renderHomePage = () => (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center">
              <div className="font-bold text-2xl tracking-tight text-primary">Maison Élégante</div>
              <div className="ml-3 text-sm text-muted-foreground font-light">Fine Dining Experience</div>
            </div>

            {/* Navigation Links */}
            <div className="hidden lg:flex items-center space-x-12">
              <button
                onClick={() => navigate("home")}
                className="text-sm font-medium text-primary hover:text-accent transition-colors"
              >
                Trang Chủ
              </button>
              <button
                onClick={() => navigate("menu")}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Thực Đơn
              </button>
              <button
                onClick={() => navigate("tables")}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Bàn Ăn
              </button>
              {user && (
                <button
                  onClick={() => navigate("reservations")}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Đặt Bàn
                </button>
              )}
              <button
                onClick={() => navigate("events")}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Sự Kiện
              </button>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate("order")}>
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate("order-tracking")}>
                    <Clock className="h-4 w-4" />
                  </Button>
                  <button
                    onClick={() => navigate("profile")}
                    className="flex items-center space-x-2 hover:bg-muted/50 rounded-lg px-3 py-2 transition-colors"
                  >
                    <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-accent" />
                    </div>
                    <div className="text-left hidden md:block">
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <Badge variant="secondary" className="bg-accent/20 text-accent text-xs">
                        {user.ranking}
                      </Badge>
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate("login")}>
                    Đăng Nhập
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate("register")}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Đặt Bàn Ngay
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background/90 z-10" />
        <img
          src="/elegant-restaurant-interior.png"
          alt="Restaurant Interior"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 text-center max-w-5xl mx-auto px-6">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-muted-foreground border border-border/50">
              <Star className="w-4 h-4 text-accent" />
              Michelin Recommended Restaurant
            </div>
          </div>

          <h1 className="font-bold text-5xl md:text-7xl lg:text-8xl mb-8 text-balance leading-[0.9] tracking-tight text-primary">
            Trải nghiệm ẩm thực
            <span className="block font-light italic text-accent">đẳng cấp thế giới</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-12 text-pretty max-w-3xl mx-auto font-light leading-relaxed">
            Khám phá hương vị tinh tế từ những món ăn được chế biến bởi đầu bếp hàng đầu, trong không gian sang trọng và
            dịch vụ chuyên nghiệp.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 h-auto text-base font-medium"
              onClick={() => (user ? navigate("reservations") : navigate("login"))}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Đặt Bàn Ngay
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 h-auto text-base font-medium border-primary/20 hover:bg-primary/5 bg-transparent"
              onClick={() => navigate("menu")}
            >
              <ChefHat className="mr-2 h-5 w-5" />
              Xem Thực Đơn
            </Button>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block text-sm font-medium text-accent mb-4 tracking-wider uppercase">
              Dịch Vụ Của Chúng Tôi
            </div>
            <h2 className="font-bold text-4xl md:text-5xl mb-6 text-balance text-primary">
              Trải nghiệm ẩm thực
              <span className="block italic text-accent">hoàn hảo và đa dạng</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Từ bữa ăn lãng mạn đến tiệc tùng hoành tráng, chúng tôi mang đến những trải nghiệm ẩm thực không thể quên
              với dịch vụ chuyên nghiệp và chất lượng hàng đầu.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {services.map((service) => {
              const IconComponent = service.icon
              return (
                <Card
                  key={service.id}
                  className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-accent/50"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                        <IconComponent className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-primary">{service.title}</CardTitle>
                      </div>
                    </div>
                    <CardDescription className="text-base leading-relaxed">{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-6">
                      {service.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={() => navigate(service.action)}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Tìm Hiểu Thêm
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block text-sm font-medium text-accent mb-4 tracking-wider uppercase">
              Món Ăn Đặc Biệt
            </div>
            <h2 className="font-bold text-4xl md:text-5xl mb-6 text-balance text-primary">
              Hương vị tinh tế
              <span className="block italic text-accent">từ đầu bếp hàng đầu</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featuredDishes.map((dish) => (
              <Card key={dish.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={dish.media_urls[0] || "/placeholder.svg"}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg text-primary">{dish.name}</CardTitle>
                    {dish.is_best_seller && <Badge className="bg-accent text-accent-foreground">Best Seller</Badge>}
                  </div>
                  <CardDescription className="leading-relaxed">{dish.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-primary">{dish.price.toLocaleString("vi-VN")}đ</div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{dish.rating}</span>
                      <span className="text-sm text-muted-foreground">({dish.reviews_count})</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate("menu")}
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    Đặt Món Ngay
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-bold text-4xl md:text-5xl mb-6 text-balance">Con số ấn tượng</h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto leading-relaxed">
              Những thành tựu đáng tự hào trong hành trình phục vụ khách hàng
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-primary-foreground/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <div className="text-4xl font-bold mb-2">{stat.value}</div>
                  <div className="text-lg opacity-90">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block text-sm font-medium text-accent mb-4 tracking-wider uppercase">
              Khách Hàng Nói Gì
            </div>
            <h2 className="font-bold text-4xl md:text-5xl mb-6 text-balance text-primary">
              Trải nghiệm tuyệt vời
              <span className="block italic text-accent">từ khách hàng thân thiết</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="border-2 hover:border-accent/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold text-primary">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="flex space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed italic">"{testimonial.content}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-card/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-bold text-4xl md:text-5xl mb-6 text-balance text-primary">
              Đặt bàn nhanh chóng
              <span className="block italic text-accent">chỉ trong vài bước</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Đặt bàn ngay hôm nay để trải nghiệm những món ăn tuyệt vời và dịch vụ chuyên nghiệp
            </p>
          </div>

          <Card className="border-2 border-accent/20">
            <CardHeader>
              <CardTitle className="text-center text-2xl text-primary">Đặt Bàn Nhanh</CardTitle>
              <CardDescription className="text-center">
                Điền thông tin để chúng tôi sắp xếp bàn tốt nhất cho bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuickReservation} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Ngày</Label>
                    <Input
                      id="date"
                      type="date"
                      value={reservationForm.date}
                      onChange={(e) => setReservationForm((prev) => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Giờ</Label>
                    <Input
                      id="time"
                      type="time"
                      value={reservationForm.time}
                      onChange={(e) => setReservationForm((prev) => ({ ...prev, time: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="guests">Số khách</Label>
                    <Input
                      id="guests"
                      type="number"
                      min="1"
                      max="20"
                      value={reservationForm.guests}
                      onChange={(e) => setReservationForm((prev) => ({ ...prev, guests: e.target.value }))}
                      placeholder="2"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Tên khách hàng</Label>
                    <Input
                      id="name"
                      value={reservationForm.name}
                      onChange={(e) => setReservationForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={reservationForm.phone}
                      onChange={(e) => setReservationForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="0901234567"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-6 text-lg"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  {user ? "Đặt Bàn Ngay" : "Đăng Nhập Để Đặt Bàn"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="bg-primary text-primary-foreground py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Restaurant Info */}
            <div>
              <div className="font-bold text-2xl mb-4">Maison Élégante</div>
              <p className="opacity-90 mb-6 leading-relaxed">
                Nhà hàng cao cấp mang đến trải nghiệm ẩm thực đẳng cấp thế giới với không gian sang trọng và dịch vụ
                chuyên nghiệp.
              </p>
              <div className="flex items-center space-x-2 mb-2">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="text-sm">Michelin Recommended</span>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Liên Hệ</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 opacity-75" />
                  <span className="text-sm opacity-90">123 Đường ABC, Quận 1, TP.HCM</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 opacity-75" />
                  <span className="text-sm opacity-90">+84 901 234 567</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 opacity-75" />
                  <span className="text-sm opacity-90">info@maisonelegante.vn</span>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Dịch Vụ</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate("menu")}
                  className="block text-sm opacity-90 hover:opacity-100 transition-opacity"
                >
                  Thực Đơn
                </button>
                <button
                  onClick={() => navigate("reservations")}
                  className="block text-sm opacity-90 hover:opacity-100 transition-opacity"
                >
                  Đặt Bàn
                </button>
                <button
                  onClick={() => navigate("events")}
                  className="block text-sm opacity-90 hover:opacity-100 transition-opacity"
                >
                  Sự Kiện Riêng
                </button>
              </div>
            </div>

            {/* Hours */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Giờ Mở Cửa</h3>
              <div className="space-y-2 text-sm opacity-90">
                <div className="flex justify-between">
                  <span>Thứ 2 - Thứ 6:</span>
                  <span>11:00 - 22:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Thứ 7 - Chủ Nhật:</span>
                  <span>10:00 - 23:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Ngày lễ:</span>
                  <span>10:00 - 22:00</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-primary-foreground/20 pt-8 text-center">
            <p className="text-sm opacity-75">
              © 2024 Maison Élégante. Tất cả quyền được bảo lưu. | Thiết kế bởi v0.app
            </p>
          </div>
        </div>
      </footer>

      {/* Chat and Support */}
      {user && (
        <ChatPopup
          isOpen={showChatPopup}
          onClose={() => setShowChatPopup(false)}
          onMinimize={() => setIsChatMinimized(!isChatMinimized)}
          isMinimized={isChatMinimized}
        />
      )}

      {user && !showChatPopup && (
        <Button
          onClick={() => setShowChatPopup(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 bg-accent text-accent-foreground hover:bg-accent/90"
          size="sm"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  )

  return renderCurrentPage()
}
