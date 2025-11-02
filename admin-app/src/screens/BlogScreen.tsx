import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  FlatList,
  TouchableOpacity,
  Dimensions,
  RefreshControl
} from 'react-native';
import { 
  Text, 
  Card, 
  useTheme, 
  TextInput,
  Button,
  Badge,
  IconButton,
  Chip,
  Menu,
  Provider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatCard } from '@/components';
import { spacing } from '@/theme';
import { useBlogs } from '../hooks/useBlogs';

const screenWidth = Dimensions.get('window').width;

// Blog categories and statuses for filtering

const categories = ["Tất cả", "Công thức", "Thực đơn", "Hướng dẫn", "Giới thiệu", "Khuyến mãi"];
const statuses = ["Tất cả", "Đã xuất bản", "Nháp"];

const BlogScreen = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedStatus, setSelectedStatus] = useState('Tất cả');
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  
  // Use blogs hook
  const { blogs, loading, error, fetchBlogs, deleteBlog, refresh } = useBlogs();

  // Fetch blogs on mount
  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  // Safe check for theme
  if (!theme || !theme.colors) {
    return null;
  }

  // Statistics data
  const stats = [
    {
      title: "Tổng bài viết",
      value: blogs.length.toString(),
      change: "+2",
      icon: "📝",
      color: "#2196F3",
    },
    {
      title: "Đã xuất bản",
      value: blogs.filter(item => item.status === "published").length.toString(),
      change: "+1",
      icon: "✅",
      color: "#4CAF50",
    },
    {
      title: "Bản nháp",
      value: blogs.filter(item => item.status === "draft").length.toString(),
      change: "+1",
      icon: "📄",
      color: "#FF9800",
    },
    {
      title: "Tổng lượt xem",
      value: blogs.reduce((total, item) => total + (item.views || 0), 0).toLocaleString(),
      change: "+15%",
      icon: "👁️",
      color: "#9C27B0",
    },
  ];

  // Filter blog data
  const filteredBlogData = blogs.filter(item => {
    const authorName = item.author ? `${item.author.first_name} ${item.author.last_name}` : '';
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         authorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'Tất cả' || 
                         (selectedStatus === 'Đã xuất bản' && item.status === 'published') ||
                         (selectedStatus === 'Nháp' && item.status === 'draft');
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const onRefresh = () => {
    refresh();
  };

  const getStatusColor = (status: string) => {
    return status === 'Đã xuất bản' ? '#4CAF50' : '#FF9800';
  };

  const handleDeletePost = async (id: string) => {
    await deleteBlog(id);
  };

  const renderStatCard = ({ item }: { item: any }) => (
    <StatCard
      title={item.title}
      value={item.value}
      icon={item.icon}
      color={item.color}
      change={item.change}
    />
  );

  const renderBlogItem = ({ item }: { item: any }) => (
    <Card style={[styles.blogCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
      <Card.Content style={styles.blogContent}>
        <View style={styles.blogHeader}>
          <View style={styles.blogTitleSection}>
            <Text variant="titleMedium" style={[styles.blogTitle, { color: theme.colors.onSurface }]}>
              {item.title}
            </Text>
            <Text variant="bodySmall" style={[styles.blogDesc, { color: theme.colors.onSurfaceVariant }]}>
              {item.desc}
            </Text>
          </View>
          <Badge 
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) }
            ]}
          >
            {item.status}
          </Badge>
        </View>

        <View style={styles.blogMeta}>
          <View style={styles.blogMetaLeft}>
            <View style={styles.metaRow}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Tác giả: <Text style={{ fontWeight: 'bold' }}>{item.author}</Text>
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Chip 
                mode="outlined" 
                compact 
                style={[styles.categoryChip, { borderColor: theme.colors.outline }]}
              >
                {item.category}
              </Chip>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>
                👁️ {(item.views || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                📅 {item.date}
              </Text>
            </View>
          </View>

          <View style={styles.blogActions}>
            <IconButton
              icon="eye"
              mode="contained-tonal"
              size={20}
              onPress={() => console.log('Xem bài viết', item.id)}
            />
            <IconButton
              icon="pencil"
              mode="contained-tonal"
              size={20}
              onPress={() => console.log('Chỉnh sửa bài viết', item.id)}
            />
            <IconButton
              icon="delete"
              mode="contained-tonal"
              size={20}
              iconColor={theme.colors.error}
              onPress={() => handleDeletePost(item.id)}
            />
          </View>
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
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
              Quản lý Blog
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Quản lý bài viết và nội dung blog 📝
            </Text>
          </View>

          {/* Stats Grid */}
          <FlatList
            data={stats}
            style={styles.statGrid}
            numColumns={2}
            columnWrapperStyle={styles.row}
            keyExtractor={(item) => item.title}
            renderItem={renderStatCard}
            scrollEnabled={false}
          />

          {/* Search and Filter Section */}
          <View style={[styles.searchSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Tìm kiếm & Bộ lọc
            </Text>
            
            {/* Search Input */}
            <TextInput
              mode="outlined"
              label="Tìm kiếm bài viết..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              left={<TextInput.Icon icon="magnify" />}
              right={searchQuery ? <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} /> : undefined}
            />

            {/* Filter Row */}
            <View style={styles.filterRow}>
              {/* Category Filter */}
              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: theme.colors.onSurface }]}>Danh mục</Text>
                <Menu
                  visible={categoryMenuVisible}
                  onDismiss={() => setCategoryMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setCategoryMenuVisible(true)}
                      style={styles.filterButton}
                      contentStyle={styles.filterButtonContent}
                    >
                      {selectedCategory}
                    </Button>
                  }
                >
                  {categories.map((category) => (
                    <Menu.Item
                      key={category}
                      onPress={() => {
                        setSelectedCategory(category);
                        setCategoryMenuVisible(false);
                      }}
                      title={category}
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
                  {statuses.map((status) => (
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

            {/* Create Post Button */}
            <Button
              mode="contained"
              icon="plus"
              onPress={() => console.log('Tạo bài viết mới')}
              style={styles.createButton}
            >
              Tạo bài viết mới
            </Button>
          </View>

          {/* Blog List */}
          <View style={[styles.blogListSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Danh sách bài viết ({filteredBlogData.length})
            </Text>
            <FlatList
              data={filteredBlogData}
              renderItem={renderBlogItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                    Không tìm thấy bài viết nào 📝
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
  statGrid: {
    paddingHorizontal: spacing.md,
    paddingTop: 0,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
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
    marginBottom: spacing.md,
    gap: spacing.md,
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
  createButton: {
    marginTop: spacing.sm,
  },
  // Blog List Section
  blogListSection: {
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
  // Blog Item Styles
  blogCard: {
    marginBottom: spacing.md,
  },
  blogContent: {
    padding: spacing.md,
  },
  blogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  blogTitleSection: {
    flex: 1,
    marginRight: spacing.md,
  },
  blogTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  blogDesc: {
    lineHeight: 18,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  blogMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  blogMetaLeft: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryChip: {
    height: 24,
  },
  blogActions: {
    flexDirection: 'row',
    gap: spacing.xs,
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

export default BlogScreen;