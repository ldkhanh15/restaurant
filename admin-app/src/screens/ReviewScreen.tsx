import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  FlatList,
  RefreshControl
} from 'react-native';
import { 
  Text, 
  Card, 
  useTheme, 
  TextInput,
  Button,
  Badge,
  Chip,
  Menu,
  Provider,
  IconButton
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '@/theme';
import { useReviews } from '../hooks/useReviews';

// Review types, statuses and ratings for filtering

const reviewTypes = ["Tất cả loại", "Đánh giá", "Khiếu nại"];
const reviewStatuses = ["Tất cả trạng thái", "Chờ xử lí", "Đã phản hồi", "Đã giải quyết", "Đã đóng"];
const ratingOptions = ["Tất cả sao", "1 sao", "2 sao", "3 sao", "4 sao", "5 sao"];

export const ReviewScreen = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('Tất cả loại');
  const [selectedStatus, setSelectedStatus] = useState('Tất cả trạng thái');
  const [selectedRating, setSelectedRating] = useState('Tất cả sao');
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [ratingMenuVisible, setRatingMenuVisible] = useState(false);
  
  // Use reviews hook
  const { reviews, loading, error, fetchReviews, respondToReview, resolveComplaint, deleteReview, refresh } = useReviews();

  // Fetch reviews on mount
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Safe check for theme
  if (!theme || !theme.colors) {
    return null;
  }

  // Filter reviews using useMemo for performance
  const filteredReviews = useMemo(() => {
    return reviews.filter(item => {
      const matchesSearch = (item.customer_name || item.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (item.content || item.comment || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (item.order_code || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'Tất cả loại' || 
                         (selectedType === 'Đánh giá' && item.type === 'review') ||
                         (selectedType === 'Khiếu nại' && item.type === 'complaint');
      const matchesStatus = selectedStatus === 'Tất cả trạng thái' || 
                           (selectedStatus === 'Chờ xử lí' && item.status === 'pending') ||
                           (selectedStatus === 'Đã phản hồi' && item.status === 'responded') ||
                           (selectedStatus === 'Đã giải quyết' && item.status === 'resolved');
      const matchesRating = selectedRating === 'Tất cả sao' || item.rating === parseInt(selectedRating.charAt(0));
      
      return matchesSearch && matchesType && matchesStatus && matchesRating;
    });
  }, [reviews, searchQuery, selectedType, selectedStatus, selectedRating]);

  const onRefresh = () => {
    refresh();
  };

  const getTypeColor = (type: string) => {
    return type === 'Đánh giá' ? '#E8F5E8' : '#FFEBEE';
  };

  const getTypeTextColor = (type: string) => {
    return type === 'Đánh giá' ? '#2E7D32' : '#C62828';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Chờ xử lí': return '#FF9800';
      case 'Đã phản hồi': return '#2196F3';
      case 'Đã giải quyết': return '#4CAF50';
      case 'Đã đóng': return '#9E9E9E';
      default: return theme.colors.outline;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Text key={index} style={styles.star}>
        {index < rating ? '⭐' : '☆'}
      </Text>
    ));
  };

  const handleMarkResolved = async (reviewId: string) => {
    await resolveComplaint(reviewId);
  };

  const handleMarkClosed = async (reviewId: string) => {
    // For now, just resolve the complaint
    await resolveComplaint(reviewId);
  };

  const renderReviewItem = ({ item }: { item: any }) => (
    <Card style={[styles.reviewCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
      <Card.Content style={styles.reviewContent}>
        {/* Header with rating and badges */}
        <View style={styles.reviewHeader}>
          <View style={styles.ratingRow}>
            <View style={styles.starsContainer}>
              {renderStars(item.rating)}
            </View>
            <Text variant="titleSmall" style={[styles.ratingText, { color: theme.colors.onSurface }]}>
              ({item.rating}/5)
            </Text>
          </View>
          <View style={styles.badgeRow}>
            <Chip 
              mode="flat" 
              compact 
              style={[
                styles.typeChip, 
                { 
                  backgroundColor: getTypeColor(item.type),
                  borderColor: getTypeTextColor(item.type)
                }
              ]}
              textStyle={{ color: getTypeTextColor(item.type), fontSize: 11 }}
            >
              {item.type}
            </Chip>
            <Badge 
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) }
              ]}
            >
              {item.status}
            </Badge>
          </View>
        </View>

        {/* Review content */}
        <View style={styles.reviewBody}>
          <Text variant="titleMedium" style={[styles.reviewTitle, { color: theme.colors.onSurface }]}>
            {item.title}
          </Text>
          <Text variant="bodyMedium" style={[styles.reviewContentText, { color: theme.colors.onSurfaceVariant }]}>
            {item.content}
          </Text>
        </View>

        {/* Customer info */}
        <View style={styles.customerInfo}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Khách hàng: <Text style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{item.customerName}</Text>
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Đơn hàng: <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>{item.orderCode}</Text>
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Thời gian: <Text style={{ fontWeight: 'bold' }}>{item.createdAt}</Text>
          </Text>
        </View>

        {/* Response section */}
        {item.response && (
          <View style={[styles.responseSection, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="labelMedium" style={[styles.responseLabel, { color: theme.colors.onSurfaceVariant }]}>
              Phản hồi từ {item.responseBy}:
            </Text>
            <Text variant="bodySmall" style={[styles.responseText, { color: theme.colors.onSurface }]}>
              {item.response}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          {item.status === 'Chờ xử lí' && (
            <Button
              mode="contained-tonal"
              icon="reply"
              onPress={() => console.log('Phản hồi:', item.id)}
              style={styles.actionButton}
              compact
            >
              Phản hồi
            </Button>
          )}
          {(item.status === 'Chờ xử lí' || item.status === 'Đã phản hồi') && (
            <Button
              mode="contained"
              icon="check"
              onPress={() => handleMarkResolved(item.id)}
              style={styles.actionButton}
              compact
            >
              Đã giải quyết
            </Button>
          )}
          {item.status === 'Đã giải quyết' && (
            <Button
              mode="outlined"
              icon="close"
              onPress={() => handleMarkClosed(item.id)}
              style={styles.actionButton}
              compact
            >
              Đóng
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <Provider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
              Đánh giá & Khiếu nại
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Quản lý phản hồi từ khách hàng ⭐
            </Text>
          </View>

          {/* Search and Filter Section */}
          <View style={[styles.searchSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Tìm kiếm & Bộ lọc
            </Text>
            
            {/* Search Input */}
            <TextInput
              mode="outlined"
              label="Tìm kiếm theo tên khách hàng, tiêu đề..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              left={<TextInput.Icon icon="magnify" />}
              right={searchQuery ? <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} /> : undefined}
            />

            {/* Filter Row 1 */}
            <View style={styles.filterRow}>
              {/* Type Filter */}
              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: theme.colors.onSurface }]}>Loại</Text>
                <Menu
                  visible={typeMenuVisible}
                  onDismiss={() => setTypeMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setTypeMenuVisible(true)}
                      style={styles.filterButton}
                      contentStyle={styles.filterButtonContent}
                    >
                      {selectedType}
                    </Button>
                  }
                >
                  {reviewTypes.map((type) => (
                    <Menu.Item
                      key={type}
                      onPress={() => {
                        setSelectedType(type);
                        setTypeMenuVisible(false);
                      }}
                      title={type}
                    />
                  ))}
                </Menu>
              </View>

              {/* Status Filter */}
              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: theme.colors.onSurface }]}>Trạng thái</Text>
                <Menu
                  visible={statusMenuVisible}
                  onDismiss={() => setStatusMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setStatusMenuVisible(true)}
                      style={styles.filterButton}
                      contentStyle={styles.filterButtonContent}
                    >
                      {selectedStatus}
                    </Button>
                  }
                >
                    {reviewStatuses.map((status) => (
                      <Menu.Item
                        key={status}
                        onPress={() => {
                          setSelectedStatus(status);
                          setStatusMenuVisible(false);
                        }}
                        title={status}
                      />
                    ))}
                </Menu>
              </View>
            </View>

            {/* Filter Row 2 */}
            <View style={styles.filterRow}>
              {/* Rating Filter */}
              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: theme.colors.onSurface }]}>Đánh giá</Text>
                <Menu
                  visible={ratingMenuVisible}
                  onDismiss={() => setRatingMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setRatingMenuVisible(true)}
                      style={styles.filterButton}
                      contentStyle={styles.filterButtonContent}
                    >
                      {selectedRating}
                    </Button>
                  }
                >
                  {ratingOptions.map((rating) => (
                    <Menu.Item
                      key={rating}
                      onPress={() => {
                        setSelectedRating(rating);
                        setRatingMenuVisible(false);
                      }}
                      title={rating}
                    />
                  ))}
                </Menu>
              </View>
              
              {/* Empty space for layout balance */}
              <View style={styles.filterItem} />
            </View>
          </View>

          {/* Reviews List */}
          <View style={[styles.reviewListSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Danh sách đánh giá & khiếu nại ({filteredReviews.length})
            </Text>
            <FlatList
              data={filteredReviews}
              renderItem={renderReviewItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                    Không tìm thấy đánh giá nào phù hợp ⭐
                  </Text>
                </View>
              }
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  // Search and Filter Section
  searchSection: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  searchInput: {
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  filterButton: {
    justifyContent: 'flex-start',
  },
  filterButtonContent: {
    justifyContent: 'flex-start',
  },
  // Review List Section
  reviewListSection: {
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // Review Item Styles
  reviewCard: {
    marginBottom: spacing.md,
  },
  reviewContent: {
    padding: spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 16,
    marginRight: 2,
  },
  ratingText: {
    fontWeight: 'bold',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeChip: {
    height: 28,
    borderWidth: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  reviewBody: {
    marginBottom: spacing.md,
  },
  reviewTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    lineHeight: 22,
  },
  reviewContentText: {
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  customerInfo: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  responseSection: {
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  responseLabel: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  responseText: {
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  actionButton: {
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
});

export default ReviewScreen;