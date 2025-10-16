"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IngredientManagement } from "./ingredient-management"
import { ImportManagement } from "./inventoryimport"

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


export function InventoryManagement() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [imports] = useState<InventoryImport[]>([])

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
          <ImportManagement imports={imports} ingredients={ingredients} />
        </TabsContent>
      </Tabs>
    </div>
  )
}