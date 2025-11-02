"use client"

import { useState } from "react"
import { useRouter } from "@/lib/router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Users, Clock, MapPin, Star, Phone, Mail } from "lucide-react"

const events = [
  {
    id: "event-1",
    title: "Tiệc Sinh Nhật Sang Trọng",
    description: "Tổ chức tiệc sinh nhật đáng nhớ với không gian sang trọng và dịch vụ chuyên nghiệp",
    price_from: 2500000,
    duration: "3-4 giờ",
    min_guests: 10,
    max_guests: 50,
    images: ["/elegant-restaurant-interior.png"],
    features: ["Trang trí theo chủ đề", "Bánh sinh nhật cao cấp", "Nhiếp ảnh gia chuyên nghiệp", "DJ/Nhạc sống"],
    includes: ["Menu buffet cao cấp", "Nước uống không giới hạn", "Trang trí bàn tiệc", "Dịch vụ phục vụ riêng"],
    spaces: ["Phòng VIP tầng 2", "Sân thượng view sông", "Khu vực riêng tầng 1"],
    rating: 4.9,
    reviews: 67,
    contact: {
      phone: "0123-456-789",
      email: "events@restaurant.com",
    },
  },
  {
    id: "event-2",
    title: "Tiệc Cưới Cổ Điển",
    description: "Tổ chức tiệc cưới trong không gian cổ điển với dịch vụ hoàn hảo cho ngày trọng đại",
    price_from: 5000000,
    duration: "5-6 giờ",
    min_guests: 50,
    max_guests: 200,
    images: ["/elegant-restaurant-interior.png"],
    features: ["Trang trí cưới sang trọng", "Menu cưới đặc biệt", "Dịch vụ MC chuyên nghiệp", "Hoa cưới cao cấp"],
    includes: ["Menu 8 món đặc biệt", "Rượu vang cao cấp", "Bánh cưới 3 tầng", "Dịch vụ trang trí hoàn chỉnh"],
    spaces: ["Toàn bộ tầng 2", "Sảnh chính", "Khu vườn ngoài trời"],
    rating: 4.8,
    reviews: 34,
    contact: {
      phone: "0123-456-789",
      email: "wedding@restaurant.com",
    },
  },
]

export default function EventDetailPage() {
  const { params, navigate, goBack } = useRouter()
  const [selectedImage, setSelectedImage] = useState(0)

  const event = events.find((e) => e.id === params.id)

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Không tìm thấy sự kiện</CardTitle>
            <CardDescription>Sự kiện bạn đang tìm không tồn tại.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("events")} className="w-full">
              Quay lại danh sách sự kiện
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" onClick={goBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
            <h1 className="text-xl font-semibold">{event.title}</h1>
            <div className="w-20" /> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden">
              <img
                src={event.images[selectedImage] || "/placeholder.svg"}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
            {event.images.length > 1 && (
              <div className="flex gap-2">
                {event.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square w-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? "border-primary" : "border-border"
                    }`}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`${event.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Event Details */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-4">{event.title}</h1>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{event.rating}</span>
                  <span className="text-muted-foreground">({event.reviews} đánh giá)</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{event.duration}</span>
                </div>
              </div>

              <p className="text-lg text-muted-foreground mb-6">{event.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>
                    {event.min_guests}-{event.max_guests} khách
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>Từ {event.price_from.toLocaleString()}đ</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Dịch vụ đặc biệt</h3>
              <div className="grid grid-cols-2 gap-3">
                {event.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Includes */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Bao gồm trong gói</h3>
              <div className="space-y-2">
                {event.includes.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Spaces */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Không gian có sẵn</h3>
              <div className="flex flex-wrap gap-2">
                {event.spaces.map((space, index) => (
                  <Badge key={index} variant="outline" className="bg-primary/10">
                    <MapPin className="h-3 w-3 mr-1" />
                    {space}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-card/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Liên hệ tư vấn</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>{event.contact.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>{event.contact.email}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button size="lg" className="flex-1" onClick={() => navigate("reservations", { eventId: event.id })}>
                <Calendar className="h-5 w-5 mr-2" />
                Đặt sự kiện
              </Button>
              <Button size="lg" variant="outline" className="flex-1 bg-transparent">
                <Phone className="h-5 w-5 mr-2" />
                Gọi tư vấn
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
