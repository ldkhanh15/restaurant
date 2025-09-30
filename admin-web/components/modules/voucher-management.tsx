"use client"

import type React from "react"

import { useState } from "react"

interface Voucher {
  id: number
  code: string
  name: string
  description: string
  type: "percentage" | "fixed_amount" | "free_shipping" | "buy_x_get_y"
  value: number
  min_order_amount?: number
  max_discount_amount?: number
  usage_limit: number
  used_count: number
  start_date: string
  end_date: string
  status: "active" | "inactive" | "expired" | "draft"
  applicable_to: "all" | "specific_items" | "specific_categories"
  applicable_items?: number[]
  created_by: string
  created_at: string
}

const mockVouchers: Voucher[] = [
  {
    id: 1,
    code: "WEEKEND20",
    name: "Giảm giá cuối tuần",
    description: "Giảm 20% cho tất cả món ăn vào cuối tuần",
    type: "percentage",
    value: 20,
    min_order_amount: 200000,
    max_discount_amount: 100000,
    usage_limit: 100,
    used_count: 45,
    start_date: "2024-03-15T00:00:00",
    end_date: "2024-03-31T23:59:59",
    status: "active",
    applicable_to: "all",
    created_by: "Quản lý Marketing",
    created_at: "2024-03-10T10:00:00",
  },
  {
    id: 2,
    code: "NEWCUSTOMER",
    name: "Khách hàng mới",
    description: "Giảm 50,000đ cho đơn hàng đầu tiên",
    type: "fixed_amount",
    value: 50000,
    min_order_amount: 150000,
    usage_limit: 500,
    used_count: 234,
    start_date: "2024-03-01T00:00:00",
    end_date: "2024-12-31T23:59:59",
    status: "active",
    applicable_to: "all",
    created_by: "Quản lý",
    created_at: "2024-02-28T15:30:00",
  },
  {
    id: 3,
    code: "PHO2024",
    name: "Khuyến mãi phở",
    description: "Giảm 15% cho tất cả món phở",
    type: "percentage",
    value: 15,
    usage_limit: 200,
    used_count: 89,
    start_date: "2024-03-01T00:00:00",
    end_date: "2024-03-25T23:59:59",
    status: "expired",
    applicable_to: "specific_categories",
    created_by: "Đầu bếp trưởng",
    created_at: "2024-02-25T09:15:00",
  },
]

