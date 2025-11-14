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
  /**
   * Get all dishes with optional filters and search
   * Supports: name, category_id, is_best_seller, sort, seasonal, active, price_min, price_max, page, limit
   * For search, use 'name' parameter
   * For getting all dishes without pagination, set limit to a large number or omit page/limit
   */
  getAll: (params?: {
    name?: string;
    category_id?: string;
    is_best_seller?: boolean | string;
    sort?: string;
    seasonal?: boolean | string;
    active?: boolean | string;
    price_min?: number | string;
    price_max?: number | string;
    price_exact?: number | string;
    price_ranges?: string;
    recommended?: boolean | string;
    page?: number | string;
    limit?: number | string;
    all?: boolean; // If true, fetch all dishes without pagination
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }) => {
    const queryParams: any = { ...params };

    // Handle 'all' flag - fetch all dishes without pagination
    if (params?.all) {
      queryParams.limit = "1000"; // Large limit to get all
      queryParams.page = "1";
      delete queryParams.all;
    }

    // Map sortBy/sortOrder to sort parameter if needed
    if (params?.sortBy && !queryParams.sort) {
      const order = params.sortOrder === "DESC" ? "-" : "";
      queryParams.sort = `${order}${params.sortBy}`;
      delete queryParams.sortBy;
      delete queryParams.sortOrder;
    }

    return apiClient.get<any>("/dishes", { params: queryParams });
  },
  getById: (id: string) => apiClient.get<any>(`/dishes/${id}`),
  getByCategory: (categoryId: string) =>
    apiClient.get<any>(`/dishes/category/${categoryId}`),
};

export default dishService;
