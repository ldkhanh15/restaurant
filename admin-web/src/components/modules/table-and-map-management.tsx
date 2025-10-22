"use client"

import { useState } from "react"
import { TableMapManagement } from "./table-map-management"
import { TableManagement } from "./table-management"
import { TableGroupManagement } from "./table-group-management"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Plus } from "lucide-react"

interface TableAttributes {
  id: string
  table_number: string
  capacity: number
  deposit: number
  cancel_minutes: number
  location?: {
    area?: string
    floor?: number
    coordinates?: { x?: number; y?: number }
  } | null
  status: "available" | "occupied" | "cleaning" | "reserved"
  panorama_urls?: any
  amenities?: any
  description?: string
  created_at?: Date | string
  updated_at?: Date | string
  deleted_at?: Date | null
}

interface TableGroupAttributes {
  id: string
  group_name: string
  table_ids: any
  total_capacity: number
  deposit: number
  cancel_minutes: number
  status: "available" | "occupied" | "cleaning" | "reserved"
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

export function TableAndMapManagement() {
  const [tables, setTables] = useState<TableAttributes[]>([])
  const [tableGroups, setTableGroups] = useState<TableGroupAttributes[]>([])
  const [isCreateTableDialogOpen, setIsCreateTableDialogOpen] = useState(false)

  const stats = {
    totalTables: tables.length,
    availableTables: tables.filter((t) => t.status === "available").length,
    occupiedTables: tables.filter((t) => t.status === "occupied").length,
    reservedTables: tables.filter((t) => t.status === "reserved").length,
    cleaningTables: tables.filter((t) => t.status === "cleaning").length,
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng số bàn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTables}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bàn trống</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.availableTables}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bàn có khách</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.occupiedTables}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bàn đã đặt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.reservedTables}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bàn đang dọn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.cleaningTables}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for switching between views */}
      <Tabs defaultValue="tables" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tables">Danh sách bàn</TabsTrigger>
          <TabsTrigger value="management">Quản lý bàn & nhóm</TabsTrigger>
          <TabsTrigger value="layout">Sơ đồ bàn</TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Quản lý bàn</h3>
            <Button 
              onClick={() => {
                console.log("Opening create table dialog from table-and-map-management")
                setIsCreateTableDialogOpen(true)
              }}
              variant="default"
              size="default"
            >
              <Plus className="h-5 w-5 mr-2" />
              Thêm bàn mới
            </Button>
          </div>
          <TableManagement
            tables={tables}
            setTables={setTables}
            isCreateTableDialogOpen={isCreateTableDialogOpen}
            setIsCreateTableDialogOpen={setIsCreateTableDialogOpen}
          />
        </TabsContent>

        <TabsContent value="management">
          <Tabs defaultValue="table-groups" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="table-groups">Nhóm bàn</TabsTrigger>
              <TabsTrigger value="tables">Bàn</TabsTrigger>
            </TabsList>
            <TabsContent value="table-groups">
              <TableGroupManagement
                tableGroups={tableGroups}
                setTableGroups={setTableGroups}
              />
            </TabsContent>
            <TabsContent value="tables">
              <TableManagement
                tables={tables}
                setTables={setTables}
                isCreateTableDialogOpen={isCreateTableDialogOpen}
                setIsCreateTableDialogOpen={setIsCreateTableDialogOpen}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="layout">
          <TableMapManagement
            tables={tables as any}
            setTables={setTables}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}