"use client";

import { useEffect, useState } from "react";
import { Complaint } from "../../type/Complaint";
import { Voucher } from "../../services/voucherService";
import complaintApi from "../../services/complaintService";
import { voucherService } from "../../services/voucherService";
import emailService from "../../services/emailService";
import compensationService from "../../services/compensationService";
import { toast } from "react-toastify";

// Component con cho Basic Resolution Tab
const BasicResolutionTab = ({
  complaint,
  onUpdate,
  isLoading,
}: {
  complaint: Complaint;
  onUpdate: (complaintId: string, data: any) => void;
  isLoading: boolean;
}) => {
  const [resolutionNotes, setResolutionNotes] = useState(complaint.resolution_notes || "");
  const [status, setStatus] = useState(complaint.status);

  const handleBasicResolve = () => {
    if (!resolutionNotes.trim()) {
      toast.error("Vui lòng nhập ghi chú xử lý");
      return;
    }

    onUpdate(complaint.id, {
      status,
      resolution_notes: resolutionNotes,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ghi chú xử lý *
        </label>
        <textarea
          value={resolutionNotes}
          onChange={(e) => setResolutionNotes(e.target.value)}
          placeholder="Nhập ghi chú hoặc hướng giải quyết..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chọn trạng thái *
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "pending" | "approved" | "rejected")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="pending">⏳ Chờ xử lý</option>
          <option value="approved">✅ Chấp nhận khiếu nại</option>
          <option value="rejected">❌ Từ chối khiếu nại</option>
        </select>
      </div>

      <button
        onClick={handleBasicResolve}
        disabled={isLoading || !resolutionNotes.trim()}
        className="w-full bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Đang cập nhật..." : "Cập nhật khiếu nại"}
      </button>
    </div>
  );
};

