"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, Plus, Trash2, Eye, Filter, Pencil } from "lucide-react"
import { eventService } from "@/services/eventService"
import { toast } from "react-toastify"
import { v4 as uuidv4 } from "uuid"

interface Event {
  id: string
  name: string
  description?: string
  price?: number
  inclusions?: Record<string, string | string[]>
  decorations?: Record<string, string | string[]>
  created_at: string
  deleted_at?: string | null
}

export function EventManagement() {
  const [events, setEvents] = useState<Event[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showDeleted, setShowDeleted] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
    price: "",
    inclusions: {} as Record<string, string>,
    decorations: {} as Record<string, string>,
  })

  // Validation errors
  const [errors, setErrors] = useState({
    name: "",
    price: "",
    inclusions: [] as string[],
    decorations: [] as string[],
  })

  // Load dữ liệu
  const getAllEvents = async () => {
    try {
      const response = await eventService.getAllNoPaging()
      if (response) {
        const data = response as any
        setEvents(Array.isArray(data) ? data : [])
      } else {
        toast.error("Lỗi khi tải dữ liệu sự kiện")
      }
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu sự kiện")
      setEvents([])
    }
  }

  useEffect(() => {
    getAllEvents()
  }, [])

  // Lọc dữ liệu
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase())

    if (showDeleted) return matchesSearch
    return matchesSearch && !event.deleted_at
  })

  const formatPrice = (price?: number) => {
    if (!price) return "Chưa có giá"
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  // Validation functions
  const validateName = (name: string, editingId?: string): string => {
    const trimmed = name.trim()
    if (!trimmed) return "Tên sự kiện không được để trống"

    const isDuplicate = events.some(e => {
      const sameName = e.name.trim().toLowerCase() === trimmed.toLowerCase()
      const differentId = !editingId || e.id !== editingId
      return sameName && differentId
    })

    return isDuplicate ? "Tên sự kiện đã tồn tại" : ""
  }

  const validatePrice = (price: string): string => {
    const num = Number(price)
    if (!price.trim()) return "Giá không được để trống"
    if (isNaN(num) || num <= 0) return "Giá phải là số dương"
    return ""
  }

  const validateKeyValue = (obj: Record<string, string>): string[] => {
    const errors: string[] = []
    Object.entries(obj).forEach(([key, value], index) => {
      if (!key.trim()) errors.push(`Dòng ${index + 1}: Tên mục không được trống`)
      if (!value.trim()) errors.push(`Dòng ${index + 1}: Giá trị không được trống`)
    })
    return errors
  }

  const validateForm = (editingId?: string): boolean => {
    const nameError = validateName(newEvent.name, editingId)
    const priceError = validatePrice(newEvent.price)
    const inclusionsErrors = validateKeyValue(newEvent.inclusions)
    const decorationsErrors = validateKeyValue(newEvent.decorations)

    setErrors({
      name: nameError,
      price: priceError,
      inclusions: inclusionsErrors,
      decorations: decorationsErrors,
    })

    const hasError = nameError || priceError || inclusionsErrors.length > 0 || decorationsErrors.length > 0
    if (hasError) toast.error("Vui lòng kiểm tra lại thông tin!")
    return !hasError
  }

  // Handle dynamic rows
  const handleAddRow = (field: "inclusions" | "decorations") => {
    const current = newEvent[field]
    const hasEmpty = Object.entries(current).some(([k, v]) => !k.trim() || !v.trim())
    if (hasEmpty) {
      toast.warn("Vui lòng điền đầy đủ dòng hiện tại trước khi thêm mới")
      return
    }
    setNewEvent({
      ...newEvent,
      [field]: { ...current, "": "" },
    })
  }

  const handleKeyChange = (field: "inclusions" | "decorations", index: number, newKey: string) => {
    const updated = { ...newEvent[field] }
    const keys = Object.keys(updated)
    const oldKey = keys[index]
    const val = updated[oldKey]
    delete updated[oldKey]
    updated[newKey] = val
    setNewEvent({ ...newEvent, [field]: updated })
  }

  const handleValueChange = (field: "inclusions" | "decorations", index: number, newValue: string) => {
    const updated = { ...newEvent[field] }
    const keys = Object.keys(updated)
    updated[keys[index]] = newValue
    setNewEvent({ ...newEvent, [field]: updated })
  }

  const handleDeleteRow = (field: "inclusions" | "decorations", index: number) => {
    const updated = { ...newEvent[field] }
    const key = Object.keys(updated)[index]
    delete updated[key]
    setNewEvent({ ...newEvent, [field]: updated })
  }

  const resetForm = () => {
    setNewEvent({
      name: "",
      description: "",
      price: "",
      inclusions: {},
      decorations: {},
    })
    setErrors({ name: "", price: "", inclusions: [], decorations: [] })
  }

  const handleCreateEvent = async () => {
    if (!validateForm()) return

    const event: Event = {
      id: uuidv4(),
      name: newEvent.name.trim(),
      description: newEvent.description.trim() || undefined,
      price: Number(newEvent.price),
      inclusions: Object.fromEntries(
        Object.entries(newEvent.inclusions).filter(([k, v]) => k.trim() && v.trim())
      ),
      decorations: Object.fromEntries(
        Object.entries(newEvent.decorations).filter(([k, v]) => k.trim() && v.trim())
      ),
      created_at: new Date().toISOString().split("T")[0],
    }

    try {
      const response = await eventService.create(event)
      if (!response) {
        toast.error("Tạo sự kiện thất bại!")
        return
      }
      setEvents(prev => [...prev, event])
      toast.success("Tạo sự kiện thành công!")
      resetForm()
      setIsCreateDialogOpen(false)
    } catch (err) {
      toast.error("Lỗi khi tạo sự kiện")
    }
  }

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event)
    setNewEvent({
      name: event.name,
      description: event.description || "",
      price: event.price?.toString() || "",
      inclusions: (event.inclusions as Record<string, string>) || {},
      decorations: (event.decorations as Record<string, string>) || {},
    })
    setErrors({ name: "", price: "", inclusions: [], decorations: [] })
    setIsEditDialogOpen(true)
  }

  const handleUpdateEvent = async () => {
    if (!selectedEvent || !validateForm(selectedEvent.id)) return

    const updatedEvent: Event = {
      ...selectedEvent,
      name: newEvent.name.trim(),
      description: newEvent.description.trim() || undefined,
      price: Number(newEvent.price),
      inclusions: Object.fromEntries(
        Object.entries(newEvent.inclusions).filter(([k, v]) => k.trim() && v.trim())
      ),
      decorations: Object.fromEntries(
        Object.entries(newEvent.decorations).filter(([k, v]) => k.trim() && v.trim())
      ),
    }

    try {
      const response = await eventService.update(selectedEvent.id, updatedEvent)
      if (!response) {
        toast.error("Cập nhật thất bại!")
        return
      }
      setEvents(prev => prev.map(e => e.id === selectedEvent.id ? updatedEvent : e))
      toast.success("Cập nhật thành công!")
      setIsEditDialogOpen(false)
      resetForm()
    } catch (err) {
      toast.error("Lỗi khi cập nhật")
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await eventService.remove(eventId)
      if (!response) {
        toast.error("Xóa thất bại!")
        return
      }
      toast.success("Xóa thành công!")
      setEvents(prev =>
        prev.map(e =>
          e.id === eventId
            ? { ...e, deleted_at: new Date().toISOString().split("T")[0] }
            : e
        )
      )
    } catch (err) {
      toast.error("Lỗi khi xóa")
    }
  }

  const renderKeyValueList = (items: Record<string, string | string[]> | undefined) => {
    if (!items || Object.keys(items).length === 0) {
      return <p className="text-muted-foreground text-sm">Không có dữ liệu</p>
    }
    return (
      <ul className="space-y-1 text-sm">
        {Object.entries(items).map(([key, value], index) => (
          <li key={index} className="flex gap-2">
            <span className="font-medium">{key}:</span>
            <span className="text-muted-foreground">
              {Array.isArray(value)
                ? value.join(", ") || "Không có"
                : value || "Không có"}
            </span>
          </li>
        ))}
      </ul>
    )
  }

  const renderEventForm = (isEdit = false) => {
    const hasError = errors.name || errors.price || errors.inclusions.length > 0 || errors.decorations.length > 0

    return (
      <div className="grid gap-5 py-4">
        {/* Tên sự kiện */}
        <div className="grid gap-2">
          <Label htmlFor="name">Tên sự kiện *</Label>
          <Input
            id="name"
            value={newEvent.name}
            onChange={(e) => {
              setNewEvent({ ...newEvent, name: e.target.value })
              setErrors({ ...errors, name: validateName(e.target.value, isEdit ? selectedEvent?.id : undefined) })
            }}
            placeholder="Nhập tên sự kiện"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

        {/* Mô tả */}
        <div className="grid gap-2">
          <Label htmlFor="description">Mô tả</Label>
          <Input
            id="description"
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            placeholder="Nhập mô tả (không bắt buộc)"
          />
        </div>

        {/* Giá */}
        <div className="grid gap-2">
          <Label htmlFor="price">Giá gói (VND) *</Label>
          <Input
            id="price"
            type="number"
            value={newEvent.price}
            onChange={(e) => {
              setNewEvent({ ...newEvent, price: e.target.value })
              setErrors({ ...errors, price: validatePrice(e.target.value) })
            }}
            placeholder="Nhập giá"
            className={errors.price ? "border-red-500" : ""}
          />
          {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
        </div>

        {/* Inclusions */}
        <div className="grid gap-3">
          <Label>Dịch vụ kèm theo</Label>
          {Object.entries(newEvent.inclusions).map(([key, value], index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  placeholder="Tên mục"
                  value={key}
                  onChange={(e) => handleKeyChange("inclusions", index, e.target.value)}
                  className={errors.inclusions.some(err => err.includes(`Dòng ${index + 1}`)) ? "border-red-500" : ""}
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Giá trị"
                  value={value}
                  onChange={(e) => handleValueChange("inclusions", index, e.target.value)}
                  className={errors.inclusions.some(err => err.includes(`Dòng ${index + 1}`)) ? "border-red-500" : ""}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteRow("inclusions", index)}
                className="mt-1"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          {errors.inclusions.map((err, i) => (
            <p key={i} className="text-sm text-red-500 -mt-2">{err}</p>
          ))}
          <Button variant="outline" size="sm" onClick={() => handleAddRow("inclusions")}>
            + Thêm dịch vụ
          </Button>
        </div>

        {/* Decorations */}
        <div className="grid gap-3">
          <Label>Phụ kiện trang trí</Label>
          {Object.entries(newEvent.decorations).map(([key, value], index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  placeholder="Tên mục"
                  value={key}
                  onChange={(e) => handleKeyChange("decorations", index, e.target.value)}
                  className={errors.decorations.some(err => err.includes(`Dòng ${index + 1}`)) ? "border-red-500" : ""}
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Giá trị"
                  value={value}
                  onChange={(e) => handleValueChange("decorations", index, e.target.value)}
                  className={errors.decorations.some(err => err.includes(`Dòng ${index + 1}`)) ? "border-red-500" : ""}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteRow("decorations", index)}
                className="mt-1"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          {errors.decorations.map((err, i) => (
            <p key={i} className="text-sm text-red-500 -mt-2">{err}</p>
          ))}
          <Button variant="outline" size="sm" onClick={() => handleAddRow("decorations")}>
            + Thêm phụ kiện
          </Button>
        </div>

        <DialogFooter className="mt-6">
          <Button
            onClick={isEdit ? handleUpdateEvent : handleCreateEvent}
            disabled={
              Boolean(hasError) ||
              !Boolean(newEvent.name?.trim()) ||
              !Boolean(newEvent.price?.trim())
            }
          >
            {isEdit ? "Cập nhật" : "Tạo"} sự kiện
          </Button>
        </DialogFooter>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Tìm kiếm sự kiện..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button
            variant={showDeleted ? "default" : "outline"}
            onClick={() => setShowDeleted(!showDeleted)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showDeleted ? "Ẩn đã xóa" : "Hiện đã xóa"}
          </Button>
        </div>

        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open)
            if (open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm sự kiện
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm sự kiện mới</DialogTitle>
              <DialogDescription>Tạo gói sự kiện mới cho khách hàng</DialogDescription>
            </DialogHeader>
            {renderEventForm(false)}
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sự kiện</CardTitle>
          <CardDescription>({filteredEvents.length} sự kiện)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên sự kiện</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    Không tìm thấy sự kiện nào.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event) => (
                  <TableRow key={event.id} className={event.deleted_at ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{event.description || "-"}</TableCell>
                    <TableCell>{formatPrice(event.price)}</TableCell>
                    <TableCell>{event.created_at}</TableCell>
                    <TableCell>
                      {event.deleted_at ? (
                        <Badge variant="destructive">Đã xóa</Badge>
                      ) : (
                        <Badge variant="secondary">Hoạt động</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedEvent(event); setIsViewDialogOpen(true) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!event.deleted_at && (
                          <Button variant="ghost" size="sm" onClick={() => handleEditEvent(event)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteEvent(event.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chi tiết sự kiện</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 text-sm">
              <div><b>Tên:</b> {selectedEvent.name}</div>
              <div><b>Mô tả:</b> {selectedEvent.description || "Không có"}</div>
              <div><b>Giá:</b> {formatPrice(selectedEvent.price)}</div>
              <div>
                <b>Dịch vụ kèm theo:</b>
                {renderKeyValueList(selectedEvent.inclusions)}
              </div>
              <div>
                <b>Phụ kiện trang trí:</b>
                {renderKeyValueList(selectedEvent.decorations)}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa sự kiện</DialogTitle>
            <DialogDescription>Cập nhật thông tin gói sự kiện</DialogDescription>
          </DialogHeader>
          {renderEventForm(true)}
        </DialogContent>
      </Dialog>
    </div>
  )
}