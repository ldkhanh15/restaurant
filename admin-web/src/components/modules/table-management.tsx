"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Plus, Edit, Eye, Trash2, Search, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { v4 as uuidv4 } from "uuid"
import { toast } from "react-toastify"
import { tableService } from "@/services/tableService"
import { CreateReservationDialog } from "./modalCreateReservation"

interface TableAttributes {
  id: string
  table_number: string
  capacity: number
  deposit: number
  cancel_minutes: number
  location?: {
    area?: string
    floor?: number
    coordinates?: { x?: number; y?: number }
  } | null
  status: "available" | "occupied" | "cleaning" | "reserved"
  panorama_urls?: string[]
  amenities?: { [key: string]: any }
  description?: string
  created_at?: Date | string
  updated_at?: Date | string
  deleted_at?: Date | null
}

interface TableManagementProps {
  tables: TableAttributes[]
  setTables: React.Dispatch<React.SetStateAction<TableAttributes[]>>
  isCreateTableDialogOpen: boolean
  setIsCreateTableDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
}

// Helper: Hiển thị lỗi
const ErrorMessage = ({ message }: { message?: string }) => (
  message ? <p className="text-sm text-red-600 mt-1">{message}</p> : null
)

export function TableManagement({
  tables,
  setTables,
  isCreateTableDialogOpen,
  setIsCreateTableDialogOpen,
}: TableManagementProps) {
  const [selectedTable, setSelectedTable] = useState<TableAttributes | null>(null)
  const [isViewTableDialogOpen, setIsViewTableDialogOpen] = useState(false)
  const [isEditTableDialogOpen, setIsEditTableDialogOpen] = useState(false)
  const [isCreateReservationOpen, setIsCreateReservationOpen] = useState(false)
  const [selectedTableForReservation, setSelectedTableForReservation] = useState<TableAttributes | null>(null)
  const [searchTableTerm, setSearchTableTerm] = useState("")
  const [tableStatusFilter, setTableStatusFilter] = useState("all")
  const [amenities, setAmenities] = useState<{ label: string; value: string }[]>([])
  const [panoramaFiles, setPanoramaFiles] = useState<File[]>([])
  const [panoramaPreviews, setPanoramaPreviews] = useState<string[]>([])
  const [currentUrls, setCurrentUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form refs
  const createFormRef = useRef<HTMLFormElement>(null)
  const editFormRef = useRef<HTMLFormElement>(null)

  // Validation states
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    console.log("Tables:", tables)
  }, [tables])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-100 text-green-800">Trống</Badge>
      case "occupied":
        return <Badge className="bg-red-100 text-red-800">Có khách</Badge>
      case "reserved":
        return <Badge className="bg-blue-100 text-blue-800">Đã đặt</Badge>
      case "cleaning":
        return <Badge className="bg-gray-100 text-gray-800">Đang dọn dẹp</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const tableStats = {
    total: tables.length,
    availableTables: tables.filter((t) => t.status === "available").length,
  }

  const formatLocation = (loc?: TableAttributes["location"]) => {
    if (!loc) return null
    const parts: string[] = []
    if (loc.area) parts.push(`${loc.area}`)
    if (loc.floor !== undefined && loc.floor !== null) parts.push(`Tầng ${loc.floor}`)
    return parts.length ? parts.join(" • ") : null
  }

  const formatAmenities = (amen?: TableAttributes["amenities"]) => {
    if (!amen || typeof amen !== "object") return "Không có"
    return Object.entries(amen)
      .map(([key, value]) => {
        const formattedKey = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        return `${formattedKey}: ${value === true ? "Có" : value}`
      })
      .join(", ")
  }

  const parseAmenitiesToObject = (amenities: { label: string; value: string }[]): { [key: string]: any } => {
    return amenities.reduce((acc, { label, value }) => {
      if (label.trim()) {
        acc[label] = value === "true" ? true : value === "false" ? false : value
      }
      return acc
    }, {} as { [key: string]: any })
  }

  const getTables = async () => {
    try {
      const response = await tableService.getAllNoPaging()
      if (response) {
        const data = response as any
        const normalized = (Array.isArray(data) ? data : []).map((t: any) => ({
          ...t,
          created_at: t.created_at ? new Date(t.created_at) : undefined,
          updated_at: t.updated_at ? new Date(t.updated_at) : undefined,
        })) as TableAttributes[]
        setTables(normalized)
      } else {
        toast.error("Lấy danh sách bàn thất bại")
      }
    } catch (err) {
      toast.error("Lỗi khi tải danh sách bàn")
      setTables([])
    }
  }

  useEffect(() => {
    getTables()
  }, [])

  const filteredTables = tables.filter((table) => {
    const term = searchTableTerm.trim().toLowerCase()
    const matchesTerm =
      !term ||
      table.table_number.toLowerCase().includes(term) ||
      (typeof table.location === "string" && String(table.location).toLowerCase().includes(term)) ||
      (table.location?.area && table.location.area.toLowerCase().includes(term)) ||
      (table.location?.floor !== undefined && String(table.location.floor).includes(term))
    const matchesStatus =
      tableStatusFilter === "all" ||
      (tableStatusFilter === "active" && !table.deleted_at) ||
      (tableStatusFilter === "deleted" && table.deleted_at)
    return matchesTerm && matchesStatus
  })

  const buildLocationFromForm = (formData: FormData) => {
    const area = formData.get("location_area")?.toString().trim()
    const floorRaw = formData.get("location_floor")?.toString().trim()
    const xRaw = formData.get("location_x")?.toString().trim()
    const yRaw = formData.get("location_y")?.toString().trim()

    const hasAny = !!(area || floorRaw || xRaw || yRaw)
    if (!hasAny) return undefined

    const loc: any = {}
    if (area) loc.area = area
    if (floorRaw) {
      const f = Number(floorRaw)
      if (!Number.isNaN(f) && f >= 0) loc.floor = f
    }
    const coords: any = {}
    if (xRaw) {
      const xv = Number(xRaw)
      if (!Number.isNaN(xv) && xv >= 0) coords.x = xv
    }
    if (yRaw) {
      const yv = Number(yRaw)
      if (!Number.isNaN(yv) && yv >= 0) coords.y = yv
    }
    if (Object.keys(coords).length) loc.coordinates = coords
    return loc
  }

  // VALIDATE FORM
  const validateForm = (form: HTMLFormElement, isEdit = false): Record<string, string> => {
    const formData = new FormData(form)
    const errors: Record<string, string> = {}

    const table_number = formData.get("table_number")?.toString().trim()
    const capacity = formData.get("capacity")?.toString()
    const deposit = formData.get("deposit")?.toString()
    const cancel_minutes = formData.get("cancel_minutes")?.toString()

    if (!table_number) errors.table_number = "Số bàn không được để trống"
    if (!capacity) errors.capacity = "Sức chứa không được để trống"
    else if (Number(capacity) < 0) errors.capacity = "Sức chứa phải ≥ 0"

    if (!deposit) errors.deposit = "Tiền cọc không được để trống"
    else if (Number(deposit) < 0) errors.deposit = "Tiền cọc phải ≥ 0"

    if (!cancel_minutes) errors.cancel_minutes = "Thời gian hủy không được để trống"
    else if (Number(cancel_minutes) < 0) errors.cancel_minutes = "Thời gian hủy phải ≥ 0"

    // Tọa độ và tầng (nếu có)
    const floor = formData.get("location_floor")?.toString()
    const x = formData.get("location_x")?.toString()
    const y = formData.get("location_y")?.toString()

    if (floor && (Number(floor) < 0)) errors.location_floor = "Tầng phải ≥ 0"
    if (x && (Number(x) < 0)) errors.location_x = "Tọa độ X phải ≥ 0"
    if (y && (Number(y) < 0)) errors.location_y = "Tọa độ Y phải ≥ 0"

    return errors
  }

  // Realtime validation cho Create
  useEffect(() => {
    if (createFormRef.current) {
      const handleInput = () => {
        const errors = validateForm(createFormRef.current!)
        setCreateErrors(errors)
      }
      const inputs = createFormRef.current.querySelectorAll("input, select")
      inputs.forEach((input) => input.addEventListener("input", handleInput))
      return () => inputs.forEach((input) => input.removeEventListener("input", handleInput))
    }
  }, [createFormRef.current, amenities, panoramaFiles])

  // Realtime validation cho Edit
  useEffect(() => {
    if (editFormRef.current) {
      const handleInput = () => {
        const errors = validateForm(editFormRef.current!, true)
        setEditErrors(errors)
      }
      const inputs = editFormRef.current.querySelectorAll("input, select")
      inputs.forEach((input) => input.addEventListener("input", handleInput))
      return () => inputs.forEach((input) => input.removeEventListener("input", handleInput))
    }
  }, [editFormRef.current, selectedTable, amenities, panoramaFiles])

  const handleCreateTable = async (form: HTMLFormElement) => {
    const errors = validateForm(form)
    setCreateErrors(errors)
    if (Object.keys(errors).length > 0) {
      toast.error("Vui lòng kiểm tra lại các trường bắt buộc")
      return
    }

    setIsSubmitting(true)
    try {
      const formValues = new FormData(form)
      const id = uuidv4()
      const location = buildLocationFromForm(formValues)
      const amenitiesObj = parseAmenitiesToObject(amenities)

      const payload = new FormData()
      payload.append("id", id)
      payload.append("table_number", String(formValues.get("table_number") || ""))
      payload.append("capacity", String(formValues.get("capacity") || "0"))
      payload.append("deposit", String(formValues.get("deposit") || "0"))
      payload.append("cancel_minutes", String(formValues.get("cancel_minutes") || "0"))
      payload.append("status", String(formValues.get("status") || "available"))
      payload.append("description", String(formValues.get("description") || ""))
      if (location) payload.append("location", JSON.stringify(location))
      payload.append("amenities", JSON.stringify(amenitiesObj))
      // files
      panoramaFiles.forEach((file) => payload.append("panorama_files", file))

      const createdTable = await tableService.create(payload) as unknown as TableAttributes

      if (createdTable && createdTable.id) {
        setTables((prev) => [...prev, createdTable])
        setIsCreateTableDialogOpen(false)
        resetForm()
        toast.success("Đã thêm bàn thành công")
      } else {
        toast.error("Thêm bàn thất bại")
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi thêm bàn")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTable = async (id: string, form: HTMLFormElement) => {
    const errors = validateForm(form, true)
    setEditErrors(errors)
    if (Object.keys(errors).length > 0) {
      toast.error("Vui lòng kiểm tra lại các trường bắt buộc")
      return
    }

    setIsSubmitting(true)
    try {
      const formValues = new FormData(form)
      const location = buildLocationFromForm(formValues)
      const amenitiesObj = parseAmenitiesToObject(amenities)

      const payload = new FormData()
      payload.append("table_number", String(formValues.get("table_number") || ""))
      payload.append("capacity", String(formValues.get("capacity") || "0"))
      payload.append("deposit", String(formValues.get("deposit") || "0"))
      payload.append("cancel_minutes", String(formValues.get("cancel_minutes") || "0"))
      payload.append("status", String(formValues.get("status") || "available"))
      payload.append("description", String(formValues.get("description") || ""))
      if (location) payload.append("location", JSON.stringify(location))
      payload.append("amenities", JSON.stringify(amenitiesObj))
      if (currentUrls && currentUrls.length > 0) {
        payload.append("panorama_urls", JSON.stringify(currentUrls))
      }
      panoramaFiles.forEach((file) => payload.append("panorama_files", file))

      const updated = await tableService.update(id, payload) as unknown as TableAttributes

      if (updated && updated.id) {
        setTables((prev) => prev.map((t) => (t.id === id ? updated : t)))
        setIsEditTableDialogOpen(false)
        resetForm()
        toast.success("Đã cập nhật bàn thành công")
      } else {
        toast.error("Cập nhật bàn thất bại")
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi cập nhật bàn")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setAmenities([])
    setPanoramaFiles([])
    setPanoramaPreviews([])
    setCurrentUrls([])
    setCreateErrors({})
    setEditErrors([] as any)
  }

  const handleDeleteTable = async (id: string) => {
    try {
      const response = await tableService.remove(id)
      if (response) {
        setTables((prev) =>
          prev.map((table) => (table.id === id ? { ...table, deleted_at: new Date() } : table))
        )
        toast.success("Đã xóa bàn thành công")
      } else {
        toast.error("Xóa bàn thất bại")
      }
    } catch (err) {
      toast.error("Lỗi khi xóa bàn")
    }
  }

  const handleAddAmenity = () => {
    setAmenities([...amenities, { label: "", value: "" }])
  }

  const handleRemoveAmenity = (index: number) => {
    setAmenities(amenities.filter((_, i) => i !== index))
  }

  const handleAmenityChange = (index: number, field: "label" | "value", value: string) => {
    const newAmenities = [...amenities]
    newAmenities[index][field] = value
    setAmenities(newAmenities)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const previews = files.map((file) => URL.createObjectURL(file))
      setPanoramaFiles((prev) => [...prev, ...files])
      setPanoramaPreviews((prev) => [...prev, ...previews])
    }
  }

  const handleRemovePanorama = (index: number) => {
    setPanoramaFiles((prev) => prev.filter((_, i) => i !== index))
    setPanoramaPreviews((prev) => {
      const newPreviews = prev.filter((_, i) => i !== index)
      if (prev[index].startsWith("blob:")) URL.revokeObjectURL(prev[index])
      return newPreviews
    })
  }

  useEffect(() => {
    if (selectedTable?.panorama_urls) {
      setCurrentUrls(selectedTable.panorama_urls)
      setPanoramaPreviews(selectedTable.panorama_urls)
    }
    return () => {
      panoramaPreviews.forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url)
      })
    }
  }, [selectedTable])

  return (
    <div className="space-y-6">
      {/* --- Search + Filter --- */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Tìm kiếm bàn..."
              value={searchTableTerm}
              onChange={(e) => setSearchTableTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={tableStatusFilter} onValueChange={setTableStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="deleted">Đã xóa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* --- Table Cards --- */}
      {filteredTables.length === 0 ? (
        <div className="text-center">
          HIỆN TẠI CHƯA CÓ DỮ LIỆU BÀN
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {filteredTables.map((table) => (
            <Card
              key={table.id}
              className={`border-l-4 ${table.deleted_at ? "opacity-50" : ""} ${
                table.status === "available"
                  ? "border-l-green-500"
                  : table.status === "occupied"
                    ? "border-l-red-500"
                    : table.status === "reserved"
                      ? "border-l-blue-500"
                      : "border-l-gray-500"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{table.table_number}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {table.capacity} người
                    </CardDescription>
                  </div>
                  <div className="flex gap-3 items-center">
                    {getStatusBadge(table.status)}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTable(table)
                          setIsViewTableDialogOpen(true)
                        }}
                        title="Xem chi tiết"
                        className="border-blue-500 text-blue-500 hover:bg-blue-50"
                      >
                        <Eye className="h-5 w-5" />
                      </Button>
                      {!table.deleted_at && (
                        <>
                          {table.status === "available" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTableForReservation(table)
                                setIsCreateReservationOpen(true)
                              }}
                              title="Đặt bàn"
                              className="border-green-500 text-black hover:bg-green-50"
                            >
                              <Plus className="h-5 w-5" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTable(table)
                              setAmenities(
                                table.amenities
                                  ? Object.entries(table.amenities).map(([label, value]) => ({
                                      label,
                                      value: String(value),
                                    }))
                                  : []
                              )
                              setPanoramaFiles([])
                              setPanoramaPreviews(table.panorama_urls || [])
                              setCurrentUrls(table.panorama_urls || [])
                              setIsEditTableDialogOpen(true)
                            }}
                            title="Chỉnh sửa"
                            className="border-yellow-500 text-yellow-500 hover:bg-yellow-50"
                          >
                            <Edit className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleDeleteTable(table.id)
                            }}
                            title="Xóa"
                            className="border-red-500 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Sức chứa: {table.capacity} người</p>
                <p className="text-sm text-muted-foreground">
                  Vị trí: {formatLocation(table.location) ?? "Không có"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Table Dialog */}
      <Dialog open={isCreateTableDialogOpen} onOpenChange={(open) => {
        setIsCreateTableDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="min-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm bàn mới</DialogTitle>
            <DialogDescription>Thêm thông tin bàn mới vào hệ thống</DialogDescription>
          </DialogHeader>
          <form
            ref={createFormRef}
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateTable(e.currentTarget);
            }}
          >
            <div className="grid grid-cols-2 gap-8 py-4">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="table_number">Số bàn *</Label>
                  <Input id="table_number" name="table_number" required className="w-full" />
                  <ErrorMessage message={createErrors.table_number} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Sức chứa *</Label>
                  <Input id="capacity" name="capacity" type="number" min="0" required className="w-full" />
                  <ErrorMessage message={createErrors.capacity} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deposit">Tiền cọc (VNĐ) *</Label>
                  <Input id="deposit" name="deposit" type="number" min="0" required className="w-full" />
                  <ErrorMessage message={createErrors.deposit} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cancel_minutes">Thời gian hủy (phút) *</Label>
                  <Input id="cancel_minutes" name="cancel_minutes" type="number" min="0" required className="w-full" />
                  <ErrorMessage message={createErrors.cancel_minutes} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select name="status" defaultValue="available">
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Trống</SelectItem>
                      <SelectItem value="occupied">Có khách</SelectItem>
                      <SelectItem value="reserved">Đã đặt</SelectItem>
                      <SelectItem value="cleaning">Đang dọn dẹp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Mô tả</Label>
                  <Input id="description" name="description" className="w-full" />
                </div>
                <div className="grid gap-2">
                  <Label>Vị trí</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location_area">Khu vực</Label>
                      <Input id="location_area" name="location_area" placeholder="Gần cửa sổ" />
                    </div>
                    <div>
                      <Label htmlFor="location_floor">Tầng</Label>
                      <Input id="location_floor" name="location_floor" type="number" min="0" placeholder="1" />
                      <ErrorMessage message={createErrors.location_floor} />
                    </div>
                    <div>
                      <Label htmlFor="location_x">Tọa độ X</Label>
                      <Input id="location_x" name="location_x" type="number" min="0" placeholder="10" />
                      <ErrorMessage message={createErrors.location_x} />
                    </div>
                    <div>
                      <Label htmlFor="location_y">Tọa độ Y</Label>
                      <Input id="location_y" name="location_y" type="number" min="0" placeholder="20" />
                      <ErrorMessage message={createErrors.location_y} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <Label>Ảnh Panorama</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSubmitting}
                      onClick={() => document.getElementById("panorama_upload")?.click()}
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      <Plus className="h-4 w-4 mr-2" /> {isSubmitting ? "Đang xử lý..." : "Chọn ảnh"}
                    </Button>
                    <Input
                      id="panorama_upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto p-2 border rounded-md">
                    {panoramaPreviews.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {panoramaPreviews.map((url, index) => (
                          <div key={index} className="relative">
                            <img src={url} alt={`Panorama ${index + 1}`} className="w-full h-40 object-cover rounded" />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 bg-red-600 text-white hover:bg-red-700"
                              onClick={() => handleRemovePanorama(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">Chưa có ảnh panorama</p>
                    )}
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <Label>Tiện nghi</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddAmenity}
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Thêm tiện nghi
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto p-2 border rounded-md">
                    {amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={amenity.label}
                          onChange={(e) => handleAmenityChange(index, "label", e.target.value)}
                          placeholder="Tên tiện nghi"
                          className="w-2/3"
                        />
                        <Input
                          value={amenity.value}
                          onChange={(e) => handleAmenityChange(index, "value", e.target.value)}
                          placeholder="Giá trị"
                          className="w-1/3"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveAmenity(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {amenities.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center">Chưa có tiện nghi</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateTableDialogOpen(false)}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Hủy
              </Button>
              <Button type="submit" className="bg-black text-white hover:bg-gray-800" disabled={isSubmitting || Object.keys(createErrors).length > 0}>
                {isSubmitting ? "Đang thêm..." : "Thêm bàn"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Table Dialog */}
      <Dialog open={isViewTableDialogOpen} onOpenChange={setIsViewTableDialogOpen}>
        <DialogContent className="min-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thông tin bàn</DialogTitle>
          </DialogHeader>
          {selectedTable && (
            <div className="grid grid-cols-2 gap-8 py-4">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Số bàn</Label>
                  <div>{selectedTable.table_number}</div>
                </div>
                <div className="grid gap-2">
                  <Label>Sức chứa</Label>
                  <div>{selectedTable.capacity} người</div>
                </div>
                <div className="grid gap-2">
                  <Label>Tiền cọc</Label>
                  <div>{selectedTable.deposit} VNĐ</div>
                </div>
                <div className="grid gap-2">
                  <Label>Thời gian hủy</Label>
                  <div>{selectedTable.cancel_minutes} phút</div>
                </div>
                <div className="grid gap-2">
                  <Label>Vị trí</Label>
                  <div>{formatLocation(selectedTable.location) || "Không có"}</div>
                </div>
                <div className="grid gap-2">
                  <Label>Trạng thái</Label>
                  <div>{getStatusBadge(selectedTable.status)}</div>
                </div>
                <div className="grid gap-2">
                  <Label>Mô tả</Label>
                  <div>{selectedTable.description || "Không có"}</div>
                </div>
                <div className="grid gap-2">
                  <Label>Ngày tạo</Label>
                  <div>
                    {selectedTable.created_at
                      ? new Date(selectedTable.created_at).toLocaleDateString()
                      : "Không có"}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Ảnh panorama</Label>
                  <div>
                    {Array.isArray(selectedTable.panorama_urls) && selectedTable.panorama_urls.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {selectedTable.panorama_urls.map((url, index) => (
                          <img key={index} src={url} alt={`Panorama ${index + 1}`} className="w-full h-40 object-cover rounded" />
                        ))}
                      </div>
                    ) : (
                      "Không có"
                    )}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Tiện nghi</Label>
                  <div>{formatAmenities(selectedTable.amenities)}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setIsViewTableDialogOpen(false)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Table Dialog */}
      <Dialog open={isEditTableDialogOpen} onOpenChange={(open) => {
        setIsEditTableDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="min-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa bàn</DialogTitle>
          </DialogHeader>
          {selectedTable && (
            <form
              ref={editFormRef}
              onSubmit={(e) => {
                e.preventDefault()
                handleUpdateTable(selectedTable.id, e.currentTarget)
              }}
            >
              <div className="grid grid-cols-2 gap-8 py-4">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-table_number">Số bàn *</Label>
                    <Input id="edit-table_number" name="table_number" defaultValue={selectedTable.table_number} required className="w-full" />
                    <ErrorMessage message={editErrors.table_number} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-capacity">Sức chứa *</Label>
                    <Input id="edit-capacity" name="capacity" type="number" min="0" defaultValue={selectedTable.capacity} required className="w-full" />
                    <ErrorMessage message={editErrors.capacity} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-deposit">Tiền cọc (VNĐ) *</Label>
                    <Input id="edit-deposit" name="deposit" type="number" min="0" defaultValue={selectedTable.deposit} required className="w-full" />
                    <ErrorMessage message={editErrors.deposit} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-cancel_minutes">Thời gian hủy (phút) *</Label>
                    <Input id="edit-cancel_minutes" name="cancel_minutes" type="number" min="0" defaultValue={selectedTable.cancel_minutes} required className="w-full" />
                    <ErrorMessage message={editErrors.cancel_minutes} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-status">Trạng thái</Label>
                    <Select name="status" defaultValue={selectedTable.status}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Trống</SelectItem>
                        <SelectItem value="occupied">Có khách</SelectItem>
                        <SelectItem value="reserved">Đã đặt</SelectItem>
                        <SelectItem value="cleaning">Đang dọn dẹp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Mô tả</Label>
                    <Input id="edit-description" name="description" defaultValue={selectedTable.description ?? ""} className="w-full" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Vị trí</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-location_area">Khu vực</Label>
                        <Input id="edit-location_area" name="location_area" defaultValue={selectedTable.location?.area ?? ""} />
                      </div>
                      <div>
                        <Label htmlFor="edit-location_floor">Tầng</Label>
                        <Input id="edit-location_floor" name="location_floor" type="number" min="0" defaultValue={selectedTable.location?.floor ?? ""} />
                        <ErrorMessage message={editErrors.location_floor} />
                      </div>
                      <div>
                        <Label htmlFor="edit-location_x">Tọa độ X</Label>
                        <Input id="edit-location_x" name="location_x" type="number" min="0" defaultValue={selectedTable.location?.coordinates?.x ?? ""} />
                        <ErrorMessage message={editErrors.location_x} />
                      </div>
                      <div>
                        <Label htmlFor="edit-location_y">Tọa độ Y</Label>
                        <Input id="edit-location_y" name="location_y" type="number" min="0" defaultValue={selectedTable.location?.coordinates?.y ?? ""} />
                        <ErrorMessage message={editErrors.location_y} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <div className="flex justify-between items-center">
                      <Label>Ảnh Panorama (hiện tại)</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={() => document.getElementById("edit_panorama_upload")?.click()}
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        <Plus className="h-4 w-4 mr-2" /> {isSubmitting ? "Đang xử lý..." : "Thêm ảnh mới"}
                      </Button>
                      <Input
                        id="edit_panorama_upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto p-2 border rounded-md">
                      {panoramaPreviews.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {panoramaPreviews.map((url, index) => (
                            <div key={index} className="relative">
                              <img src={url} alt={`Panorama ${index + 1}`} className="w-full h-40 object-cover rounded" />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 bg-red-600 text-white hover:bg-red-700"
                                onClick={() => handleRemovePanorama(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center">Chưa có ảnh panorama</p>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <div className="flex justify-between items-center">
                      <Label>Tiện nghi</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddAmenity}
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Thêm tiện nghi
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto p-2 border rounded-md">
                      {amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={amenity.label}
                            onChange={(e) => handleAmenityChange(index, "label", e.target.value)}
                            placeholder="Tên tiện nghi"
                            className="w-2/3"
                          />
                          <Input
                            value={amenity.value}
                            onChange={(e) => handleAmenityChange(index, "value", e.target.value)}
                            placeholder="Giá trị"
                            className="w-1/3"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveAmenity(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {amenities.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center">Chưa có tiện nghi</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditTableDialogOpen(false)}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Hủy
                </Button>
                <Button type="submit" className="bg-black text-white hover:bg-gray-800" disabled={isSubmitting || Object.keys(editErrors).length > 0}>
                  {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Reservation Dialog */}
      <CreateReservationDialog
        isOpen={isCreateReservationOpen}
        onOpenChange={setIsCreateReservationOpen}
        onCreateReservation={(data: any) => {
          console.log("Tạo đặt chỗ mới:", data)
          setIsCreateReservationOpen(false)
          toast.success("Đã gửi thông tin đặt bàn!")
        }}
      />
    </div>
  )
}