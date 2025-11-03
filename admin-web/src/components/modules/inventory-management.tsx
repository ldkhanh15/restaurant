"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IngredientManagement } from "./ingredient-management"
import { ImportManagement } from "./inventoryimport"

interface Employee {
  id: string
  user: {
    full_name: string
  }
}

interface IngredientAttributes {
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

interface ImportIngredient {
  ingredient: {
    id: string
    name: string
    unit: string
  }
  quantity: number
  total_price: number
}

interface InventoryImportAttributes {
  id: string
  reason?: string
  total_price: number
  employee_id?: string
  employee?: Employee | null
  supplier_id?: string
  supplier?: Supplier
  timestamp?: Date
  ingredients?: ImportIngredient[]
}

interface InventoryImportIngredientAttributes {
  id: string
  ingredient_id?: string
  quantity: number
  total_price: number
  inventory_imports_id?: string
  ingredient?: {
    id: string
    name: string
    unit: string
  }
}

interface Supplier {
  id: string
  name: string
  email?: string
  contact?: string
  address?: string
}

interface PaginationResult<T> {
  items: T[]
  total: number
  page: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export function InventoryManagement() {
  const [ingredients, setIngredients] = useState<IngredientAttributes[]>([])

  return (
    <div className="space-y-6">
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory">Kho nguyên liệu</TabsTrigger>
          <TabsTrigger value="imports">Lịch sử nhập hàng</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <IngredientManagement ingredients={ingredients} setIngredients={setIngredients} />
        </TabsContent>
        <TabsContent value="imports">
          <ImportManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}