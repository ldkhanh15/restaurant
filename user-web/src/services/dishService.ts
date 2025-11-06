import apiClient from "@/lib/apiClient";

export interface Dish {
  id: string;
  name: string;
  price: number;
  description?: string;
  media_urls: string[];
  category_id?: string;
  is_best_seller?: boolean;
  seasonal?: boolean;
  active?: boolean;
}

export interface DishListResponse {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  items: Dish[];
}

export const dishService = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<{ status: string; data: DishListResponse }> =>
    apiClient.get(`/dishes`, { params }),

  search: (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    name?: string;
    category_id?: string;
    is_best_seller?: boolean;
    seasonal?: boolean;
    active?: boolean;
    price_min?: number;
    price_max?: number;
    price_exact?: number;
  }): Promise<{ status: string; data: DishListResponse }> =>
    apiClient.get(`/dishes/search`, { params }),

  getById: (id: string): Promise<{ status: string; data: Dish }> =>
    apiClient.get(`/dishes/${id}`),
};
