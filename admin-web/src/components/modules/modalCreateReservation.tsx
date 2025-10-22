import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

interface ReservationAttributes {
  id: string
  user_id?: string
  table_id?: string
  table_group_id?: string
  reservation_time: Date
  duration_minutes: number
  num_people: number
  preferences?: any
  event_id?: string
  event_fee?: number
  status: "pending" | "confirmed" | "cancelled" | "no_show"
  timeout_minutes: number
  confirmation_sent: boolean
  deposit_amount?: number
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

interface CreateReservationDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCreateReservation: (data: Partial<ReservationAttributes>) => void
}

export function CreateReservationDialog({ 
  isOpen, 
  onOpenChange, 
  onCreateReservation 
}: CreateReservationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo đặt chỗ mới</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const preferences = formData.get("preferences")?.toString()
            const newReservation: Partial<ReservationAttributes> = {
              user_id: formData.get("user_id") as string,
              table_id: formData.get("table_id") as string,
              table_group_id: formData.get("table_group_id") as string,
              reservation_time: new Date(formData.get("reservation_time") as string),
              duration_minutes: Number(formData.get("duration_minutes")),
              num_people: Number(formData.get("num_people")),
              preferences: preferences ? JSON.parse(preferences) : undefined,
              event_id: formData.get("event_id") as string,
              event_fee: Number(formData.get("event_fee")),
              status: formData.get("status") as "pending" | "confirmed" | "cancelled" | "no_show",
              timeout_minutes: Number(formData.get("timeout_minutes")),
              confirmation_sent: formData.get("confirmation_sent") === "true",
              deposit_amount: Number(formData.get("deposit_amount")),
            }
            onCreateReservation(newReservation)
          }}
        >
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user_id">ID Người dùng</Label>
              <Input 
                id="user_id" 
                name="user_id" 
                placeholder="Nhập ID người dùng" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="table_id">ID Bàn</Label>
              <Input 
                id="table_id" 
                name="table_id" 
                placeholder="Nhập ID bàn" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="table_group_id">ID Nhóm Bàn</Label>
              <Input 
                id="table_group_id" 
                name="table_group_id" 
                placeholder="Nhập ID nhóm bàn" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reservation_time">Thời gian đặt chỗ</Label>
              <Input 
                id="reservation_time" 
                name="reservation_time" 
                type="datetime-local" 
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration_minutes">Thời gian (phút)</Label>
              <Input 
                id="duration_minutes" 
                name="duration_minutes" 
                type="number" 
                placeholder="Nhập thời gian (phút)" 
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="num_people">Số người</Label>
              <Input 
                id="num_people" 
                name="num_people" 
                type="number" 
                placeholder="Nhập số người" 
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="preferences">Yêu cầu đặc biệt</Label>
              <Input 
                id="preferences" 
                name="preferences" 
                placeholder="Nhập yêu cầu đặc biệt (JSON)" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event_id">ID Sự kiện</Label>
              <Input 
                id="event_id" 
                name="event_id" 
                placeholder="Nhập ID sự kiện" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event_fee">Phí sự kiện (VNĐ)</Label>
              <Input 
                id="event_fee" 
                name="event_fee" 
                type="number" 
                placeholder="Nhập phí sự kiện" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select name="status" defaultValue="pending">
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Đang chờ</SelectItem>
                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                  <SelectItem value="no_show">Không đến</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timeout_minutes">Thời gian chờ (phút)</Label>
              <Input 
                id="timeout_minutes" 
                name="timeout_minutes" 
                type="number" 
                placeholder="Nhập thời gian chờ" 
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmation_sent">Đã gửi xác nhận</Label>
              <Select name="confirmation_sent" defaultValue="false">
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái xác nhận" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Đã gửi</SelectItem>
                  <SelectItem value="false">Chưa gửi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deposit_amount">Số tiền cọc (VNĐ)</Label>
              <Input 
                id="deposit_amount" 
                name="deposit_amount" 
                type="number" 
                placeholder="Nhập số tiền cọc" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Tạo đặt chỗ</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}