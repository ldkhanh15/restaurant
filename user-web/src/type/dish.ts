export interface Dish {
  id: string
  name: string
  description?: string
  price: number
  category_id: string
  media_urls?: string[]
  is_best_seller: boolean
  seasonal: boolean
  active: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface PaginationData {
  currentPage: number
  totalPages: number
  total: number
  itemsPerPage: number
}

export interface ApiResponse<T> {
  status: string
  data: {
    data: T[]
    pagination: PaginationData
  }
}