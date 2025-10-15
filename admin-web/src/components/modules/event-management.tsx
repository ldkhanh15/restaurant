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
  inclusions?: Record<string, string>
  decorations?: Record<string, string>
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

  // 🔹 Load dữ liệu
  const getAllEvents = async () => {
    try {
      const response = await eventService.getAll()
      if (response && response.data.data) {
        const data = response.data.data?.data || response.data.data
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

  // 🔹 Lọc dữ liệu
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase())

    // Nếu bật "hiện đã xóa" => hiện tất cả, ngược lại chỉ hiện event chưa xóa
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

  const handleAddRow = (field: "inclusions" | "decorations") => {
    setNewEvent({
      ...newEvent,
      [field]: { ...newEvent[field], "": "" },
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
  }

  const handleCreateEvent = async () => {
    if (!newEvent.name.trim() || !newEvent.price) {
      toast.error("Vui lòng nhập đầy đủ thông tin!")
      return
    }

    const event: Event = {
      id: uuidv4(),
      name: newEvent.name,
      description: newEvent.description,
      price: Number(newEvent.price),
      inclusions: newEvent.inclusions,
      decorations: newEvent.decorations,
      created_at: new Date().toISOString().split("T")[0],
    }

    const response = await eventService.create(event)
    if (!response || response.status !== 201) {
      toast.error("Tạo sự kiện thất bại!")
      return
    }

    setEvents([...events, event])
    toast.success("Tạo sự kiện thành công!")

    resetForm()
    setIsCreateDialogOpen(false)
  }

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event)
    setNewEvent({
      name: event.name,
      description: event.description || "",
      price: event.price?.toString() || "",
      inclusions: event.inclusions || {},
      decorations: event.decorations || {},
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return

    const updatedEvent: Event = {
      ...selectedEvent,
      name: newEvent.name,
      description: newEvent.description,
      price: Number(newEvent.price),
      inclusions: newEvent.inclusions,
      decorations: newEvent.decorations,
    }

    const response = await eventService.update(selectedEvent.id, updatedEvent)
    if (!response || response.status !== 200) {
      toast.error("Cập nhật sự kiện thất bại!")
      return
    }

    setEvents(events.map(e => e.id === selectedEvent.id ? updatedEvent : e))
    toast.success("Cập nhật sự kiện thành công!")
    setIsEditDialogOpen(false)
    resetForm()
  }

  const handleDeleteEvent = async (eventId: string) => {
    const response = await eventService.remove(eventId)
    if (!response || response.status !== 200) {
      toast.error("Xóa sự kiện thất bại!")
      return
    }
    toast.success("Xóa sự kiện thành công!")
    setEvents(
      events.map((event) =>
        event.id === eventId
          ? { ...event, deleted_at: new Date().toISOString().split("T")[0] }
          : event
      )
    )
  }

  const renderEventForm = (isEdit = false) => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label>Tên sự kiện</Label>
        <Input
          value={newEvent.name}
          onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
          placeholder="Nhập tên sự kiện"
        />
      </div>
      <div className="grid gap-2">
        <Label>Mô tả</Label>
        <Input
          value={newEvent.description}
          onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
          placeholder="Nhập mô tả sự kiện"
        />
      </div>
      <div className="grid gap-2">
        <Label>Giá gói</Label>
        <Input
          type="number"
          value={newEvent.price}
          onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })}
          placeholder="Nhập giá gói"
        />
      </div>

      {/* Inclusions */}
      <div className="grid gap-2">
        <Label>Inclusions</Label>
        {Object.entries(newEvent.inclusions).map(([key, value], index) => (
          <div key={index} className="flex gap-2 items-center">
            <Input
              placeholder="Tên mục"
              value={key}
              onChange={(e) => handleKeyChange("inclusions", index, e.target.value)}
            />
            <Input
              placeholder="Giá trị"
              value={value}
              onChange={(e) => handleValueChange("inclusions", index, e.target.value)}
            />
            <Button variant="ghost" size="icon" onClick={() => handleDeleteRow("inclusions", index)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
        <Button variant="outline" onClick={() => handleAddRow("inclusions")}>
          + Thêm dòng
        </Button>
      </div>

      {/* Decorations */}
      <div className="grid gap-2">
        <Label>Decorations</Label>
        {Object.entries(newEvent.decorations).map(([key, value], index) => (
          <div key={index} className="flex gap-2 items-center">
            <Input
              placeholder="Tên mục"
              value={key}
              onChange={(e) => handleKeyChange("decorations", index, e.target.value)}
            />
            <Input
              placeholder="Giá trị"
              value={value}
              onChange={(e) => handleValueChange("decorations", index, e.target.value)}
            />
            <Button variant="ghost" size="icon" onClick={() => handleDeleteRow("decorations", index)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
        <Button variant="outline" onClick={() => handleAddRow("decorations")}>
          + Thêm dòng
        </Button>
      </div>

      <DialogFooter>
        <Button onClick={isEdit ? handleUpdateEvent : handleCreateEvent}>
          {isEdit ? "Cập nhật sự kiện" : "Tạo sự kiện"}
        </Button>
      </DialogFooter>
    </div>
  )

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

        {/* Dialog Thêm */}
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open)
            if (open) resetForm() // reset form mỗi khi mở create
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm sự kiện
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm sự kiện mới</DialogTitle>
              <DialogDescription>Tạo gói sự kiện mới</DialogDescription>
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
              {filteredEvents.map((event) => (
                <TableRow key={event.id} className={event.deleted_at ? "opacity-50" : ""}>
                  <TableCell>{event.name}</TableCell>
                  <TableCell>{event.description}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog xem chi tiết */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chi tiết sự kiện</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <p><b>Tên:</b> {selectedEvent.name}</p>
              <p><b>Mô tả:</b> {selectedEvent.description}</p>
              <p><b>Giá:</b> {formatPrice(selectedEvent.price)}</p>
              <div>
                <Label>Inclusions:</Label>
                <pre className="bg-muted p-2 rounded text-sm overflow-auto max-h-40">
                  {JSON.stringify(selectedEvent.inclusions, null, 2)}
                </pre>
              </div>
              <div>
                <Label>Decorations:</Label>
                <pre className="bg-muted p-2 rounded text-sm overflow-auto max-h-40">
                  {JSON.stringify(selectedEvent.decorations, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog chỉnh sửa */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa sự kiện</DialogTitle>
            <DialogDescription>Cập nhật thông tin sự kiện</DialogDescription>
          </DialogHeader>
          {renderEventForm(true)}
        </DialogContent>
      </Dialog>
    </div>
  )
}