// Component con cho Voucher Compensation Tab
const VoucherCompensationTab = ({
  complaint,
  vouchers,
  onVoucherCompensation,
  isLoading,
}: {
  complaint: Complaint;
  vouchers: Voucher[];
  onVoucherCompensation: (complaintId: string, voucherId: string, reason: string) => void;
  isLoading: boolean;
}) => {
  const [selectedVoucherId, setSelectedVoucherId] = useState("");
  const [reason, setReason] = useState("");

  const selectedVoucher = vouchers.find((v) => v.id === selectedVoucherId);

  const handleVoucherCompensation = () => {
    if (!selectedVoucherId) {
      toast.error("Vui lòng chọn voucher");
      return;
    }
    
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do tặng voucher");
      return;
    }

    onVoucherCompensation(complaint.id, selectedVoucherId, reason);
  };

  const formatVoucherValue = (voucher: Voucher) => {
    if (voucher.discount_type === "percentage") {
      return `${voucher.value}%`;
    }
    return `${Number(voucher.value).toLocaleString()}₫`;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chọn voucher bồi thường *
        </label>
        <select
          value={selectedVoucherId}
          onChange={(e) => setSelectedVoucherId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">-- Chọn voucher --</option>
          {vouchers
            .filter((voucher) => voucher.active)
            .map((voucher) => (
              <option key={voucher.id} value={voucher.id}>
                {voucher.code} - Giảm {formatVoucherValue(voucher)}
                {voucher.min_order_value && ` (Đơn tối thiểu: ${Number(voucher.min_order_value).toLocaleString()}₫)`}
              </option>
            ))}
        </select>
      </div>

      {selectedVoucher && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <h4 className="font-medium text-emerald-800 mb-2">📋 Chi tiết voucher được chọn:</h4>
          <div className="text-sm text-emerald-700 space-y-1">
            <p><span className="font-medium">Mã:</span> {selectedVoucher.code}</p>
            <p><span className="font-medium">Giảm giá:</span> {formatVoucherValue(selectedVoucher)}</p>
            {selectedVoucher.min_order_value && (
              <p><span className="font-medium">Đơn tối thiểu:</span> {Number(selectedVoucher.min_order_value).toLocaleString()}₫</p>
            )}
            <p><span className="font-medium">Sử dụng:</span> {selectedVoucher.current_uses}/{selectedVoucher.max_uses}</p>
            {selectedVoucher.expiry_date && (
              <p><span className="font-medium">Hết hạn:</span> {new Date(selectedVoucher.expiry_date).toLocaleDateString("vi-VN")}</p>
            )}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lý do tặng voucher *
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Nhập lý do tặng voucher và lời xin lỗi khách hàng..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      <button
        onClick={handleVoucherCompensation}
        disabled={isLoading || !selectedVoucherId || !reason.trim()}
        className="w-full bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <span>🎁</span>
        {isLoading ? "Đang gửi voucher..." : "Gửi voucher & phê duyệt"}
      </button>
    </div>
  );
};

export function ComplaintManagement() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Record<string, "basic" | "voucher">>({});

  useEffect(() => {
    fetchComplaints();
    fetchVouchers();
  }, []);

  // Fetch complaints
  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      const response = await complaintApi.getAllComplaints();
      setComplaints(response.data || []);
    } catch (error) {
      console.error("Lỗi tải khiếu nại:", error);
      toast.error("Không thể tải danh sách khiếu nại");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch vouchers
  const fetchVouchers = async () => {
    try {
      const response = await voucherService.getAll();
      setVouchers(response.data || []);
    } catch (error) {
      console.error("Lỗi tải voucher:", error);
      toast.error("Không thể tải danh sách voucher");
    }
  };

  // Xử lý cập nhật khiếu nại cơ bản
  const handleUpdateComplaint = async (complaintId: string, dataform: any) => {
    try {
      setIsLoading(true);
      const response = await complaintApi.updateComplaint(complaintId, dataform);
      
      // Cập nhật local state
      setComplaints(prev =>
        prev.map(complaint =>
          complaint.id === complaintId
            ? { ...complaint, ...dataform, updated_at: new Date() }
            : complaint
        )
      );

      toast.success("Cập nhật khiếu nại thành công");

      // Gửi email thông báo nếu complaint có user email
      const complaint = complaints.find(c => c.id === complaintId);
      if (complaint?.user?.email) {
        try {
          await emailService.notifyComplaintResolved({
            userId: complaint.user_id || "",
            userEmail: complaint.user.email,
            complaint: { ...complaint, ...dataform },
            resolutionNotes: dataform.resolution_notes,
          });
          toast.success("Đã gửi email thông báo đến khách hàng");
        } catch (emailError) {
          console.error("Lỗi gửi email:", emailError);
          toast.warn("Cập nhật thành công nhưng không thể gửi email");
        }
      }
    } catch (error) {
      console.error("Lỗi cập nhật khiếu nại:", error);
      toast.error("Không thể cập nhật khiếu nại");
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý voucher compensation
  const handleVoucherCompensation = async (complaintId: string, voucherId: string, reason: string) => {
    try {
      setIsLoading(true);
      const complaint = complaints.find(c => c.id === complaintId);
      const voucher = vouchers.find(v => v.id === voucherId);
      
      if (!complaint || !voucher) {
        toast.error("Không tìm thấy thông tin khiếu nại hoặc voucher");
        return;
      }

      // Cấp voucher cho user
      if (complaint.user_id) {
        await compensationService.assignVoucherToUser(complaint.user_id, voucherId, reason);
      }

      // Cập nhật trạng thái khiếu nại
      const resolutionNotes = `Đã tặng voucher ${voucher.code} (${voucher.discount_type === "percentage" ? `${voucher.value}%` : `${Number(voucher.value).toLocaleString()}₫`}) - ${reason}`;
      
      await complaintApi.updateComplaint(complaintId, {
        status: "approved",
        resolution_notes: resolutionNotes,
      });

      // Cập nhật local state
      setComplaints(prev =>
        prev.map(c =>
          c.id === complaintId
            ? { ...c, status: "approved" as const, resolution_notes: resolutionNotes, updated_at: new Date() }
            : c
        )
      );

      // Gửi email thông báo voucher compensation
      if (complaint.user?.email) {
        try {
          await emailService.sendVoucherCompensationEmail(
            complaint.user.email,
            complaint,
            voucher,
            reason
          );
          toast.success("Đã gửi voucher và email thông báo thành công! 🎁");
        } catch (emailError) {
          console.error("Lỗi gửi email voucher:", emailError);
          toast.success("Đã tặng voucher thành công nhưng không thể gửi email");
        }
      } else {
        toast.success("Đã tặng voucher thành công! 🎁");
      }
    } catch (error) {
      console.error("Lỗi xử lý voucher compensation:", error);
      toast.error("Không thể gửi voucher bồi thường");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter logic
  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch =
      complaint.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.order_id?.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Helper functions
  const getInitials = (name?: string) => {
    if (!name) return "KV";
    return name
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: "⏳", label: "Chờ xử lý" },
      approved: { bg: "bg-green-100", text: "text-green-800", icon: "✅", label: "Đã phê duyệt" },
      rejected: { bg: "bg-red-100", text: "text-red-800", icon: "❌", label: "Đã từ chối" },
    }[status] || { bg: "bg-gray-100", text: "text-gray-800", icon: "❓", label: "Không xác định" };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const setComplaintTab = (complaintId: string, tab: "basic" | "voucher") => {
    setActiveTab(prev => ({ ...prev, [complaintId]: tab }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              📋 Quản lý khiếu nại
            </h1>
            <p className="text-gray-600 mt-1">
              Xử lý và giải quyết khiếu nại từ khách hàng
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Tổng khiếu nại</p>
            <p className="text-2xl font-bold text-emerald-600">{filteredComplaints.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm theo tên khách hàng, nội dung, mã đơn hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">🔄 Tất cả trạng thái</option>
            <option value="pending">⏳ Chờ xử lý</option>
            <option value="approved">✅ Đã phê duyệt</option>
            <option value="rejected">❌ Đã từ chối</option>
          </select>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Đang tải danh sách khiếu nại...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có khiếu nại nào</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all"
                ? "Không tìm thấy khiếu nại phù hợp với bộ lọc."
                : "Hiện tại chưa có khiếu nại nào từ khách hàng."}
            </p>
          </div>
        ) : (
          filteredComplaints.map((complaint) => (
            <div
              key={complaint.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Header: Avatar + User Info + Status */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {complaint.user?.face_image_url ? (
                      <img
                        src={complaint.user.face_image_url}
                        alt={complaint.user?.username ?? "Avatar"}
                        loading="lazy"
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-semibold text-emerald-700">
                        {getInitials(complaint.user?.username)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {complaint.user?.username ?? "Khách vãng lai"}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        🕒 {new Date(complaint.created_at).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(complaint.status)}
                    <span className="text-xs text-gray-500">ID: #{complaint.id.slice(0, 8)}</span>
                  </div>
                </div>

                {/* Complaint Content */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">📝 Nội dung khiếu nại:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
                  
                  {(complaint.order_id || complaint.order_item_id) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">🛍️ Thông tin đơn hàng:</h5>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {complaint.order_id && (
                          <span className="bg-white px-2 py-1 rounded border">
                            Mã đơn: #{complaint.order_id.slice(0, 12)}
                          </span>
                        )}
                        {complaint.order_item_id && (
                          <span className="bg-white px-2 py-1 rounded border">
                            Mã món: {complaint.order_item_id}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Resolution Notes Display */}
                {complaint.resolution_notes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                      💬 Ghi chú xử lý:
                    </h4>
                    <p className="text-blue-800 whitespace-pre-wrap">{complaint.resolution_notes}</p>
                  </div>
                )}
              </div>

              {/* Action Tabs - Only show for pending complaints */}
              {complaint.status === "pending" && (
                <div className="border-t border-gray-200">
                  {/* Tab Navigation */}
                  <div className="flex border-b border-gray-200 bg-gray-50">
                    <button
                      onClick={() => setComplaintTab(complaint.id, "basic")}
                      className={`flex-1 px-6 py-3 text-sm font-medium text-center transition-colors ${
                        (activeTab[complaint.id] || "basic") === "basic"
                          ? "bg-white border-b-2 border-emerald-500 text-emerald-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      🟢 Xử lý đơn giản
                    </button>
                    <button
                      onClick={() => setComplaintTab(complaint.id, "voucher")}
                      className={`flex-1 px-6 py-3 text-sm font-medium text-center transition-colors ${
                        activeTab[complaint.id] === "voucher"
                          ? "bg-white border-b-2 border-purple-500 text-purple-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      🟣 Gửi voucher bồi thường
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="p-6">
                    {(activeTab[complaint.id] || "basic") === "basic" ? (
                      <BasicResolutionTab
                        complaint={complaint}
                        onUpdate={handleUpdateComplaint}
                        isLoading={isLoading}
                      />
                    ) : (
                      <VoucherCompensationTab
                        complaint={complaint}
                        vouchers={vouchers}
                        onVoucherCompensation={handleVoucherCompensation}
                        isLoading={isLoading}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
