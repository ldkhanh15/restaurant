"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Star,
  User,
  Gift,
  MessageSquare,
  AlertTriangle,
  Edit,
  Save,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react"

// Mock data
const currentUser = {
  id: "user-1",
  username: "khachhang01",
  email: "an.nguyen@email.com",
  phone: "0901234567",
  full_name: "Nguyễn Văn An",
  ranking: "VIP",
  points: 1250,
  preferences: {
    dietary_restrictions: ["no_pork"],
    favorite_cuisine: "vietnamese",
    seating_preference: "near_window",
  },
  avatar_url: "/placeholder.svg?key=avatar1",
  joined_date: "2023-01-15",
  total_orders: 45,
  total_spent: 12500000,
}

const userBehaviorLogs = [
  {
    id: "log-1",
    action: "viewed_menu",
    description: "Xem thực đơn",
    timestamp: "2024-01-20 14:30:00",
    details: { category: "main_course" },
  },
  {
    id: "log-2",
    action: "placed_order",
    description: "Đặt hàng",
    timestamp: "2024-01-20 14:45:00",
    details: { order_id: "ORD-123", total: 450000 },
  },
  {
    id: "log-3",
    action: "made_reservation",
    description: "Đặt bàn",
    timestamp: "2024-01-19 10:15:00",
    details: { table: "T5", date: "2024-01-25" },
  },
  {
    id: "log-4",
    action: "submitted_review",
    description: "Gửi đánh giá",
    timestamp: "2024-01-18 20:30:00",
    details: { rating: 5, dish: "Cá Hồi Nướng" },
  },
  {
    id: "log-5",
    action: "used_voucher",
    description: "Sử dụng voucher",
    timestamp: "2024-01-17 19:00:00",
    details: { voucher_code: "WELCOME10", discount: 35000 },
  },
]

const userReviews = [
  {
    id: "review-1",
    order_id: "ORD-123",
    dish_name: "Cá Hồi Nướng",
    rating: 5,
    comment: "Món ăn rất ngon! Cá hồi tươi và được nướng vừa tới. Sẽ quay lại lần sau.",
    created_at: "2024-01-18 20:30:00",
    status: "published",
  },
  {
    id: "review-2",
    order_id: "ORD-124",
    dish_name: "Bò Beefsteak",
    rating: 4,
    comment: "Thịt bò chất lượng tốt, tuy nhiên hơi mặn một chút. Nhìn chung vẫn hài lòng.",
    created_at: "2024-01-15 19:15:00",
    status: "published",
  },
  {
    id: "review-3",
    order_id: "ORD-125",
    dish_name: "Bánh Chocolate",
    rating: 5,
    comment: "Bánh chocolate tuyệt vời! Vị đậm đà và không quá ngọt. Rất đáng thử!",
    created_at: "2024-01-10 21:00:00",
    status: "published",
  },
]

const userComplaints = [
  {
    id: "complaint-1",
    order_id: "ORD-120",
    description: "Món ăn được giao muộn 30 phút so với thời gian dự kiến",
    status: "resolved",
    created_at: "2024-01-12 19:30:00",
    resolved_at: "2024-01-13 09:00:00",
    resolution_notes: "Chúng tôi xin lỗi vì sự chậm trễ. Đã cải thiện quy trình giao hàng.",
    compensation_voucher: {
      code: "SORRY20",
      discount_type: "fixed",
      discount_value: 50000,
      description: "Voucher bồi thường - Giảm 50,000đ",
    },
  },
  {
    id: "complaint-2",
    order_id: "ORD-118",
    description: "Món salad không tươi, rau héo",
    status: "resolved",
    created_at: "2024-01-08 20:15:00",
    resolved_at: "2024-01-09 10:30:00",
    resolution_notes: "Đã kiểm tra và thay đổi nhà cung cấp rau củ. Cảm ơn phản hồi.",
    compensation_voucher: {
      code: "FRESH15",
      discount_type: "percentage",
      discount_value: 15,
      description: "Voucher bồi thường - Giảm 15%",
    },
  },
  {
    id: "complaint-3",
    order_id: "ORD-126",
    description: "Nhân viên phục vụ không thân thiện",
    status: "pending",
    created_at: "2024-01-22 18:45:00",
    resolved_at: null,
    resolution_notes: null,
    compensation_voucher: null,
  },
]

