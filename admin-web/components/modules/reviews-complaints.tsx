"use client"

import { useState } from "react"

interface Review {
  id: number
  customer_name: string
  customer_email: string
  rating: number
  title: string
  content: string
  type: "review" | "complaint"
  status: "pending" | "responded" | "resolved" | "closed"
  created_at: string
  response?: string
  responded_by?: string
  responded_at?: string
  order_id?: number
  images?: string[]
  compensation_voucher?: {
    code: string
    value: number
    type: "percentage" | "fixed_amount"
    description: string
    created_at: string
  }
  compensation_reason?: string
}

const mockReviews: Review[] = [
  {
    id: 1,
    customer_name: "Nguyễn Văn A",
    customer_email: "nguyenvana@email.com",
    rating: 5,
    title: "Món ăn rất ngon!",
    content: "Phở bò tái rất tươi ngon, nước dùng đậm đà. Nhân viên phục vụ nhiệt tình. Sẽ quay lại lần sau!",
    type: "review",
    status: "responded",
    created_at: "2024-03-20T19:30:00",
    response: "Cảm ơn anh đã đánh giá tích cực! Chúng tôi rất vui khi anh hài lòng với dịch vụ.",
    responded_by: "Quản lý Hùng",
    responded_at: "2024-03-20T20:15:00",
    order_id: 123,
  },
  {
    id: 2,
    customer_name: "Trần Thị B",
    customer_email: "tranthib@email.com",
    rating: 2,
    title: "Thời gian chờ quá lâu",
    content: "Đặt bàn lúc 7h nhưng phải chờ đến 8h30 mới có chỗ ngồi. Món ăn cũng ra chậm.",
    type: "complaint",
    status: "resolved",
    created_at: "2024-03-20T20:45:00",
    order_id: 124,
    response: "Chúng tôi xin lỗi vì sự bất tiện này. Đây là voucher giảm giá 20% cho lần ghé thăm tiếp theo.",
    responded_by: "Quản lý Lan",
    responded_at: "2024-03-20T21:30:00",
    compensation_voucher: {
      code: "SORRY20B",
      value: 20,
      type: "percentage",
      description: "Voucher bồi thường cho khiếu nại thời gian chờ",
      created_at: "2024-03-20T21:30:00",
    },
    compensation_reason: "Thời gian chờ quá lâu",
  },
  {
    id: 3,
    customer_name: "Lê Văn C",
    customer_email: "levanc@email.com",
    rating: 4,
    title: "Không gian đẹp",
    content: "Nhà hàng trang trí đẹp, không gian thoáng mát. Món ăn ngon nhưng giá hơi cao.",
    type: "review",
    status: "resolved",
    created_at: "2024-03-19T18:20:00",
    response: "Cảm ơn anh đã góp ý. Chúng tôi sẽ xem xét điều chỉnh giá cả phù hợp hơn.",
    responded_by: "Quản lý Lan",
    responded_at: "2024-03-19T19:00:00",
  },
]

