"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge, Package } from "lucide-react"
import { useState } from "react"

interface Ingredient {
  id: string
  name: string
  unit: string
  barcode?: string
  rfid?: string
  min_stock_level: number
  current_stock: number
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

interface InventoryImport {
  id: number
  reason: string
  total_price: number
  employee_id: number
  employee_name: string
  supplier_id?: number
  supplier_name?: string
  import_date: string
  status: "pending" | "completed" | "cancelled"
  items: ImportItem[]
}

interface ImportItem {
  ingredient_id: number
  ingredient_name: string
  quantity: number
  unit_price: number
  total_price: number
}

interface ImportManagementProps {
  imports: InventoryImport[]
  ingredients: Ingredient[]
}

export function ImportManagement({ imports, ingredients }: ImportManagementProps) {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Nhập hàng
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nhập hàng mới</DialogTitle>
              <DialogDescription>Tạo phiếu nhập hàng mới</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="import-reason">Lý do nhập</Label>
                  <Input id="import-reason" placeholder="Nhập hàng định kỳ" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="supplier">Nhà cung cấp</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn nhà cung cấp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Công ty Thịt Sạch ABC</SelectItem>
                      <SelectItem value="2">Nhà máy Bánh Phở Hà Nội</SelectItem>
                      <SelectItem value="3">Nông trại Xanh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Nguyên liệu nhập</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-4 gap-2 text-sm font-medium">
                    <span>Nguyên liệu</span>
                    <span>Số lượng</span>
                    <span>Đơn giá</span>
                    <span>Thành tiền</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn nguyên liệu" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map((ingredient) => (
                          <SelectItem key={ingredient.id} value={ingredient.id.toString()}>
                            {ingredient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="0" />
                    <Input type="number" placeholder="0" />
                    <Input type="number" placeholder="0" disabled />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Tạo phiếu nhập</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử nhập hàng</CardTitle>
          <CardDescription>Theo dõi các lần nhập hàng vào kho</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã phiếu</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Nhà cung cấp</TableHead>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Ngày nhập</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.map((importRecord) => (
                <TableRow key={importRecord.id}>
                  <TableCell className="font-medium">#{importRecord.id}</TableCell>
                  <TableCell>{importRecord.reason}</TableCell>
                  <TableCell>{importRecord.supplier_name || "Nhiều nhà cung cấp"}</TableCell>
                  <TableCell>{importRecord.employee_name}</TableCell>
                  <TableCell>{new Date(importRecord.import_date).toLocaleDateString("vi-VN")}</TableCell>
                  <TableCell className="font-medium">{importRecord.total_price.toLocaleString("vi-VN")}đ</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        importRecord.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : importRecord.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }
                    >
                      {importRecord.status === "completed"
                        ? "Hoàn thành"
                        : importRecord.status === "pending"
                          ? "Đang xử lý"
                          : "Đã hủy"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}