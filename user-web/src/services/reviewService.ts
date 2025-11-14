import apiClient from "../lib/apiClient";
import type { Review, CreateReviewData } from "@/type/Review";

export type { Review, CreateReviewData };

export const reviewService = {
  getAll: (params: any) => apiClient.get<any>("/reviews", { params }),
  getById: (id: string) => apiClient.get<any>(`/reviews/${id}`),
  create: (data: CreateReviewData) => apiClient.post<any>("/reviews", data),
  update: (id: string, data: Review) => apiClient.put<any>(`/reviews/${id}`, data),
  delete: (id: string) => apiClient.delete<any>(`/reviews/${id}`),
  getReviewsByDishId: (dishId: string) => apiClient.get<any>(`/reviews/dish/${dishId}`)
};

export default reviewService;
