import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

interface CreateReservationDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  selectedTable?: {
    id: string
    table_number: string
    capacity: number
  } | null
}

export function CreateReservationDialog({ 
  isOpen, 
  onOpenChange,
  onSuccess,
  selectedTable 
}: CreateReservationDialogProps) {
  const [availableTables, setAvailableTables] = useState<any[]>([])
  const [activeEvents, setActiveEvents] = useState<any[]>([])
  const [dishes, setDishes] = useState<any[]>([])
  const [selectedTableId, setSelectedTableId] = useState<string>("")
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [reservationTime, setReservationTime] = useState<string>("")
  const [numPeople, setNumPeople] = useState<number>(2)
  const [durationMinutes, setDurationMinutes] = useState<number>(120)
  const [notes, setNotes] = useState<string>("")
  const [preOrderItems, setPreOrderItems] = useState<Array<{ dish_id: string; quantity: number }>>([])
  const [isCreatingReservation, setIsCreatingReservation] = useState(false)

  // Load data when dialog opens and handle selected table
  useEffect(() => {
    if (!isOpen) return
    loadInitialData()
    
    // Fill selected table information if available
    if (selectedTable) {
      setSelectedTableId(selectedTable.id)
      setNumPeople(selectedTable.capacity) // Set default to table's capacity
    }
  }, [isOpen, selectedTable])

  const loadInitialData = async () => {
    try {
      const [tablesRes, eventsRes, dishesRes] = await Promise.all([
        api.tables.getAll(),
        api.events.getAll(),
        api.dishes.getAll()
      ])
      setAvailableTables((tablesRes as any).data || (tablesRes as any))
      setActiveEvents((eventsRes as any).data || (eventsRes as any))
      setDishes((dishesRes as any).data || (dishesRes as any))
    } catch (error) {
      console.error("Failed to load initial data:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu",
        variant: "destructive"
      })
    }
  }
  const addPreOrderItem = (dishId: string, quantity: number = 1) => {
    const existingIndex = preOrderItems.findIndex(item => item.dish_id === dishId)
    if (existingIndex >= 0) {
      const updated = [...preOrderItems]
      updated[existingIndex].quantity += quantity
      setPreOrderItems(updated)
    } else {
      setPreOrderItems([...preOrderItems, { dish_id: dishId, quantity }])
    }
  }

  const removePreOrderItem = (dishId: string) => {
    setPreOrderItems(preOrderItems.filter(item => item.dish_id !== dishId))
  }

  const updatePreOrderQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      removePreOrderItem(dishId)
      return
    }
    setPreOrderItems(
      preOrderItems.map(item =>
        item.dish_id === dishId ? { ...item, quantity } : item
      )
    )
  }

  const handleCreateReservation = async () => {
    if (!selectedTableId || !reservationTime) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn bàn và thời gian đặt bàn",
        variant: "destructive"
      })
      return
    }

    try {
      setIsCreatingReservation(true)
      const createData: any = {
        table_id: selectedTableId,
        reservation_time: new Date(reservationTime).toISOString(),
        duration_minutes: durationMinutes,
        num_people: numPeople
      }

      if (selectedEventId) {
        createData.event_id = selectedEventId
      }

      if (notes.trim()) {
        createData.preferences = { note: notes.trim() }
      }

      if (preOrderItems.length > 0) {
        createData.pre_order_items = preOrderItems
      }

      await api.reservations.create(createData)
      
      // Reset form
      setSelectedTableId("")
      setSelectedEventId("")
      setReservationTime("")
      setNumPeople(2)
      setDurationMinutes(120)
      setNotes("")
      setPreOrderItems([])
      
      onOpenChange(false)
      onSuccess?.()
      
      toast({
        title: "Thành công",
        description: "Tạo đặt bàn thành công"
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Lỗi",
        description: "Không thể tạo đặt bàn",
        variant: "destructive"
      })
    } finally {
      setIsCreatingReservation(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo đặt bàn mới</DialogTitle>
          <DialogDescription>
            Chọn bàn, thời gian và (tuỳ chọn) sự kiện cho đặt bàn.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Bàn</Label>
            {selectedTable ? (
              <div className="mt-1 p-2 bg-muted rounded-md">
                <p className="text-sm font-medium">Bàn {selectedTable.table_number} - {selectedTable.capacity} người</p>
              </div>
            ) : (
              <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn bàn" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      Bàn {t.table_number} - {t.capacity} người
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label>Thời gian</Label>
            <Input
              type="datetime-local"
              value={reservationTime}
              onChange={(e) => setReservationTime(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Số người</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={selectedTable?.capacity}
                  value={numPeople}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value < 1) {
                      setNumPeople(1);
                      return;
                    }
                    if (selectedTable && value > selectedTable.capacity) {
                      toast({
                        title: "Vượt quá sức chứa",
                        description: `Bàn ${selectedTable.table_number} chỉ có thể chứa tối đa ${selectedTable.capacity} người`,
                        variant: "destructive"
                      });
                      return;
                    }
                    setNumPeople(value);
                  }}
                  className="mt-1"
                />
                {selectedTable && (
                  <span className="text-sm text-muted-foreground mt-1">
                    / {selectedTable.capacity} người
                  </span>
                )}
              </div>
            </div>
            <div>
              <Label>Thời lượng (phút)</Label>
              <Input
                type="number"
                min={30}
                step={30}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Sự kiện (tuỳ chọn)</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Không chọn" />
              </SelectTrigger>
              <SelectContent>
                {activeEvents.map((ev: any) => (
                  <SelectItem key={ev.id} value={ev.id}>
                    {ev.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pre-order Items */}
          <div>
            <Label className="mb-2 block">Đặt món trước (tuỳ chọn)</Label>
            <div className="space-y-2">
              {preOrderItems.length > 0 && (
                <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  {preOrderItems.map((item) => {
                    const dish = dishes.find((d: any) => d.id === item.dish_id)
                    return (
                      <div key={item.dish_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{dish?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {dish?.price?.toLocaleString()}đ x {item.quantity} ={" "}
                              {(dish?.price * item.quantity)?.toLocaleString()}đ
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updatePreOrderQuantity(item.dish_id, Number(e.target.value))
                            }
                            className="w-20"
                            min={1}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePreOrderItem(item.dish_id)}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <Select onValueChange={(dishId) => addPreOrderItem(dishId, 1)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn món để đặt trước" />
                </SelectTrigger>
                <SelectContent>
                  {dishes
                    .filter(
                      (d: any) => !preOrderItems.some((item) => item.dish_id === d.id)
                    )
                    .map((dish: any) => (
                      <SelectItem key={dish.id} value={dish.id}>
                        {dish.name} - {dish.price?.toLocaleString()}đ
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Ghi chú / Yêu cầu đặc biệt (tuỳ chọn)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt..."
              className="mt-1"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleCreateReservation}
            disabled={isCreatingReservation || !selectedTableId || !reservationTime}
          >
            {isCreatingReservation ? "Đang tạo..." : "Tạo đặt bàn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}