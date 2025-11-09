"use client";

import { useEffect, useState } from "react";
import { Review } from "../../type/Review";
import { Complaint } from "../../type/Complaint";
import reviewApi from "../../services/reviewService";
import complaintApi from "../../services/complaintService";
import { toast } from "react-toastify";
export function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState("");
  const [showCompensationDialog, setShowCompensationDialog] = useState(false);
  const [compensationData, setCompensationData] = useState({
    type: "percentage" as "percentage" | "fixed_amount",
    value: 0,
    reason: "",
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  //CRUD
  const fetchReviews = async () => {
    try {
      const response = await reviewApi.getAllReviews();
      console.log("Fetched reviews 123:", response.data);
      setReviews(response.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const response = await reviewApi.deleteReview(reviewId);
      toast.success("Deleted review successfully");
      setReviews(reviews.filter((review) => review.id !== reviewId));
    } catch (error) {
      toast.error("Error deleting review");
    }
  };

  console.log("Current reviews state:", reviews);

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || review.type === typeFilter;
    const matchesRating =
      ratingFilter === "all" || review.rating.toString() === ratingFilter;
    return matchesSearch && matchesType && matchesRating;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "responded":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={i < rating ? "text-yellow-400" : "text-gray-300"}
      >
        ★
      </span>
    ));
  };

  const handleRespond = (reviewId: string) => {
    if (!responseText.trim()) return;

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
          : review
      )
    );
    setResponseText("");
    setSelectedReview(null);
  };

  // helper (bên trên component)
  const getInitials = (name?: string) => {
    if (!name) return "KV"; // Khách Vãng lai
    return name
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleCompensation = (reviewId: string) => {
    if (!compensationData.reason.trim() || compensationData.value <= 0) return;

    const voucherCode = `COMP${Date.now().toString().slice(-6)}`;
    const compensation = {
      code: voucherCode,
      value: compensationData.value,
      type: compensationData.type,
      description: `Voucher bồi thường: ${compensationData.reason}`,
      created_at: new Date().toISOString(),
    };

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
                `Chúng tôi xin lỗi vì sự bất tiện. Đây là voucher ${
                  compensationData.type === "percentage"
                    ? compensationData.value + "%"
                    : compensationData.value.toLocaleString() + "đ"
                } bồi thường.`,
              responded_by: "Quản lý",
              responded_at: new Date().toISOString(),
            }
          : review
      )
    );

    setShowCompensationDialog(false);
    setSelectedReview(null);
    setResponseText("");
    setCompensationData({ type: "percentage", value: 0, reason: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-end gap-2">
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            Đánh giá TB:{" "}
            {reviews.reduce((acc, review) => acc + review.rating, 0) /
              reviews.length}
            /5
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
              className="w-90 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
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
            <div
              key={review.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                {/* Bên trái: avatar + tên */}
                <div className="flex items-center gap-3">
                  {review.user?.face_image_url ? (
                    <img
                      src={review.user.face_image_url}
                      alt={review.user?.username ?? "Avatar"}
                      loading="lazy"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                      {getInitials(review.user?.username)}
                    </div>
                  )}

                  {/* Tên người dùng */}
                  <span className="text-sm font-semibold text-gray-700">
                    {review.user?.username ?? "Khách vãng lai"}
                  </span>
                </div>

                {/* Bên phải: ngày tạo */}
                <div className="text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleString("vi-VN")}
                </div>
              </div>

              <span className="flex items-center gap-1">
                {getRatingStars(review.rating)}
              </span>

              <div className="mb-3">
                <p className="text-gray-600 mb-2">{review.comment}</p>
                <div className="text-sm text-gray-500">
                  <span>
                    {review.dish?.name
                      ? "Món ăn: " + review.dish?.name
                      : "Bàn: " + review.table?.table_number}
                  </span>
                  {review.order_id && (
                    <span className="ml-4">
                      Đơn hàng: #{review.order_id.slice(0, 8)}
                    </span>
                  )}
                </div>
              </div>

              {review.comment && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-gray-800 text-sm">{review.comment}</p>
                </div>
              )}

              <div className="flex justify-end md:items-end">
                <button
                  type="button"
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to delete this review?"
                      )
                    ) {
                      handleDeleteReview(review.id);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
