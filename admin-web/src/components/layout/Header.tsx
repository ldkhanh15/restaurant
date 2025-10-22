"use client"

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const moduleNames: Record<string, string> = {
  dashboard: "Tổng quan",
  users: "Quản lý người dùng",
  menu: "Quản lý thực đơn",
  orders: "Quản lý đơn hàng",
  reservations: "Quản lý đặt bàn",
  inventory: "Quản lý kho hàng",
  employees: "Quản lý nhân viên",
  blog: "Quản lý blog",
  chat: "Hệ thống chat",
  notifications: "Trung tâm thông báo",
  reviews: "Đánh giá & khiếu nại",
  vouchers: "Quản lý voucher",
  table:"Quản lý bàn/sơ đồ bàn",
  supplier:"Quản lý nhà cung cấp",
  event:"Quản lý sự kiện"
}

export function Header() {
  const pathname = usePathname()
  const current = pathname?.split("/")[1] || "dashboard"
  const title = moduleNames[current] || "Tổng quan"

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-card-foreground">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <span className="text-lg">🔔</span>
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/admin-avatar.png" alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Admin User</p>
                <p className="text-xs leading-none text-muted-foreground">admin@restaurant.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span className="mr-2 text-sm">👤</span>
              <span>Hồ sơ</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span className="mr-2 text-sm">⚙️</span>
              <span>Cài đặt</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span className="mr-2 text-sm">↗️</span>
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default Header


