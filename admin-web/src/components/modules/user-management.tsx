"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { Search, Plus, Edit, Trash2, Eye, Filter } from "lucide-react"

interface User {
  id: number
  username: string
  email: string
  phone: string
  role: "customer" | "employee" | "admin"
  full_name: string
  ranking: "regular" | "vip" | "platinum"
  points: number
  created_at: string
  deleted_at?: string
  preferences?: any
}

const mockUsers: User[] = [
  {
    id: 1,
    username: "nguyenvana",
    email: "nguyenvana@email.com",
    phone: "0901234567",
    role: "customer",
    full_name: "Nguyễn Văn A",
    ranking: "vip",
    points: 1250,
    created_at: "2024-01-15",
    preferences: { dietary: "vegetarian", notifications: true },
  },
  {
    id: 2,
    username: "tranthib",
    email: "tranthib@email.com",
    phone: "0907654321",
    role: "customer",
    full_name: "Trần Thị B",
    ranking: "platinum",
    points: 2800,
    created_at: "2024-02-20",
  },
  {
    id: 3,
    username: "lequanc",
    email: "lequanc@email.com",
    phone: "0912345678",
    role: "employee",
    full_name: "Lê Quân C",
    ranking: "regular",
    points: 0,
    created_at: "2024-03-10",
  },
  {
    id: 4,
    username: "phamthid",
    email: "phamthid@email.com",
    phone: "0923456789",
    role: "customer",
    full_name: "Phạm Thị D",
    ranking: "regular",
    points: 450,
    created_at: "2024-03-25",
    deleted_at: "2024-04-01",
  },
]

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [rankingFilter, setRankingFilter] = useState<string>("all")
  const [showDeleted, setShowDeleted] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesRanking = rankingFilter === "all" || user.ranking === rankingFilter
    const matchesDeleted = showDeleted ? true : !user.deleted_at

    return matchesSearch && matchesRole && matchesRanking && matchesDeleted
  })

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "employee":
        return "bg-blue-100 text-blue-800"
      case "customer":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRankingBadgeColor = (ranking: string) => {
    switch (ranking) {
      case "platinum":
        return "bg-purple-100 text-purple-800"
      case "vip":
        return "bg-yellow-100 text-yellow-800"
      case "regular":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleDeleteUser = (userId: number) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, deleted_at: new Date().toISOString().split("T")[0] } : user,
      ),
    )
  }

  const handleRestoreUser = (userId: number) => {
    setUsers(users.map((user) => (user.id === userId ? { ...user, deleted_at: undefined } : user)))
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Tìm kiếm người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              <SelectItem value="customer">Khách hàng</SelectItem>
              <SelectItem value="employee">Nhân viên</SelectItem>
              <SelectItem value="admin">Quản trị</SelectItem>
            </SelectContent>
          </Select>

          <Select value={rankingFilter} onValueChange={setRankingFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Hạng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả hạng</SelectItem>
              <SelectItem value="regular">Thường</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
              <SelectItem value="platinum">Platinum</SelectItem>
            </SelectContent>
          </Select>

          <Button variant={showDeleted ? "default" : "outline"} onClick={() => setShowDeleted(!showDeleted)}>
            <Filter className="h-4 w-4 mr-2" />
            {showDeleted ? "Ẩn đã xóa" : "Hiện đã xóa"}
          </Button>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm người dùng
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm người dùng mới</DialogTitle>
              <DialogDescription>Tạo tài khoản người dùng mới trong hệ thống</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="fullname">Họ và tên</Label>
                <Input id="fullname" placeholder="Nhập họ và tên" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input id="username" placeholder="Nhập tên đăng nhập" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Nhập email" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" placeholder="Nhập số điện thoại" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Vai trò</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Khách hàng</SelectItem>
                    <SelectItem value="employee">Nhân viên</SelectItem>
                    <SelectItem value="admin">Quản trị</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Tạo người dùng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
          <CardDescription>
            Quản lý thông tin người dùng trong hệ thống ({filteredUsers.length} người dùng)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ và tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Hạng</TableHead>
                <TableHead>Điểm</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className={user.deleted_at ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role === "customer" ? "Khách hàng" : user.role === "employee" ? "Nhân viên" : "Quản trị"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRankingBadgeColor(user.ranking)}>
                      {user.ranking === "regular" ? "Thường" : user.ranking === "vip" ? "VIP" : "Platinum"}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.points.toLocaleString()}</TableCell>
                  <TableCell>
                    {user.deleted_at ? (
                      <Badge variant="destructive">Đã xóa</Badge>
                    ) : (
                      <Badge variant="secondary">Hoạt động</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user)
                          setIsViewDialogOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!user.deleted_at && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {user.deleted_at && (
                        <Button variant="ghost" size="sm" onClick={() => handleRestoreUser(user.id)}>
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

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thông tin người dùng</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Họ và tên</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.full_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tên đăng nhập</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.username}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Số điện thoại</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Vai trò</Label>
                  <Badge className={getRoleBadgeColor(selectedUser.role)}>
                    {selectedUser.role === "customer"
                      ? "Khách hàng"
                      : selectedUser.role === "employee"
                        ? "Nhân viên"
                        : "Quản trị"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Hạng</Label>
                  <Badge className={getRankingBadgeColor(selectedUser.ranking)}>
                    {selectedUser.ranking === "regular"
                      ? "Thường"
                      : selectedUser.ranking === "vip"
                        ? "VIP"
                        : "Platinum"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Điểm tích lũy</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.points.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Ngày tạo</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.created_at}</p>
                </div>
              </div>
              {selectedUser.preferences && (
                <div>
                  <Label className="text-sm font-medium">Sở thích</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <pre className="text-xs text-muted-foreground">
                      {JSON.stringify(selectedUser.preferences, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
