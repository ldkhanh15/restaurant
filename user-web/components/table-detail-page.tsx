"use client"

import { useState } from "react"
import { useRouter } from "@/lib/router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Star, Users, MapPin, Wifi, Music, Calendar, Clock, Phone } from "lucide-react"

// Mock data - in real app this would come from props or API
const tableData = {
  id: "table-1",
  number: "T01",
  capacity: 2,
  location: "Tầng 1 - Khu vực cửa sổ",
  features: ["Wifi miễn phí", "Ổ cắm điện", "View sân vườn"],
  status: "available",
  price_per_hour: 50000,
  images: ["/elegant-restaurant-interior.png"],
  description:
    "Bàn 2 người ấm cúng bên cửa sổ với view sân vườn tuyệt đẹp. Không gian riêng tư, lý tưởng cho các buổi hẹn hò hoặc cuộc họp công việc quan trọng.",
  amenities: ["wifi", "power", "garden_view"],
  reviews: [
    {
      id: "r1",
      customer: "Nguyễn Thị Lan",
      rating: 5,
      comment: "Bàn rất đẹp, view tuyệt vời! Dịch vụ chu đáo, không gian yên tĩnh.",
      date: "2024-01-10",
    },
    {
      id: "r2",
      customer: "Trần Văn Nam",
      rating: 4,
      comment: "Không gian thoải mái, phù hợp hẹn hò. Giá cả hợp lý.",
      date: "2024-01-08",
    },
    {
      id: "r3",
      customer: "Lê Thị Hoa",
      rating: 5,
      comment: "Bàn đẹp, view sân vườn thật sự tuyệt vời. Sẽ quay lại lần sau.",
      date: "2024-01-05",
    },
  ],
  availability: [
    { time: "09:00", available: true },
    { time: "10:00", available: true },
    { time: "11:00", available: false },
    { time: "12:00", available: false },
    { time: "13:00", available: true },
    { time: "14:00", available: true },
    { time: "15:00", available: true },
    { time: "16:00", available: false },
    { time: "17:00", available: true },
    { time: "18:00", available: true },
    { time: "19:00", available: false },
    { time: "20:00", available: false },
  ],
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "available":
      return "bg-green-500/20 text-green-400 border-green-500/30"
    case "occupied":
      return "bg-red-500/20 text-red-400 border-red-500/30"
    case "reserved":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30"
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case "available":
      return "Có sẵn"
    case "occupied":
      return "Đang sử dụng"
    case "reserved":
      return "Đã đặt"
    default:
      return "Không xác định"
  }
}

const getAmenityIcon = (amenity: string) => {
  switch (amenity) {
    case "wifi":
    case "premium_wifi":
      return <Wifi className="w-5 h-5" />
    case "power":
      return <div className="w-5 h-5 text-center text-lg">⚡</div>
    case "garden_view":
      return <div className="w-5 h-5 text-center text-lg">🌿</div>
    case "music":
      return <Music className="w-5 h-5" />
    case "bar_access":
      return <div className="w-5 h-5 text-center text-lg">🍸</div>
    case "private_room":
      return <div className="w-5 h-5 text-center text-lg">🚪</div>
    case "karaoke":
      return <div className="w-5 h-5 text-center text-lg">🎤</div>
    case "minibar":
      return <div className="w-5 h-5 text-center text-lg">🍾</div>
    case "round_table":
      return <div className="w-5 h-5 text-center text-lg">⭕</div>
    case "stage_access":
      return <div className="w-5 h-5 text-center text-lg">🎭</div>
    case "sound_system":
      return <div className="w-5 h-5 text-center text-lg">🔊</div>
    default:
      return <div className="w-5 h-5 text-center text-lg">✨</div>
  }
}

export default function TableDetailPage() {
  const { navigate } = useRouter()
  const [selectedTime, setSelectedTime] = useState<string>("")

  const averageRating = tableData.reviews.reduce((sum, r) => sum + r.rating, 0) / tableData.reviews.length

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("tables")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tables
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Table {tableData.number}</h1>
            <p className="text-muted-foreground">{tableData.location}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="relative">
              <img
                src={tableData.images[0] || "/placeholder.svg"}
                alt={`Table ${tableData.number}`}
                className="w-full h-96 object-cover rounded-2xl"
              />
              <div className="absolute top-6 left-6 flex gap-3">
                <Badge className={getStatusColor(tableData.status)}>{getStatusText(tableData.status)}</Badge>
                <Badge variant="secondary" className="bg-background/80 text-foreground">
                  <Users className="w-4 h-4 mr-2" />
                  {tableData.capacity} guests
                </Badge>
              </div>
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Table</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-6">{tableData.description}</p>

                {/* Amenities */}
                <div>
                  <h4 className="font-semibold mb-4">Amenities & Features</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {tableData.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        {getAmenityIcon(tableData.amenities[index])}
                        <span className="font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  Customer Reviews
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <span className="font-bold">{averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({tableData.reviews.length} reviews)</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tableData.reviews.map((review) => (
                    <div key={review.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold">{review.customer}</span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? "text-yellow-500 fill-current" : "text-muted-foreground"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-2">{review.comment}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.date).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Reserve Table
                  <span className="text-2xl font-bold text-primary">
                    {tableData.price_per_hour.toLocaleString("vi-VN")}đ/hour
                  </span>
                </CardTitle>
                <CardDescription>Select your preferred time slot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Time Selection */}
                <div>
                  <h4 className="font-semibold mb-3">Available Times Today</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {tableData.availability.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        size="sm"
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className="text-sm"
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
                      <span>Table {tableData.number}</span>
                      <span>{tableData.capacity} guests</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Time</span>
                      <span>{selectedTime}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t border-border">
                      <span>Total</span>
                      <span>{tableData.price_per_hour.toLocaleString("vi-VN")}đ</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!selectedTime || tableData.status !== "available"}
                    onClick={() => navigate("reservations")}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {tableData.status === "available" ? "Reserve Now" : "Not Available"}
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent" size="lg">
                    <Phone className="w-4 h-4 mr-2" />
                    Contact Restaurant
                  </Button>
                </div>

                {/* Quick Info */}
                <div className="pt-4 border-t border-border space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Free cancellation up to 2 hours before</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{tableData.location}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
