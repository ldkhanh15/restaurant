import api from './axiosConfig';

// Types
export interface Review {
  id: string;
  user_id: string;
  user_name?: string;
  order_id?: string;
  rating: number;
  comment?: string;
  status?: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
}

export interface CreateReviewData {
  user_id: string;
  order_id?: string;
  rating: number;
  comment?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

const reviewAPI = {
  // Basic CRUD
  getAllReviews: (page: number = 1, limit: number = 10, search?: string) => {
    let url = `/reviews?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return api.get(url);
  },

  getReviewById: (id: string) => 
    api.get(`/reviews/${id}`),

  createReview: (reviewData: CreateReviewData) => 
    api.post('/reviews', reviewData),

  updateReview: (id: string, reviewData: UpdateReviewData) => 
    api.put(`/reviews/${id}`, reviewData),

  deleteReview: (id: string) => 
    api.delete(`/reviews/${id}`),
};

export default reviewAPI;
