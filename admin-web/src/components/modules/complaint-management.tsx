"use client";

import { useEffect, useState } from "react";
import { Complaint } from "../../type/Complaint";
import complaintApi from "../../services/complaintService";
import { toast } from "sonner";
export function ComplaintManagement() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [responseText, setResponseText] = useState("");
  const [compensationData, setCompensationData] = useState({
    type: "percentage" as "percentage" | "fixed_amount",
    value: 0,
    reason: "",
  });

  useEffect(() => {
    fetchComplaint();
  }, []);

  //CRUD
  const fetchComplaint = async () => {
    try {
      const response = await complaintApi.getAllComplaints();
      console.log("Fetched complaints:", response.data.data);
      setComplaints(response.data.data);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    }
  };

  const handleUpdateComplaint = async (complaintId: string, dataform: any) => {
    try {
      const response = await complaintApi.updateComplaint(
        complaintId,
        dataform
      );
      toast.success("Cập nhật khiếu nại thành công");
      fetchComplaint();
      console.log("Updated complaint:", response.data);
    } catch (error) {
      console.error("Error updating complaint:", error);
    }
  };

  console.log("Current complaints state:", complaints);

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch =
      complaint.user?.username
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      complaint.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || complaint.status === statusFilter;
    return matchesSearch && matchesStatus;
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

  // const handleRespond = (complaintId: string) => {
  //   if (!responseText.trim()) return;

  //   setComplaints(
  //     complaints.map((complaint) =>
  //       complaint.id === complaintId
  //         ? {
  //             ...complaint,
  //             status: "responded" as const,
  //             response: responseText,
  //             responded_by: "Quản lý",
  //             responded_at: new Date().toISOString(),
  //           }
  //         : complaint
  //     )
  //   );
  //   setResponseText("");
  //   setSelectedComplaint(null);
  // };

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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between md:flex-row gap-4 mb-6">
          <div className="flex">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên khách hàng, tiêu đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-90 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="approved">Đã phê duyệt</option>
            <option value="rejected">Đã từ chối</option>
          </select>
        </div>

        <div className="space-y-4">
          {filteredComplaints.map((complaint) => (
            <div
              key={complaint.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              {/* Header: Avatar + Tên + Ngày tạo */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  {complaint.user?.face_image_url ? (
                    <img
                      src={complaint.user.face_image_url}
                      alt={complaint.user?.username ?? "Avatar"}
                      loading="lazy"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                      {getInitials(complaint.user?.username)}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-gray-700">
                    {complaint.user?.username ?? "Khách vãng lai"}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(complaint.created_at).toLocaleString("vi-VN")}
                </div>
              </div>

              {/* Nội dung khiếu nại */}
              <div className="mb-3">
                <p className="text-gray-700 mb-2">{complaint.description}</p>
                <div className="text-sm text-gray-500">
                  {complaint.order_id && (
                    <span>Đơn hàng: #{complaint.order_id.slice(0, 8)}</span>
                  )}
                  {complaint.order_item_id && (
                    <span className="ml-4">
                      Mã món: {complaint.order_item_id}
                    </span>
                  )}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const updatedData = {
                    resolution_notes: formData.get("resolution_notes"),
                    status: formData.get("status"),
                  };
                  console.log("Updating complaint:", complaint.id, updatedData);
                  handleUpdateComplaint(complaint.id, updatedData);
                }}
                className="flex flex-row md:flex-row gap-4 mb-4"
              >
                {/* Ghi chú */}
                <div className="flex-1 mr-8">
                  <label
                    htmlFor={`resolution_notes_${complaint.id}`}
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Ghi chú xử lý
                  </label>
                  <textarea
                    id={`resolution_notes_${complaint.id}`}
                    name="resolution_notes"
                    placeholder="Nhập ghi chú hoặc hướng giải quyết..."
                    rows={3}
                    className="w-200 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    defaultValue={complaint.resolution_notes ?? ""}
                  />
                </div>

                <div >
                  {/* Trạng thái */}
                  <div className="w-full mb-4">
                    <label
                      htmlFor={`status_${complaint.id}`}
                      className="block text-gray-700 font-medium mb-2"
                    >
                      Trạng thái
                    </label>
                    <select
                      id={`status_${complaint.id}`}
                      name="status"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      defaultValue={complaint.status}
                    >
                      <option value="pending">⏳ Chờ xử lý</option>
                      <option value="approved">💬 Đã phê duyệt</option>
                      <option value="rejected">🔒 Đã từ chối</option>
                    </select>
                  </div>

                  {/* Nút cập nhật */}
                  <div className="flex justify-end md:items-end">
                    <button
                      type="submit"
                      className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      Cập nhật
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