export function ReviewsComplaints() {
  const [reviews, setReviews] = useState<Review[]>(mockReviews)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [responseText, setResponseText] = useState("")
  const [showCompensationDialog, setShowCompensationDialog] = useState(false)
  const [compensationData, setCompensationData] = useState({
    type: "percentage" as "percentage" | "fixed_amount",
    value: 0,
    reason: "",
  })

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || review.type === typeFilter
    const matchesStatus = statusFilter === "all" || review.status === statusFilter
    const matchesRating = ratingFilter === "all" || review.rating.toString() === ratingFilter
    return matchesSearch && matchesType && matchesStatus && matchesRating
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "responded":
        return "bg-blue-100 text-blue-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? "text-yellow-400" : "text-gray-300"}>
        ★
      </span>
    ))
  }

  const handleRespond = (reviewId: number) => {
    if (!responseText.trim()) return

    setReviews(
      reviews.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              status: "responded" as const,
              response: responseText,
              responded_by: "Quản lý",
              responded_at: new Date().toISOString(),
            }
          : review,
      ),
    )
    setResponseText("")
    setSelectedReview(null)
  }

  const handleCompensation = (reviewId: number) => {
    if (!compensationData.reason.trim() || compensationData.value <= 0) return

    const voucherCode = `COMP${Date.now().toString().slice(-6)}`
    const compensation = {
      code: voucherCode,
      value: compensationData.value,
      type: compensationData.type,
      description: `Voucher bồi thường: ${compensationData.reason}`,
      created_at: new Date().toISOString(),
    }

    setReviews(
      reviews.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              status: "resolved" as const,
              compensation_voucher: compensation,
              compensation_reason: compensationData.reason,
              response:
                responseText ||
                `Chúng tôi xin lỗi vì sự bất tiện. Đây là voucher ${compensationData.type === "percentage" ? compensationData.value + "%" : compensationData.value.toLocaleString() + "đ"} bồi thường.`,
              responded_by: "Quản lý",
              responded_at: new Date().toISOString(),
            }
          : review,
      ),
    )

    setShowCompensationDialog(false)
    setSelectedReview(null)
    setResponseText("")
    setCompensationData({ type: "percentage", value: 0, reason: "" })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Đánh giá & Khiếu nại</h1>
        <div className="flex gap-2">
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Đánh giá TB: 4.2/5</span>
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
            {reviews.filter((r) => r.status === "pending").length} chờ xử lý
          </span>
          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
            {reviews.filter((r) => r.compensation_voucher).length} đã bồi thường
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên khách hàng, tiêu đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">Tất cả loại</option>
            <option value="review">Đánh giá</option>
            <option value="complaint">Khiếu nại</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="responded">Đã phản hồi</option>
            <option value="resolved">Đã giải quyết</option>
            <option value="closed">Đã đóng</option>
          </select>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">Tất cả sao</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>
        </div>

        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">{getRatingStars(review.rating)}</div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      review.type === "review" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {review.type === "review" ? "Đánh giá" : "Khiếu nại"}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                    {review.status === "pending" && "Chờ xử lý"}
                    {review.status === "responded" && "Đã phản hồi"}
                    {review.status === "resolved" && "Đã giải quyết"}
                    {review.status === "closed" && "Đã đóng"}
                  </span>
                  {review.compensation_voucher && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Đã bồi thường
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-500">{new Date(review.created_at).toLocaleString("vi-VN")}</span>
              </div>

              <div className="mb-3">
                <h3 className="font-semibold text-gray-900 mb-1">{review.title}</h3>
                <p className="text-gray-600 mb-2">{review.content}</p>
                <div className="text-sm text-gray-500">
                  <span>Khách hàng: {review.customer_name}</span>
                  {review.order_id && <span className="ml-4">Đơn hàng: #{review.order_id}</span>}
                </div>
              </div>

              {review.response && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Phản hồi từ {review.responded_by}</span>
                    <span className="text-xs text-gray-500">
                      {review.responded_at && new Date(review.responded_at).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <p className="text-gray-600">{review.response}</p>
                </div>
              )}

              {review.compensation_voucher && (
                <div className="bg-purple-50 rounded-lg p-3 mb-3 border border-purple-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-purple-700">Voucher bồi thường</span>
                    <span className="text-xs text-purple-600">
                      {new Date(review.compensation_voucher.created_at).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg font-mono font-bold text-sm">
                      {review.compensation_voucher.code}
                    </div>
                    <div className="text-purple-700 font-semibold">
                      {review.compensation_voucher.type === "percentage"
                        ? `${review.compensation_voucher.value}%`
                        : `${review.compensation_voucher.value.toLocaleString()}đ`}
                    </div>
                  </div>
                  <p className="text-sm text-purple-600 mt-1">{review.compensation_voucher.description}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {review.status === "pending" && (
                  <>
                    <button
                      onClick={() => setSelectedReview(review)}
                      className="bg-emerald-600 text-white px-3 py-1 rounded text-sm hover:bg-emerald-700 transition-colors"
                    >
                      Phản hồi
                    </button>
                    {review.type === "complaint" && (
                      <button
                        onClick={() => {
                          setSelectedReview(review)
                          setShowCompensationDialog(true)
                        }}
                        className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                      >
                        Bồi thường
                      </button>
                    )}
                  </>
                )}
                {review.status === "responded" && (
                  <button
                    onClick={() =>
                      setReviews(reviews.map((r) => (r.id === review.id ? { ...r, status: "resolved" as const } : r)))
                    }
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    Đánh dấu đã giải quyết
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Response Modal */}
      {selectedReview && !showCompensationDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Phản hồi đánh giá</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Khách hàng: {selectedReview.customer_name}</p>
              <p className="text-sm font-medium">{selectedReview.title}</p>
            </div>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Nhập phản hồi của bạn..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 h-24 resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleRespond(selectedReview.id)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Gửi phản hồi
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedReview && showCompensationDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Tạo voucher bồi thường</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Khách hàng: {selectedReview.customer_name}</p>
              <p className="text-sm font-medium">{selectedReview.title}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại voucher</label>
                <select
                  value={compensationData.type}
                  onChange={(e) => setCompensationData({ ...compensationData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="percentage">Phần trăm (%)</option>
                  <option value="fixed_amount">Số tiền cố định (VNĐ)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá trị {compensationData.type === "percentage" ? "(%)" : "(VNĐ)"}
                </label>
                <input
                  type="number"
                  value={compensationData.value}
                  onChange={(e) => setCompensationData({ ...compensationData, value: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  min="1"
                  max={compensationData.type === "percentage" ? 100 : 1000000}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do bồi thường</label>
                <textarea
                  value={compensationData.reason}
                  onChange={(e) => setCompensationData({ ...compensationData, reason: e.target.value })}
                  placeholder="Nhập lý do bồi thường..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tin nhắn phản hồi (tùy chọn)</label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Tin nhắn kèm theo voucher..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 h-16 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCompensationDialog(false)
                  setSelectedReview(null)
                  setCompensationData({ type: "percentage", value: 0, reason: "" })
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleCompensation(selectedReview.id)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                disabled={!compensationData.reason.trim() || compensationData.value <= 0}
              >
                Tạo voucher bồi thường
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
