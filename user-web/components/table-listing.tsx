"use client"

import { useState } from "react"
import { useRouter } from "@/lib/router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Users, MapPin, Wifi, Music, Eye, Calendar } from "lucide-react"

const tables = [
  {
    id: "table-1",
    number: "T01",
    capacity: 2,
    location: "Tầng 1 - Khu vực cửa sổ",
    features: ["Wifi miễn phí", "Ổ cắm điện", "View sân vườn"],
    status: "available",
    price_per_hour: 50000,
    images: ["/elegant-restaurant-interior.png"],
    description: "Bàn 2 người ấm cúng bên cửa sổ với view sân vườn tuyệt đẹp",
    amenities: ["wifi", "power", "garden_view"],
    reviews: [
      { id: "r1", customer: "Nguyễn Thị Lan", rating: 5, comment: "Bàn rất đẹp, view tuyệt vời!", date: "2024-01-10" },
      {
        id: "r2",
        customer: "Trần Văn Nam",
        rating: 4,
        comment: "Không gian thoải mái, phù hợp hẹn hò",
        date: "2024-01-08",
      },
    ],
  },
  {
    id: "table-2",
    number: "T05",
    capacity: 4,
    location: "Tầng 1 - Khu vực trung tâm",
    features: ["Wifi miễn phí", "Nhạc nền", "Gần bar"],
    status: "occupied",
    price_per_hour: 80000,
    images: ["/elegant-restaurant-interior.png"],
    description: "Bàn 4 người ở vị trí trung tâm, thuận tiện di chuyển",
    amenities: ["wifi", "music", "bar_access"],
    reviews: [
      { id: "r3", customer: "Lê Thị Hoa", rating: 5, comment: "Vị trí tuyệt vời, dịch vụ tốt", date: "2024-01-12" },
      {
        id: "r4",
        customer: "Phạm Minh Tuấn",
        rating: 4,
        comment: "Bàn rộng rãi, phù hợp gia đình",
        date: "2024-01-09",
      },
    ],
  },
  {
    id: "table-3",
    number: "T12",
    capacity: 6,
    location: "Tầng 2 - Phòng VIP",
    features: ["Phòng riêng", "Karaoke", "Minibar", "Wifi cao cấp"],
    status: "available",
    price_per_hour: 150000,
    images: ["/elegant-restaurant-interior.png"],
    description: "Phòng VIP 6 người với đầy đủ tiện nghi cao cấp",
    amenities: ["private_room", "karaoke", "minibar", "premium_wifi"],
    reviews: [
      {
        id: "r5",
        customer: "Nguyễn Văn Đức",
        rating: 5,
        comment: "Phòng VIP tuyệt vời, đáng giá tiền!",
        date: "2024-01-11",
      },
      {
        id: "r6",
        customer: "Trần Thị Mai",
        rating: 5,
        comment: "Không gian sang trọng, dịch vụ hoàn hảo",
        date: "2024-01-07",
      },
    ],
  },
  {
    id: "table-4",
    number: "T08",
    capacity: 8,
    location: "Tầng 1 - Khu vực sự kiện",
    features: ["Bàn tròn lớn", "Gần sân khấu", "Âm thanh tốt"],
    status: "reserved",
    price_per_hour: 120000,
    images: ["/elegant-restaurant-interior.png"],
    description: "Bàn tròn 8 người lý tưởng cho các buổi tiệc và sự kiện",
    amenities: ["round_table", "stage_access", "sound_system"],
    reviews: [
      { id: "r7", customer: "Lê Văn Hùng", rating: 4, comment: "Bàn tròn rất tiện cho nhóm đông", date: "2024-01-06" },
    ],
  },
]

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
      return <Wifi className="w-4 h-4" />
    case "power":
      return <div className="w-4 h-4 text-center">⚡</div>
    case "garden_view":
      return <div className="w-4 h-4 text-center">🌿</div>
    case "music":
      return <Music className="w-4 h-4" />
    case "bar_access":
      return <div className="w-4 h-4 text-center">🍸</div>
    case "private_room":
      return <div className="w-4 h-4 text-center">🚪</div>
    case "karaoke":
      return <div className="w-4 h-4 text-center">🎤</div>
    case "minibar":
      return <div className="w-4 h-4 text-center">🍾</div>
    case "round_table":
      return <div className="w-4 h-4 text-center">⭕</div>
    case "stage_access":
      return <div className="w-4 h-4 text-center">🎭</div>
    case "sound_system":
      return <div className="w-4 h-4 text-center">🔊</div>
    default:
      return <div className="w-4 h-4 text-center">✨</div>
  }
}

