import apiClient from "@/lib/apiClient";

export type Dish = {
  ingredients: any[];
  category: any;
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  media_urls: string[];
  is_best_seller: boolean;
  seasonal: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export const dishService = {
  getAll: (params: any) => apiClient.get<any>("/dishes", { params }),
  getById: (id: string) => apiClient.get<any>(`/dishes/${id}`),
  search: (query: string) => apiClient.get<any>(`/dishes/search?q=${query}`),
  getByCategory: (categoryId: string) =>
    apiClient.get<any>(`/dishes/category/${categoryId}`),
};

export default dishService;