export function VoucherManagement() {
  const [vouchers, setVouchers] = useState<Voucher[]>(mockVouchers)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)
  const [deletingVoucher, setDeletingVoucher] = useState<Voucher | null>(null)

  const filteredVouchers = vouchers.filter((voucher) => {
    const matchesSearch =
      voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || voucher.status === statusFilter
    const matchesType = typeFilter === "all" || voucher.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "expired":
        return "bg-red-100 text-red-800"
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "percentage":
        return "Phần trăm"
      case "fixed_amount":
        return "Số tiền cố định"
      case "free_shipping":
        return "Miễn phí giao hàng"
      case "buy_x_get_y":
        return "Mua X tặng Y"
      default:
        return type
    }
  }

  const formatValue = (voucher: Voucher) => {
    if (voucher.type === "percentage") {
      return `${voucher.value}%`
    } else if (voucher.type === "fixed_amount") {
      return `${voucher.value.toLocaleString()}đ`
    }
    return voucher.value.toString()
  }

  const toggleVoucherStatus = (voucherId: number) => {
    setVouchers(
      vouchers.map((voucher) =>
        voucher.id === voucherId
          ? {
              ...voucher,
              status: voucher.status === "active" ? "inactive" : ("active" as const),
            }
          : voucher,
      ),
    )
  }

  const handleCreateVoucher = (voucherData: Omit<Voucher, "id" | "used_count" | "created_at">) => {
    const newVoucher: Voucher = {
      ...voucherData,
      id: Math.max(...vouchers.map((v) => v.id)) + 1,
      used_count: 0,
      created_at: new Date().toISOString(),
    }
    setVouchers([...vouchers, newVoucher])
    setIsCreateDialogOpen(false)
  }

  const handleEditVoucher = (voucherData: Voucher) => {
    setVouchers(vouchers.map((v) => (v.id === voucherData.id ? voucherData : v)))
    setIsEditDialogOpen(false)
    setEditingVoucher(null)
  }

  const handleDeleteVoucher = () => {
    if (deletingVoucher) {
      setVouchers(vouchers.filter((v) => v.id !== deletingVoucher.id))
      setIsDeleteDialogOpen(false)
      setDeletingVoucher(null)
    }
  }

  const openEditDialog = (voucher: Voucher) => {
    setEditingVoucher(voucher)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (voucher: Voucher) => {
    setDeletingVoucher(voucher)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Voucher</h1>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Tạo voucher mới
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-emerald-600">
            {vouchers.filter((v) => v.status === "active").length}
          </div>
          <div className="text-sm text-gray-600">Voucher đang hoạt động</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{vouchers.reduce((sum, v) => sum + v.used_count, 0)}</div>
          <div className="text-sm text-gray-600">Lượt sử dụng</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">
            {vouchers.filter((v) => v.status === "expired").length}
          </div>
          <div className="text-sm text-gray-600">Voucher hết hạn</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(vouchers.reduce((sum, v) => sum + (v.used_count / v.usage_limit) * 100, 0) / vouchers.length)}%
          </div>
          <div className="text-sm text-gray-600">Tỷ lệ sử dụng TB</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm theo mã, tên voucher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Tạm dừng</option>
            <option value="expired">Hết hạn</option>
            <option value="draft">Bản nháp</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">Tất cả loại</option>
            <option value="percentage">Phần trăm</option>
            <option value="fixed_amount">Số tiền cố định</option>
            <option value="free_shipping">Miễn phí giao hàng</option>
            <option value="buy_x_get_y">Mua X tặng Y</option>
          </select>
        </div>

        <div className="space-y-4">
          {filteredVouchers.map((voucher) => (
            <div key={voucher.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg font-mono font-bold">
                    {voucher.code}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(voucher.status)}`}>
                    {voucher.status === "active" && "Đang hoạt động"}
                    {voucher.status === "inactive" && "Tạm dừng"}
                    {voucher.status === "expired" && "Hết hạn"}
                    {voucher.status === "draft" && "Bản nháp"}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getTypeLabel(voucher.type)}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-600">{formatValue(voucher)}</div>
                  <div className="text-sm text-gray-500">Giá trị giảm</div>
                </div>
              </div>

              <div className="mb-3">
                <h3 className="font-semibold text-gray-900 mb-1">{voucher.name}</h3>
                <p className="text-gray-600 mb-2">{voucher.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Sử dụng:</span> {voucher.used_count}/{voucher.usage_limit}
                  </div>
                  {voucher.min_order_amount && (
                    <div>
                      <span className="font-medium">Đơn tối thiểu:</span> {voucher.min_order_amount.toLocaleString()}đ
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Bắt đầu:</span>{" "}
                    {new Date(voucher.start_date).toLocaleDateString("vi-VN")}
                  </div>
                  <div>
                    <span className="font-medium">Kết thúc:</span>{" "}
                    {new Date(voucher.end_date).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Tạo bởi: {voucher.created_by} • {new Date(voucher.created_at).toLocaleDateString("vi-VN")}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedVoucher(voucher)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Xem chi tiết
                  </button>
                  <button
                    onClick={() => openEditDialog(voucher)}
                    className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => openDeleteDialog(voucher)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Xóa
                  </button>
                  <button
                    onClick={() => toggleVoucherStatus(voucher.id)}
                    className={`text-sm font-medium ${
                      voucher.status === "active"
                        ? "text-orange-600 hover:text-orange-800"
                        : "text-green-600 hover:text-green-800"
                    }`}
                  >
                    {voucher.status === "active" ? "Tạm dừng" : "Kích hoạt"}
                  </button>
                </div>
              </div>

              {/* Usage Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Tiến độ sử dụng</span>
                  <span>{Math.round((voucher.used_count / voucher.usage_limit) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((voucher.used_count / voucher.usage_limit) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Voucher Dialog */}
      {isCreateDialogOpen && (
        <VoucherDialog
          title="Tạo voucher mới"
          onSave={handleCreateVoucher}
          onClose={() => setIsCreateDialogOpen(false)}
        />
      )}

      {/* Edit Voucher Dialog */}
      {isEditDialogOpen && editingVoucher && (
        <VoucherDialog
          title="Chỉnh sửa voucher"
          voucher={editingVoucher}
          onSave={handleEditVoucher}
          onClose={() => {
            setIsEditDialogOpen(false)
            setEditingVoucher(null)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && deletingVoucher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Xác nhận xóa voucher</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa voucher "{deletingVoucher.name}" không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setDeletingVoucher(null)
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteVoucher}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Xóa voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// VoucherDialog component for create/edit operations
function VoucherDialog({
  title,
  voucher,
  onSave,
  onClose,
}: {
  title: string
  voucher?: Voucher
  onSave: (data: any) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    code: voucher?.code || "",
    name: voucher?.name || "",
    description: voucher?.description || "",
    type: voucher?.type || "percentage",
    value: voucher?.value || 0,
    min_order_amount: voucher?.min_order_amount || 0,
    max_discount_amount: voucher?.max_discount_amount || 0,
    usage_limit: voucher?.usage_limit || 100,
    start_date: voucher?.start_date?.split("T")[0] || new Date().toISOString().split("T")[0],
    end_date: voucher?.end_date?.split("T")[0] || new Date().toISOString().split("T")[0],
    status: voucher?.status || "draft",
    applicable_to: voucher?.applicable_to || "all",
    created_by: voucher?.created_by || "Admin",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = {
      ...formData,
      start_date: formData.start_date + "T00:00:00",
      end_date: formData.end_date + "T23:59:59",
      ...(voucher && { id: voucher.id, used_count: voucher.used_count, created_at: voucher.created_at }),
    }
    onSave(submitData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã voucher</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại voucher</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="percentage">Phần trăm</option>
                <option value="fixed_amount">Số tiền cố định</option>
                <option value="free_shipping">Miễn phí giao hàng</option>
                <option value="buy_x_get_y">Mua X tặng Y</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên voucher</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá trị {formData.type === "percentage" ? "(%)" : "(VNĐ)"}
              </label>
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu (VNĐ)</label>
              <input
                type="number"
                value={formData.min_order_amount}
                onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn sử dụng</label>
              <input
                type="number"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="draft">Bản nháp</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm dừng</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Áp dụng cho</label>
              <select
                value={formData.applicable_to}
                onChange={(e) => setFormData({ ...formData, applicable_to: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Tất cả món ăn</option>
                <option value="specific_items">Món ăn cụ thể</option>
                <option value="specific_categories">Danh mục cụ thể</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              {voucher ? "Cập nhật" : "Tạo voucher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
