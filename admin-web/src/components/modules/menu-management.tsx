"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DishManagement } from "./dish-management"
import { CategoryManagement } from "./category-management"

interface Ingredient {
  id: string
  name: string
  unit: string
  barcode?: string
  rfid?: string
  min_stock_level: number
  current_stock: number
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

interface Dish {
  id: string
  name: string
  description: string
  price: number
  category_id: string
  category_name: string
  media_urls?: string[]
  is_best_seller: boolean
  seasonal: boolean
  active: boolean
  created_at: string
  deleted_at?: string
  ingredients: DishIngredient[]
}

interface DishIngredient {
  ingredient_id: string
  dish_id: string
  quantity: number
  ingredient_name?: string
  unit?: string
}

interface Category {
  id: string
  name: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export function MenuManagement() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])

  return (
    <div className="space-y-6">
      <Tabs defaultValue="dishes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dishes">Quản lý món ăn</TabsTrigger>
          <TabsTrigger value="categories">Quản lý danh mục</TabsTrigger>
        </TabsList>

        <TabsContent value="dishes">
          <DishManagement
            dishes={dishes}
            setDishes={setDishes}
            categories={categories}
            setCategories={setCategories}
            ingredients={ingredients}
            setIngredients={setIngredients}
          />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManagement
            dishes={dishes}
            categories={categories}
            setCategories={setCategories}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
