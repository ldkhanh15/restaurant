"use client"

import { useState } from "react" 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card" 
import { Button } from "@/components/ui/button" 
import { Input } from "@/components/ui/input" 
import { Label } from "@/components/ui/label"
 import { Badge } from "@/components/ui/badge" 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table" 
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog" 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" 
import { Search, Plus, Edit, Trash2, Eye, Filter } from "lucide-react"

interface Event {
  id: string
  name: string
  description?: string
  price?: number
  inclusions?: {
    items: string[]
    services: string[]
  }
  decorations?: {
    theme: string
    items: string[]
  }
  created_at: string
  deleted_at?: string
}

const mockEvents: Event[] = [
  {
    id: "1",
    name: "Tiệc Cưới Cổ Điển",
    description: "Gói tiệc cưới truyền thống với không gian sang trọng",
    price: 50000000,
    inclusions: {
      items: ["Thực đơn 8 món", "Rượu vang", "Bánh cưới 3 tầng"],
      services: ["MC", "Âm thanh ánh sáng", "Trang trí cổng hoa"]
    },
    decorations: {
      theme: "Cổ điển",
      items: ["Hoa tươi", "Nến trang trí", "Thảm đỏ"]
    },
    created_at: "2024-01-15",
  },
  {
    id: "2",
    name: "Tiệc Sinh Nhật Trẻ Em",
    description: "Gói tiệc sinh nhật vui nhộn cho bé",
    price: 15000000,
    inclusions: {
      items: ["Bánh sinh nhật", "Nước ngọt", "Đồ ăn nhẹ"],
      services: ["Chương trình hoạt náo", "Trang trí bóng bay"]
    },
    decorations: {
      theme: "Hoạt hình",
      items: ["Bóng bay", "Banner", "Confetti"]
    },
    created_at: "2024-02-20",
  },
  {
    id: "3",
    name: "Hội Nghị Doanh Nghiệp",
    description: "Gói tổ chức hội nghị chuyên nghiệp",
    price: 35000000,
    inclusions: {
      items: ["Coffee break", "Bữa trưa buffet", "Tài liệu hội nghị"],
      services: ["Âm thanh hội nghị", "Máy chiếu", "Lễ tân"]
    },
    decorations: {
      theme: "Hiện đại",
      items: ["Backdrop", "Bảng tên", "Hoa trang trí"]
    },
    created_at: "2024-03-10",
  },
  {
    id: "4",
    name: "Tiệc Tất Niên",
    description: "Gói tiệc cuối năm cho doanh nghiệp",
    price: 40000000,
    inclusions: {
      items: ["Thực đơn buffet", "Rượu bia", "Quà tặng"],
      services: ["Ca nhạc", "Games tương tác", "Quay phim chụp ảnh"]
    },
    decorations: {
      theme: "Năm mới",
      items: ["Đèn trang trí", "Hoa tươi", "Banner chúc mừng"]
    },
    created_at: "2024-03-25",
    deleted_at: "2024-04-01",
  },
]

