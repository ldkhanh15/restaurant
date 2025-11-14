"use client";

import { useEffect, useState } from "react";
import userApi from "../../services/userServer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Edit, Trash2, Eye, Filter } from "lucide-react";
import { toast } from "react-toastify";
import { userRoles } from "@/lib/constants";
import mailService from "../../services/mailService";

interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: "customer" | "employee" | "admin";
  full_name: string;
  preferences?: any;
  ranking: "regular" | "vip" | "platinum";
  points: number;
  created_at: Date;
  deleted_at?: Date;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [rankingFilter, setRankingFilter] = useState<string>("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.username?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user?.role === roleFilter;
    const matchesRanking =
      rankingFilter === "all" || user?.ranking === rankingFilter;
    const matchesDeleted = showDeleted ? true : !user?.deleted_at;

    return matchesSearch && matchesRole && matchesRanking && matchesDeleted;
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  // CRUD users
  const fetchUsers = async () => {
    try {
      const response = await userApi.getAllUsers();
      console.log("Fetched users:", response.data);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleCreateUser = async (newUser: Partial<User>) => {
    try {
      console.log("Creating user:", newUser);
      
      // Tạo user trong database
      const response = await userApi.createUser(newUser);
      const createdUser = response.data;
      
      toast.success("Tạo người dùng thành công");
      
      // Gửi email thông báo tài khoản mới
      if (newUser.email && newUser.username) {
        try {
          console.log("Gửi email thông báo tài khoản đến:", newUser.email);
          
          await mailService.sendAccountEmail(
            newUser.email, 
            newUser.username, 
            "123456" // Mật khẩu mặc định
          );
          
          toast.success(
            `✅ Đã gửi thông tin tài khoản đến email: ${newUser.email}`,
            { autoClose: 5000 }
          );
        } catch (emailError) {
          console.error("Lỗi gửi email:", emailError);
          
          // Hiển thị cảnh báo nhưng vẫn coi như tạo user thành công
          const errorMessage = emailError instanceof Error 
            ? emailError.message 
            : "Không thể gửi email thông báo";
            
          toast.warn(
            `⚠️ Tạo user thành công nhưng ${errorMessage}. Vui lòng thông báo thông tin đăng nhập cho người dùng thủ công.`,
            { autoClose: 8000 }
          );
        }
      } else {
        toast.warn("⚠️ Thiếu email hoặc username. Không thể gửi thông báo tài khoản.");
      }
      
      // Refresh danh sách users
      fetchUsers();
      setIsEditDialogOpen(false);
      setIsCreateDialogOpen(false);
      
    } catch (error) {
      console.error("Lỗi tạo người dùng:", error);
      toast.error("Không thể tạo người dùng. Vui lòng thử lại.");
    }
  };

  const handleUpdateUser = async (
    userId: number,
    updatedData: Partial<User>
  ) => {
    try {
      console.log("Updating user:", userId, updatedData);
      await userApi.updateUser(userId.toString(), updatedData);
      toast.success("Update user successfully");
      fetchUsers();
      setIsEditDialogOpen(false);
      setIsCreateDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await userApi.deleteUser(userId);
      toast.success("Delete user successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "employee":
        return "bg-blue-100 text-blue-800";
      case "customer":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRankingBadgeColor = (ranking: string) => {
    switch (ranking) {
      case "platinum":
        return "bg-purple-100 text-purple-800";
      case "vip":
        return "bg-yellow-100 text-yellow-800";
      case "regular":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleRestoreUser = (userId: number) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, deleted_at: undefined } : user
      )
    );
  };

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
        </div>

        <Dialog
          open={isCreateDialogOpen || isEditDialogOpen}
          onOpenChange={(open) => {
            if (open === false) {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="whitespace-nowrap"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm người dùng
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                if (isEditDialogOpen && selectedUser) {
                  const dataUpdated = {
                    full_name: formData.get("fullname") as string,
                    username: formData.get("username") as string,
                    email: formData.get("email") as string,
                    phone: formData.get("phone") as string,
                    role: formData.get("role") as any,
                  };
                  console.log("Data to update:", dataUpdated);
                  handleUpdateUser(selectedUser.id, dataUpdated);
                } else {
                  const dataCreated = {
                    full_name: formData.get("fullname") as string,
                    username: formData.get("username") as string,
                    email: formData.get("email") as string,
                    phone: formData.get("phone") as string,
                    role: formData.get("role") as any,
                  };
                  handleCreateUser(dataCreated);
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>
                  {isCreateDialogOpen
                    ? "Thêm người dùng"
                    : "Chỉnh sửa người dùng"}
                </DialogTitle>
                <DialogDescription>
                  {isCreateDialogOpen
                    ? "Tạo tài khoản người dùng mới trong hệ thống. Mật khẩu mặc định sẽ được gửi qua email."
                    : "Chỉnh sửa thông tin người dùng"}
                </DialogDescription>
                
                {/* Thông báo mật khẩu mặc định khi tạo user mới */}
                {isCreateDialogOpen && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                    <div className="flex items-start gap-2">
                      <div className="text-blue-500 mt-0.5">
                        ℹ️
                      </div>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Thông tin tài khoản:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Mật khẩu mặc định: <strong>123456</strong></li>
                          <li>Thông tin đăng nhập sẽ được gửi qua email</li>
                          <li>Người dùng nên đổi mật khẩu sau lần đăng nhập đầu tiên</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullname">Họ và tên</Label>
                  <Input
                    id="fullname"
                    name="fullname"
                    required
                    defaultValue={
                      isEditDialogOpen && selectedUser
                        ? selectedUser.full_name
                        : ""
                    }
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username">Tên đăng nhập</Label>
                  <Input
                    id="username"
                    name="username"
                    required
                    defaultValue={
                      isEditDialogOpen && selectedUser
                        ? selectedUser.username
                        : ""
                    }
                    placeholder="Nhập tên đăng nhập"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    required
                    defaultValue={
                      isEditDialogOpen && selectedUser ? selectedUser.email : ""
                    }
                    placeholder="Nhập email"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={
                      isEditDialogOpen && selectedUser ? selectedUser.phone : ""
                    }
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Vai trò</Label>
                  <Select
                    name="role"
                    defaultValue={
                      isEditDialogOpen && selectedUser ? selectedUser.role : ""
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      {userRoles.map((role) => (
                        <SelectItem key={role.key} value={role.key}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {isCreateDialogOpen
                    ? "Tạo người dùng"
                    : "Cập nhật người dùng"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
          <CardDescription>
            Quản lý thông tin người dùng trong hệ thống ({filteredUsers?.length}{" "}
            người dùng)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ và tên</TableHead>
                <TableHead>Tên đăng nhập</TableHead>
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
              {filteredUsers?.map((user) => (
                <TableRow
                  key={user.id}
                  className={user.deleted_at ? "opacity-50" : ""}
                >
                  <TableCell className="font-medium">
                    {user.full_name}
                  </TableCell>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role === "customer"
                        ? "Khách hàng"
                        : user.role === "employee"
                        ? "Nhân viên"
                        : "Quản trị"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRankingBadgeColor(user.ranking)}>
                      {user.ranking === "regular"
                        ? "Thường"
                        : user.ranking === "vip"
                        ? "VIP"
                        : "Platinum"}
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
                      {!user.deleted_at && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Bạn có chắc chắn muốn xóa người dùng ${user.username}?`
                                )
                              ) {
                                handleDeleteUser(user.id.toString());
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
