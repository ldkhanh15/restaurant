import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import reviewAPI from '../api/reviewApi';

// Review interface
interface Review {
  id: string;
  type?: 'review' | 'complaint';
  status: 'pending' | 'approved' | 'rejected' | 'responded' | 'resolved';
  rating: number;
  title?: string;
  content?: string;
  comment?: string;
  customer_name?: string;
  user_name?: string;
  order_code?: string;
  order_id?: string;
  response?: string;
  responded_by?: string;
  created_at: string;
  updated_at: string;
}

interface CreateResponseData {
  reviewId: string;
  response: string;
}

export const useReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async (page: number = 1, limit: number = 100) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('⭐ Hook: Fetching reviews from API...');
      
      const response: any = await reviewAPI.getAllReviews(page, limit);
      
      // Handle response - unwrapped by interceptor
      const reviewData = Array.isArray(response) ? response : (response?.data || []);
      setReviews(reviewData);
      
      console.log('✅ Hook: Reviews loaded successfully:', reviewData.length);
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi tải danh sách đánh giá';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const respondToReview = useCallback(async (data: CreateResponseData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('⭐ Hook: Responding to review:', data);
      
      await reviewAPI.updateReview(data.reviewId, {
        status: 'approved'
      });
      
      setReviews(prev => prev.map(review => 
        review.id === data.reviewId 
          ? { 
              ...review, 
              response: data.response,
              responded_by: 'Admin',
              status: 'approved' as const,
              updated_at: new Date().toISOString()
            }
          : review
      ));
      
      Alert.alert('Thành công', 'Phản hồi đánh giá thành công!');
      console.log('✅ Hook: Review responded successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi phản hồi đánh giá';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error responding to review:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveComplaint = useCallback(async (reviewId: string) => {
    try {
      setLoading(true);
      
      console.log('⭐ Hook: Resolving complaint:', reviewId);
      
      await reviewAPI.updateReview(reviewId, {
        status: 'approved'
      });
      
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { 
              ...review, 
              status: 'approved' as const,
              updated_at: new Date().toISOString()
            }
          : review
      ));
      
      Alert.alert('Thành công', 'Đã xử lý khiếu nại thành công!');
      console.log('✅ Hook: Complaint resolved successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi xử lý khiếu nại';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error resolving complaint:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteReview = useCallback(async (reviewId: string) => {
    try {
      setLoading(true);
      
      console.log('⭐ Hook: Deleting review:', reviewId);
      
      await reviewAPI.deleteReview(reviewId);
      
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      Alert.alert('Thành công', 'Xóa đánh giá thành công!');
      console.log('✅ Hook: Review deleted successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi xóa đánh giá';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error deleting review:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    loading,
    error,
    fetchReviews,
    respondToReview,
    resolveComplaint,
    deleteReview,
    refresh
  };
};

export type { Review, CreateResponseData };