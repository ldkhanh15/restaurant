"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Users,
  ChefHat,
  ShoppingCart,
  Calendar,
  Package,
  UserCheck,
  FileText,
  MessageCircle,
  Bell,
  Star,
  Ticket,
  BarChart3,
  Instagram as Restaurant,
} from "lucide-react"

interface SidebarProps {
  activeModule: string
  onModuleChange: (module: string) => void
}

const modules = [
  { id: "dashboard", label: "Tổng quan", icon: BarChart3 },
  { id: "users", label: "Người dùng", icon: Users },
  { id: "menu", label: "Thực đơn", icon: ChefHat },
  { id: "orders", label: "Đơn hàng", icon: ShoppingCart },
  { id: "reservations", label: "Đặt bàn", icon: Calendar },
  { id: "inventory", label: "Kho hàng", icon: Package },
  { id: "employees", label: "Nhân viên", icon: UserCheck },
  { id: "blog", label: "Blog", icon: FileText },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "reviews", label: "Đánh giá", icon: Star },
  { id: "vouchers", label: "Voucher", icon: Ticket },
]

export function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Restaurant className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">
              HIWELL
            </h1>
            <p className="text-sm text-muted-foreground">Quản lý nhà hàng</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 flex-1 flex flex-col overflow-scroll">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Button
              key={module.id}
              variant={activeModule === module.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-11",
                activeModule === module.id
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              onClick={() => onModuleChange(module.id)}
            >
              <Icon className="h-5 w-5" />
              {module.label}
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
