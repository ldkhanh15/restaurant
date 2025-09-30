"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { UserManagement } from "@/components/modules/user-management"
import { MenuManagement } from "@/components/modules/menu-management"
import { OrderManagement } from "@/components/modules/order-management"
import { ReservationManagement } from "@/components/modules/reservation-management"
import { InventoryManagement } from "@/components/modules/inventory-management"
import { EmployeeManagement } from "@/components/modules/employee-management"
import { BlogManagement } from "@/components/modules/blog-management"
import { ChatSystem } from "@/components/modules/chat-system"
import { NotificationCenter } from "@/components/modules/notification-center"
import { ReviewsComplaints } from "@/components/modules/reviews-complaints"
import { VoucherManagement } from "@/components/modules/voucher-management"
import { Dashboard } from "@/components/modules/dashboard"

export default function RestaurantManagement() {
  const [activeModule, setActiveModule] = useState("dashboard")

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <Dashboard />
      case "users":
        return <UserManagement />
      case "menu":
        return <MenuManagement />
      case "orders":
        return <OrderManagement />
      case "reservations":
        return <ReservationManagement />
      case "inventory":
        return <InventoryManagement />
      case "employees":
        return <EmployeeManagement />
      case "blog":
        return <BlogManagement />
      case "chat":
        return <ChatSystem />
      case "notifications":
        return <NotificationCenter />
      case "reviews":
        return <ReviewsComplaints />
      case "vouchers":
        return <VoucherManagement />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        <Header activeModule={activeModule} />
        <main className="flex-1 overflow-y-auto p-6">{renderModule()}</main>
      </div>
    </div>
  )
}