export default function TableListing() {
  const { navigate } = useRouter()
  const [selectedCapacity, setSelectedCapacity] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  const filteredTables = tables.filter((table) => {
    const matchesCapacity =
      selectedCapacity === "all" ||
      (selectedCapacity === "2" && table.capacity <= 2) ||
      (selectedCapacity === "4" && table.capacity <= 4 && table.capacity > 2) ||
      (selectedCapacity === "6+" && table.capacity >= 6)

    const matchesStatus = selectedStatus === "all" || table.status === selectedStatus

    return matchesCapacity && matchesStatus
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Danh Sách Bàn</h1>
          <p className="text-muted-foreground text-lg">
            Khám phá các bàn ăn với không gian và tiện nghi phù hợp với nhu cầu của bạn
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          <div className="flex gap-2">
            <span className="text-sm font-medium self-center">Sức chứa:</span>
            {["all", "2", "4", "6+"].map((capacity) => (
              <Button
                key={capacity}
                variant={selectedCapacity === capacity ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCapacity(capacity)}
              >
                {capacity === "all" ? "Tất cả" : capacity === "6+" ? "6+ người" : `${capacity} người`}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <span className="text-sm font-medium self-center">Trạng thái:</span>
            {["all", "available", "occupied", "reserved"].map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(status)}
              >
                {status === "all" ? "Tất cả" : getStatusText(status)}
              </Button>
            ))}
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTables.map((table) => (
            <Card key={table.id} className="group hover:shadow-xl transition-all duration-300 border-border bg-card">
              <div className="relative overflow-hidden rounded-t-lg">
                <img
                  src={table.images[0] || "/placeholder.svg"}
                  alt={`Bàn ${table.number}`}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className={getStatusColor(table.status)}>{getStatusText(table.status)}</Badge>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    <Users className="w-3 h-3 mr-1" />
                    {table.capacity} người
                  </Badge>
                </div>
              </div>

              <CardHeader>
                <CardTitle className="text-xl flex items-center justify-between">
                  Bàn {table.number}
                  <span className="text-lg font-bold text-primary">
                    {table.price_per_hour.toLocaleString("vi-VN")}đ/giờ
                  </span>
                </CardTitle>
                <CardDescription className="flex items-center text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2" />
                  {table.location}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <p className="text-muted-foreground mb-4">{table.description}</p>

                {/* Amenities */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {table.amenities.slice(0, 3).map((amenity, index) => (
                    <div key={index} className="flex items-center space-x-1 text-xs bg-muted/50 rounded-full px-2 py-1">
                      {getAmenityIcon(amenity)}
                      <span>{table.features[index]}</span>
                    </div>
                  ))}
                  {table.amenities.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{table.amenities.length - 3} khác</span>
                  )}
                </div>

                {/* Reviews Summary */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">
                      {(table.reviews.reduce((sum, r) => sum + r.rating, 0) / table.reviews.length).toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">({table.reviews.length} đánh giá)</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => navigate("table-detail")}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Chi Tiết
                  </Button>

                  <Button size="sm" className="flex-1" disabled={table.status !== "available"}>
                    <Calendar className="w-4 h-4 mr-2" />
                    {table.status === "available" ? "Đặt Bàn" : "Không Khả Dụng"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No results */}
        {filteredTables.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Không tìm thấy bàn nào phù hợp với tiêu chí lọc</p>
          </div>
        )}
      </div>
    </div>
  )
}
