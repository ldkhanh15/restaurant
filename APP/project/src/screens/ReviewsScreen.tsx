import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { mockApi } from '../services/mockApi';
import { Review, mockDishes } from '../data/mockData';
import LuxuryCard from '../components/LuxuryCard';
import LuxuryButton from '../components/LuxuryButton';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Star, Plus, User, Calendar } from 'lucide-react-native';

const ReviewsScreen: React.FC = () => {
  const { currentUser } = useSelector((state: RootState) => state.user);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReview, setNewReview] = useState({
    dish_id: '',
    rating: 5,
    comment: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const allReviews = await mockApi.getReviews();
      setReviews(allReviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!newReview.comment.trim()) {
      Alert.alert('Error', 'Please add a comment');
      return;
    }

    if (!currentUser) {
      Alert.alert('Error', 'Please log in to submit a review');
      return;
    }

    setLoading(true);
    try {
      await mockApi.createReview({
        user_id: currentUser.id,
        dish_id: newReview.dish_id || mockDishes[0].id,
        rating: newReview.rating,
        comment: newReview.comment,
      });

      Alert.alert('Success', 'Review submitted successfully!');
      setShowAddModal(false);
      setNewReview({ dish_id: '', rating: 5, comment: '' });
      loadReviews();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size = 16, interactive = false) => {
    return Array.from({ length: 5 }, (_, index) => (
      <TouchableOpacity
        key={index}
        disabled={!interactive}
        onPress={() => interactive && setNewReview({ ...newReview, rating: index + 1 })}
      >
        <Star
          color="#D4AF37"
          size={size}
          fill={index < rating ? "#D4AF37" : "transparent"}
        />
      </TouchableOpacity>
    ));
  };

  const getDishName = (dishId: string) => {
    const dish = mockDishes.find(d => d.id === dishId);
    return dish ? dish.name : 'Unknown Dish';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderReviewItem = ({ item, index }: { item: Review; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100)}>
      <LuxuryCard style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <User color="#D4AF37" size={20} />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {item.user_id === currentUser?.id ? 'You' : 'Anonymous User'}
              </Text>
              <Text style={styles.dishName}>{getDishName(item.dish_id || '')}</Text>
            </View>
          </View>
          
          <View style={styles.dateContainer}>
            <Calendar color="#CCCCCC" size={14} />
            <Text style={styles.reviewDate}>{formatDate(item.created_at)}</Text>
          </View>
        </View>

        <View style={styles.ratingContainer}>
          {renderStars(item.rating, 18)}
          <Text style={styles.ratingText}>{item.rating}/5</Text>
        </View>

        <Text style={styles.reviewComment}>{item.comment}</Text>
      </LuxuryCard>
    </Animated.View>
  );

  const AddReviewModal = () => (
    <Modal visible={showAddModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Write a Review</Text>

          <View style={styles.ratingSection}>
            <Text style={styles.sectionLabel}>Your Rating</Text>
            <View style={styles.starRating}>
              {renderStars(newReview.rating, 32, true)}
            </View>
            <Text style={styles.ratingLabel}>{newReview.rating} star{newReview.rating !== 1 ? 's' : ''}</Text>
          </View>

          <View style={styles.commentSection}>
            <Text style={styles.sectionLabel}>Your Comment</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Share your dining experience..."
              placeholderTextColor="#666666"
              value={newReview.comment}
              onChangeText={(text) => setNewReview({ ...newReview, comment: text })}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{newReview.comment.length}/500</Text>
          </View>

          <View style={styles.modalButtons}>
            <LuxuryButton
              title="Cancel"
              onPress={() => setShowAddModal(false)}
              variant="outline"
              style={styles.modalButton}
            />
            <LuxuryButton
              title={loading ? 'Submitting...' : 'Submit Review'}
              onPress={handleSubmitReview}
              style={styles.modalButton}
              disabled={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reviews & Feedback</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus color="#D4AF37" size={24} />
        </TouchableOpacity>
      </View>

      {reviews.length > 0 ? (
        <FlatList
          data={reviews}
          renderItem={renderReviewItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Star color="#D4AF37" size={64} />
          <Text style={styles.emptyTitle}>No Reviews Yet</Text>
          <Text style={styles.emptySubtitle}>
            Be the first to share your dining experience
          </Text>
          <LuxuryButton
            title="Write a Review"
            onPress={() => setShowAddModal(true)}
            style={styles.emptyButton}
          />
        </View>
      )}

      <AddReviewModal />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#D4AF37',
    fontFamily: 'PlayfairDisplay-Bold',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  listContent: {
    paddingBottom: 20,
  },
  reviewCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Lato-SemiBold',
  },
  dishName: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 2,
    fontFamily: 'Lato-Regular',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewDate: {
    fontSize: 12,
    color: '#CCCCCC',
    marginLeft: 4,
    fontFamily: 'Lato-Regular',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Lato-SemiBold',
  },
  reviewComment: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 22,
    fontFamily: 'Lato-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
    marginTop: 20,
    marginBottom: 8,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'Lato-Regular',
  },
  emptyButton: {
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
    fontFamily: 'Lato-SemiBold',
  },
  starRating: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    fontFamily: 'Lato-Regular',
  },
  commentSection: {
    marginBottom: 24,
  },
  commentInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    textAlignVertical: 'top',
    minHeight: 100,
    fontFamily: 'Lato-Regular',
  },
  charCount: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
    marginTop: 8,
    fontFamily: 'Lato-Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});

export default ReviewsScreen;