import { get } from "http";
import apiClient from "./apiClient";

const reviewApi = {
  // User
  getAllReviews: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ) => {
    let url = `/reviews?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const response = await apiClient.get(url);
    console.log("Fetched reviews:", response);
    return response;
  },

  getReviewById: async (id: string) => {
    const response = await apiClient.get(`/reviews/${id}`);
    return response;
  },

  createReview: async (reviewData: any) => {
    const response = await apiClient.post("/reviews", reviewData);
    return response;
  },

  updateReview: async (id: string, reviewData: any) => {
    const response = await apiClient.put(`/reviews/${id}`, reviewData);
    return response;
  },

  deleteReview: async (id: string) => {
    const response = await apiClient.delete(`/reviews/${id}`);
    return response;
  },
};

export default reviewApi;