const availableVouchers = [
  {
    id: "voucher-1",
    code: "WELCOME10",
    description: "Giảm 10% cho đơn hàng đầu tiên",
    discount_type: "percentage",
    discount_value: 10,
    status: "active",
    expires_at: "2024-12-31",
  },
  {
    id: "voucher-2",
    code: "SORRY20",
    description: "Voucher bồi thường - Giảm 50,000đ",
    discount_type: "fixed",
    discount_value: 50000,
    status: "active",
    expires_at: "2024-06-30",
  },
  {
    id: "voucher-3",
    code: "FRESH15",
    description: "Voucher bồi thường - Giảm 15%",
    discount_type: "percentage",
    discount_value: 15,
    status: "used",
    expires_at: "2024-05-31",
  },
]

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState("profile")
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState(currentUser)
  const [newReview, setNewReview] = useState({
    dish_name: "",
    rating: 5,
    comment: "",
  })
  const [newComplaint, setNewComplaint] = useState({
    order_id: "",
    description: "",
  })
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showComplaintDialog, setShowComplaintDialog] = useState(false)

  const handleSaveProfile = () => {
    // Simulate API call
    console.log("Saving profile:", editedProfile)
    setIsEditing(false)
  }

  const handleSubmitReview = () => {
    if (!newReview.dish_name || !newReview.comment) {
      alert("Vui lòng điền đầy đủ thông tin")
      return
    }

    // Simulate API call
    console.log("Submitting review:", newReview)
    setNewReview({ dish_name: "", rating: 5, comment: "" })
    setShowReviewDialog(false)
    alert("Đánh giá đã được gửi thành công!")
  }

  const handleSubmitComplaint = () => {
    if (!newComplaint.description) {
      alert("Vui lòng mô tả vấn đề")
      return
    }

    // Simulate API call
    console.log("Submitting complaint:", newComplaint)
    setNewComplaint({ order_id: "", description: "" })
    setShowComplaintDialog(false)
    alert("Khiếu nại đã được gửi thành công!")
  }

  const getRankingColor = (ranking: string) => {
    switch (ranking) {
      case "VIP":
        return "bg-yellow-500/20 text-yellow-400"
      case "Gold":
        return "bg-yellow-600/20 text-yellow-600"
      case "Silver":
        return "bg-gray-500/20 text-gray-400"
      default:
        return "bg-blue-500/20 text-blue-400"
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
    ))
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Hồ Sơ Cá Nhân</h1>
          <p className="text-muted-foreground">Quản lý thông tin cá nhân và xem lịch sử hoạt động</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Hồ Sơ</TabsTrigger>
            <TabsTrigger value="activity">Hoạt Động</TabsTrigger>
            <TabsTrigger value="reviews">Đánh Giá</TabsTrigger>
            <TabsTrigger value="complaints">Khiếu Nại</TabsTrigger>
            <TabsTrigger value="vouchers">Voucher</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Thông Tin Cá Nhân</CardTitle>
                    <CardDescription>Cập nhật thông tin tài khoản của bạn</CardDescription>
                  </div>
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}
                  >
                    {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                    {isEditing ? "Lưu" : "Chỉnh sửa"}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={currentUser.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>
                        <User className="w-8 h-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">{currentUser.full_name}</h3>
                      <Badge className={getRankingColor(currentUser.ranking)}>
                        <Trophy className="w-3 h-3 mr-1" />
                        {currentUser.ranking}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Họ và tên</Label>
                      <Input
                        id="fullName"
                        value={editedProfile.full_name}
                        onChange={(e) => setEditedProfile((prev) => ({ ...prev, full_name: e.target.value }))}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Tên đăng nhập</Label>
                      <Input id="username" value={editedProfile.username} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedProfile.email}
                        onChange={(e) => setEditedProfile((prev) => ({ ...prev, email: e.target.value }))}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input
                        id="phone"
                        value={editedProfile.phone}
                        onChange={(e) => setEditedProfile((prev) => ({ ...prev, phone: e.target.value }))}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold">Sở Thích Cá Nhân</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Hạn chế ăn uống</Label>
                        <Select
                          value={editedProfile.preferences.dietary_restrictions[0] || ""}
                          onValueChange={(value) =>
                            setEditedProfile((prev) => ({
                              ...prev,
                              preferences: { ...prev.preferences, dietary_restrictions: [value] },
                            }))
                          }
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn hạn chế" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Không có</SelectItem>
                            <SelectItem value="no_pork">Không ăn thịt heo</SelectItem>
                            <SelectItem value="vegetarian">Ăn chay</SelectItem>
                            <SelectItem value="no_seafood">Không ăn hải sản</SelectItem>
                            <SelectItem value="no_spicy">Không ăn cay</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Vị trí ngồi ưa thích</Label>
                        <Select
                          value={editedProfile.preferences.seating_preference}
                          onValueChange={(value) =>
                            setEditedProfile((prev) => ({
                              ...prev,
                              preferences: { ...prev.preferences, seating_preference: value },
                            }))
                          }
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="near_window">Gần cửa sổ</SelectItem>
                            <SelectItem value="quiet_area">Khu vực yên tĩnh</SelectItem>
                            <SelectItem value="center">Trung tâm</SelectItem>
                            <SelectItem value="private">Riêng tư</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Thống Kê</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Điểm tích lũy:</span>
                      <span className="font-semibold text-primary">{currentUser.points.toLocaleString()} điểm</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tổng đơn hàng:</span>
                      <span className="font-semibold">{currentUser.total_orders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tổng chi tiêu:</span>
                      <span className="font-semibold">{currentUser.total_spent.toLocaleString("vi-VN")}đ</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Thành viên từ:</span>
                      <span className="font-semibold">01/2023</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Hạng Thành Viên</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-2">
                      <Badge className={`${getRankingColor(currentUser.ranking)} text-lg px-4 py-2`}>
                        <Trophy className="w-4 h-4 mr-2" />
                        {currentUser.ranking}
                      </Badge>
                      <p className="text-sm text-muted-foreground">Bạn đang ở hạng VIP với {currentUser.points} điểm</p>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: "75%" }} />
                      </div>
                      <p className="text-xs text-muted-foreground">Cần thêm 250 điểm để duy trì hạng VIP</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Lịch Sử Hoạt Động</CardTitle>
                <CardDescription>Theo dõi các hoạt động gần đây của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userBehaviorLogs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-4 p-4 border border-border rounded-lg">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{log.description}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString("vi-VN")}
                            </p>
                          </div>
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        </div>
                        {log.details && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            {Object.entries(log.details).map(([key, value]) => (
                              <span key={key} className="mr-4">
                                {key}: {String(value)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Đánh Giá Của Tôi</h2>
                <p className="text-muted-foreground">Chia sẻ trải nghiệm của bạn về các món ăn</p>
              </div>
              <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Gửi Đánh Giá
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Gửi Đánh Giá Mới</DialogTitle>
                    <DialogDescription>Chia sẻ trải nghiệm của bạn về món ăn</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dishName">Tên món ăn</Label>
                      <Input
                        id="dishName"
                        placeholder="Ví dụ: Cá Hồi Nướng"
                        value={newReview.dish_name}
                        onChange={(e) => setNewReview((prev) => ({ ...prev, dish_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Đánh giá</Label>
                      <div className="flex space-x-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-6 h-6 cursor-pointer ${
                              i < newReview.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                            }`}
                            onClick={() => setNewReview((prev) => ({ ...prev, rating: i + 1 }))}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="comment">Nhận xét</Label>
                      <Textarea
                        id="comment"
                        placeholder="Chia sẻ trải nghiệm của bạn..."
                        value={newReview.comment}
                        onChange={(e) => setNewReview((prev) => ({ ...prev, comment: e.target.value }))}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                        Hủy
                      </Button>
                      <Button onClick={handleSubmitReview}>Gửi Đánh Giá</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {userReviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{review.dish_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Đơn hàng: {review.order_id} • {new Date(review.created_at).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">{renderStars(review.rating)}</div>
                    </div>
                    <p className="text-muted-foreground mb-4">{review.comment}</p>
                    <Badge variant={review.status === "published" ? "default" : "secondary"}>
                      {review.status === "published" ? "Đã đăng" : "Chờ duyệt"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Complaints Tab */}
          <TabsContent value="complaints" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Khiếu Nại</h2>
                <p className="text-muted-foreground">Gửi phản hồi về các vấn đề bạn gặp phải</p>
              </div>
              <Dialog open={showComplaintDialog} onOpenChange={setShowComplaintDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Gửi Khiếu Nại
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Gửi Khiếu Nại Mới</DialogTitle>
                    <DialogDescription>Mô tả vấn đề bạn gặp phải để chúng tôi hỗ trợ tốt nhất</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="orderId">Mã đơn hàng (tùy chọn)</Label>
                      <Input
                        id="orderId"
                        placeholder="Ví dụ: ORD-123"
                        value={newComplaint.order_id}
                        onChange={(e) => setNewComplaint((prev) => ({ ...prev, order_id: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Mô tả vấn đề</Label>
                      <Textarea
                        id="description"
                        placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                        value={newComplaint.description}
                        onChange={(e) => setNewComplaint((prev) => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowComplaintDialog(false)}>
                        Hủy
                      </Button>
                      <Button onClick={handleSubmitComplaint}>Gửi Khiếu Nại</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {userComplaints.map((complaint) => (
                <Card key={complaint.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">Khiếu nại #{complaint.id.split("-")[1]}</h3>
                          <Badge
                            variant={
                              complaint.status === "resolved"
                                ? "default"
                                : complaint.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {complaint.status === "resolved" ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Đã giải quyết
                              </>
                            ) : complaint.status === "pending" ? (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                Đang xử lý
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Từ chối
                              </>
                            )}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {complaint.order_id && `Đơn hàng: ${complaint.order_id} • `}
                          {new Date(complaint.created_at).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-4">{complaint.description}</p>

                    {complaint.status === "resolved" && complaint.resolution_notes && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-green-600 mb-2">Phản hồi từ nhà hàng:</h4>
                        <p className="text-sm">{complaint.resolution_notes}</p>
                        {complaint.resolved_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Giải quyết vào: {new Date(complaint.resolved_at).toLocaleDateString("vi-VN")}
                          </p>
                        )}
                      </div>
                    )}

                    {complaint.compensation_voucher && (
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                        <h4 className="font-semibold text-primary mb-2">Voucher bồi thường:</h4>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{complaint.compensation_voucher.code}</p>
                            <p className="text-sm text-muted-foreground">
                              {complaint.compensation_voucher.description}
                            </p>
                          </div>
                          <Badge variant="outline">
                            <Gift className="w-3 h-3 mr-1" />
                            Voucher
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Vouchers Tab */}
          <TabsContent value="vouchers">
            <Card>
              <CardHeader>
                <CardTitle>Voucher Của Tôi</CardTitle>
                <CardDescription>Quản lý và sử dụng các voucher có sẵn</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {availableVouchers.map((voucher) => (
                    <Card key={voucher.id} className={`${voucher.status === "used" ? "opacity-50" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{voucher.code}</h3>
                            <p className="text-sm text-muted-foreground">{voucher.description}</p>
                          </div>
                          <Badge
                            variant={
                              voucher.status === "active"
                                ? "default"
                                : voucher.status === "used"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {voucher.status === "active"
                              ? "Có thể dùng"
                              : voucher.status === "used"
                                ? "Đã sử dụng"
                                : "Hết hạn"}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Giá trị:</span>
                            <span className="font-medium">
                              {voucher.discount_type === "percentage"
                                ? `${voucher.discount_value}%`
                                : `${voucher.discount_value.toLocaleString("vi-VN")}đ`}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Hết hạn:</span>
                            <span>{new Date(voucher.expires_at).toLocaleDateString("vi-VN")}</span>
                          </div>
                        </div>

                        {voucher.status === "active" && (
                          <Button className="w-full mt-4" size="sm">
                            Sử dụng ngay
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
