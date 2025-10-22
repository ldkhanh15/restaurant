"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
    CalendarCheck,
    CircleUserRound,
    Instagram as Restaurant,
    UtensilsCrossed,
    Table,
} from "lucide-react"

const modules = [
    { id: "dashboard", label: "Tổng quan", icon: BarChart3 },
    { id: "users", label: "Người dùng", icon: Users },
    { id: "menu", label: "Thực đơn", icon: ChefHat },
    { id: "orders", label: "Đơn hàng", icon: ShoppingCart },
    { id: "reservations", label: "Đặt bàn", icon: Calendar },
    { id: "inventory", label: "Kho hàng", icon: Package },
    { id: "table", label: "Bàn/Sơ đồ bàn", icon: Table },
    { id: "employees", label: "Nhân viên", icon: UserCheck },
    { id: "event", label: "Sự kiện", icon: CalendarCheck },
    { id: "blog", label: "Blog", icon: FileText },
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "notifications", label: "Thông báo", icon: Bell },
    { id: "reviews", label: "Đánh giá", icon: Star },
    { id: "voucher-management", label: "Voucher", icon: Ticket },
    { id: "supplier", label: "Nhà cung cấp", icon: CircleUserRound },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
            <div className="p-6 border-b border-sidebar-border">
                <div className="flex items-center gap-2">
                    <UtensilsCrossed className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-xl font-bold text-sidebar-foreground">HIWELL</h1>
                        <p className="text-sm text-muted-foreground">Quản lý nhà hàng</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2 flex-1 flex flex-col overflow-scroll">
                {modules.map((module) => {
                    const Icon = module.icon
                    const href = `/${module.id}`
                    const isActive = pathname === href
                    return (
                        <Link key={module.id} href={href} className="w-full">
                            <Button
                                variant={isActive ? "default" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-3 h-11",
                                    isActive
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                {module.label}
                            </Button>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}

export default Sidebar