export function EventManagement() {
  const [events, setEvents] = useState<Event[]>(mockEvents)
  const [searchTerm, setSearchTerm] = useState("")
  const [showDeleted, setShowDeleted] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
    price: "",
    inclusions: { items: [] as string[], services: [] as string[] },
    decorations: { theme: "", items: [] as string[] },
  })
  const [tempTag, setTempTag] = useState("")

  const handleAddTag = (section: "inclusions" | "decorations", field: "items" | "services", value: string) => {
    if (!value.trim()) return
    setNewEvent((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...(prev[section] as any)[field], value.trim()],
      },
    }))
  }

  const handleRemoveTag = (section: "inclusions" | "decorations", field: "items" | "services", tag: string) => {
    setNewEvent((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...(prev[section] as any)[field]].filter((t:any) => t !== tag),
      },
    }))
  }

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDeleted = showDeleted ? true : !event.deleted_at
    return matchesSearch && matchesDeleted
  })

  const formatPrice = (price?: number) => {
    if (!price) return "Chưa có giá"
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
  }

  const handleCreateEvent = () => {
    const event: Event = {
      id: (events.length + 1).toString(),
      name: newEvent.name,
      description: newEvent.description,
      price: Number(newEvent.price),
      inclusions: newEvent.inclusions,
      decorations: newEvent.decorations,
      created_at: new Date().toISOString().split("T")[0],
    }
    setEvents([...events, event])
    setNewEvent({
      name: "",
      description: "",
      price: "",
      inclusions: { items: [], services: [] },
      decorations: { theme: "", items: [] },
    })
    setIsCreateDialogOpen(false)
  }

  const handleDeleteEvent = (eventId: string) => {
    setEvents(
      events.map((event) =>
        event.id === eventId ? { ...event, deleted_at: new Date().toISOString().split("T")[0] } : event,
      ),
    )
  }

  const handleRestoreEvent = (eventId: string) => {
    setEvents(events.map((event) => (event.id === eventId ? { ...event, deleted_at: undefined } : event)))
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
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

          <Button variant={showDeleted ? "default" : "outline"} onClick={() => setShowDeleted(!showDeleted)}>
            <Filter className="h-4 w-4 mr-2" />
            {showDeleted ? "Ẩn đã xóa" : "Hiện đã xóa"}
          </Button>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm sự kiện
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Thêm sự kiện mới</DialogTitle>
              <DialogDescription>Tạo gói sự kiện mới trong hệ thống</DialogDescription>
            </DialogHeader>

            {/* FORM TẠO SỰ KIỆN */}
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Tên sự kiện</Label>
                <Input
                  value={newEvent.name}
                  onChange={(e:any) => setNewEvent({ ...newEvent, name: e.target.value })}
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

              {/* Phụ kiện đi kèm */}
              <div className="grid gap-2">
                <Label>Phụ kiện (vật phẩm)</Label>
                <div className="flex flex-wrap gap-2">
                  {newEvent.inclusions.items.map((item, i) => (
                    <Badge key={i} variant="secondary" onClick={() => handleRemoveTag("inclusions", "items", item)} className="cursor-pointer">
                      {item} ✕
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Nhập vật phẩm và nhấn Enter"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag("inclusions", "items", (e.target as HTMLInputElement).value)
                      ;(e.target as HTMLInputElement).value = ""
                    }
                  }}
                />
              </div>

              <div className="grid gap-2">
                <Label>Dịch vụ đi kèm</Label>
                <div className="flex flex-wrap gap-2">
                  {newEvent.inclusions.services.map((sv, i) => (
                    <Badge key={i} variant="secondary" onClick={() => handleRemoveTag("inclusions", "services", sv)} className="cursor-pointer">
                      {sv} ✕
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Nhập dịch vụ và nhấn Enter"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag("inclusions", "services", (e.target as HTMLInputElement).value)
                      ;(e.target as HTMLInputElement).value = ""
                    }
                  }}
                />
              </div>

              {/* Trang trí */}
              <div className="grid gap-2">
                <Label>Chủ đề trang trí</Label>
                <Input
                  placeholder="Nhập chủ đề (ví dụ: Cổ điển)"
                  value={newEvent.decorations.theme}
                  onChange={(e) => setNewEvent({
                    ...newEvent,
                    decorations: { ...newEvent.decorations, theme: e.target.value },
                  })}
                />
              </div>

              <div className="grid gap-2">
                <Label>Vật phẩm trang trí</Label>
                <div className="flex flex-wrap gap-2">
                  {newEvent.decorations.items.map((item, i) => (
                    <Badge key={i} variant="secondary" onClick={() => handleRemoveTag("decorations", "items", item)} className="cursor-pointer">
                      {item} ✕
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Nhập vật phẩm trang trí và nhấn Enter"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag("decorations", "items", (e.target as HTMLInputElement).value)
                      ;(e.target as HTMLInputElement).value = ""
                    }
                  }}
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleCreateEvent}>Tạo sự kiện</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table hiển thị sự kiện */}
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
                <TableHead>Chủ đề</TableHead>
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
                  <TableCell><Badge variant="outline">{event.decorations?.theme}</Badge></TableCell>
                  <TableCell>{event.created_at}</TableCell>
                  <TableCell>
                    {event.deleted_at
                      ? <Badge variant="destructive">Đã xóa</Badge>
                      : <Badge variant="secondary">Hoạt động</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedEvent(event); setIsViewDialogOpen(true) }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!event.deleted_at && (
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteEvent(event.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {event.deleted_at && (
                        <Button variant="ghost" size="sm" onClick={() => handleRestoreEvent(event.id)}>
                          Khôi phục
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Chi tiết sự kiện</DialogTitle></DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <p><b>Tên:</b> {selectedEvent.name}</p>
              <p><b>Mô tả:</b> {selectedEvent.description}</p>
              <p><b>Giá:</b> {formatPrice(selectedEvent.price)}</p>
              <p><b>Chủ đề:</b> {selectedEvent.decorations?.theme}</p>
              <div>
                <Label>Phụ kiện:</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedEvent.inclusions?.items.map((i, idx) => (
                    <Badge key={idx} variant="outline">{i}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label>Dịch vụ:</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedEvent.inclusions?.services.map((s, idx) => (
                    <Badge key={idx} variant="outline">{s}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label>Trang trí:</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedEvent.decorations?.items.map((d, idx) => (
                    <Badge key={idx} variant="outline">{d}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
