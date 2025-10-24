import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

// Mock interface for reviews and complaints since API might not have these endpoints yet
interface Review {
  id: string;
  type: 'review' | 'complaint';
  status: 'pending' | 'responded' | 'resolved';
  rating: number;
  title: string;
  content: string;
  customer_name: string;
  order_code?: string;
  response?: string;
  responded_by?: string;
  created_at: string;
  updated_at: string;
}

interface CreateResponseData {
  reviewId: string;
  response: string;
}

// Mock data for demonstration
const mockReviews: Review[] = [
  {
    id: '1',
    type: 'review',
    status: 'responded',
    rating: 5,
    title: "Món ăn rất ngon!",
    content: "Phở bò tái ở đây thật sự rất ngon, nước dùng đậm đà, thịt bò tươi. Nhân viên phục vụ nhiệt tình. Sẽ quay lại lần sau!",
    customer_name: "Nguyễn Văn A",
    order_code: "#DH001",
    response: "Cảm ơn bạn đã đánh giá! Chúng tôi rất vui khi được phục vụ bạn.",
    responded_by: "Quản lý Lan",
    created_at: "2024-03-20T15:30:00.000Z",
    updated_at: "2024-03-20T16:00:00.000Z"
  },
  {
    id: '2',
    type: 'complaint',
    status: 'pending',
    rating: 2,
    title: "Thời gian chờ quá lâu",
    content: "Đặt món từ 19:00 nhưng đến 20:15 mới được phục vụ. Món ăn nguội và không đúng yêu cầu. Rất thất vọng!",
    customer_name: "Trần Thị B",
    order_code: "#DH002",
    created_at: "2024-03-19T20:15:00.000Z",
    updated_at: "2024-03-19T20:15:00.000Z"
  },
  {
    id: '3',
    type: 'review',
    status: 'responded',
    rating: 4,
    title: "Không gian thoải mái",
    content: "Nhà hàng trang trí đẹp, không gian rộng rãi. Món ăn ngon, giá hợp lý. Chỉ có điều bãi xe hơi nhỏ.",
    customer_name: "Lê Văn C",
    order_code: "#DH003",
    response: "Cảm ơn góp ý của bạn! Chúng tôi sẽ cải thiện vấn đề bãi xe.",
    responded_by: "Nhân viên Hoa",
    created_at: "2024-03-18T14:20:00.000Z",
    updated_at: "2024-03-18T15:00:00.000Z"
  }
];

export const useReviews = () => {
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('⭐ Hook: Fetching reviews...');
      // TODO: Replace with actual API call when available
      // const response = await restaurantApi.reviews.reviewsList();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setReviews(mockReviews);
      console.log('✅ Hook: Reviews loaded successfully:', mockReviews.length);
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
      // TODO: Replace with actual API call when available
      // const response = await restaurantApi.reviews.reviewsRespond(data.reviewId, { response: data.response });
      
      setReviews(prev => prev.map(review => 
        review.id === data.reviewId 
          ? { 
              ...review, 
              response: data.response,
              responded_by: 'Admin',
              status: 'responded' as const,
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
      // TODO: Replace with actual API call when available
      // const response = await restaurantApi.reviews.reviewsResolve(reviewId);
      
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { 
              ...review, 
              status: 'resolved' as const,
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
      // TODO: Replace with actual API call when available
      // const response = await restaurantApi.reviews.reviewsDelete(reviewId);
      
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