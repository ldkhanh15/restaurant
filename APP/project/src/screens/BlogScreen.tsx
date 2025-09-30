import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { mockApi } from '../services/mockApi';
import { BlogPost } from '../data/mockData';
import LuxuryCard from '../components/LuxuryCard';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Calendar, Clock, ArrowRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const BlogScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlogPosts();
  }, []);

  const loadBlogPosts = async () => {
    try {
      const blogPosts = await mockApi.getBlogPosts();
      setPosts(blogPosts);
    } catch (error) {
      console.error('Failed to load blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderBlogPost = ({ item, index }: { item: BlogPost; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 150)}>
      <LuxuryCard style={styles.blogCard}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('BlogDetail', { post: item })}
        >
          {item.images.length > 0 && (
            <Image source={{ uri: item.images[0] }} style={styles.blogImage} />
          )}
          
          <View style={styles.blogContent}>
            <View style={styles.blogMeta}>
              <View style={styles.dateContainer}>
                <Calendar color="#D4AF37" size={16} />
                <Text style={styles.blogDate}>{formatDate(item.created_at)}</Text>
              </View>
              <View style={styles.readTimeContainer}>
                <Clock color="#CCCCCC" size={16} />
                <Text style={styles.readTime}>3 min read</Text>
              </View>
            </View>

            <Text style={styles.blogTitle}>{item.title}</Text>
            <Text style={styles.blogExcerpt} numberOfLines={3}>
              {item.content}
            </Text>

            <View style={styles.readMoreContainer}>
              <Text style={styles.readMoreText}>Read More</Text>
              <ArrowRight color="#D4AF37" size={16} />
            </View>
          </View>
        </TouchableOpacity>
      </LuxuryCard>
    </Animated.View>
  );

  const renderFeaturedPost = () => {
    if (posts.length === 0) return null;
    const featuredPost = posts[0];

    return (
      <Animated.View entering={FadeInDown.duration(800)}>
        <View style={styles.featuredContainer}>
          <Text style={styles.featuredLabel}>Featured Story</Text>
          <TouchableOpacity
            style={styles.featuredCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('BlogDetail', { post: featuredPost })}
          >
            <Image
              source={{ uri: featuredPost.images[0] }}
              style={styles.featuredImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.9)']}
              style={styles.featuredOverlay}
            >
              <View style={styles.featuredContent}>
                <Text style={styles.featuredTitle}>{featuredPost.title}</Text>
                <Text style={styles.featuredExcerpt} numberOfLines={2}>
                  {featuredPost.content}
                </Text>
                <View style={styles.featuredMeta}>
                  <Calendar color="#D4AF37" size={14} />
                  <Text style={styles.featuredDate}>
                    {formatDate(featuredPost.created_at)}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading stories...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Our Stories</Text>
          <Text style={styles.subtitle}>
            Discover the art of luxury dining and culinary excellence
          </Text>
        </View>

        {renderFeaturedPost()}

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Articles</Text>
          
          <FlatList
            data={posts.slice(1)}
            renderItem={renderBlogPost}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {posts.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No stories available</Text>
            <Text style={styles.emptySubtext}>
              Check back soon for culinary insights and updates
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 8,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Lato-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#D4AF37',
    fontFamily: 'Lato-Regular',
  },
  featuredContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  featuredLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'Lato-SemiBold',
  },
  featuredCard: {
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'flex-end',
  },
  featuredContent: {
    padding: 20,
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  featuredExcerpt: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 12,
    lineHeight: 22,
    fontFamily: 'Lato-Regular',
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredDate: {
    fontSize: 14,
    color: '#D4AF37',
    marginLeft: 6,
    fontFamily: 'Lato-Regular',
  },
  recentSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 16,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  blogCard: {
    marginBottom: 20,
    padding: 0,
    overflow: 'hidden',
  },
  blogImage: {
    width: '100%',
    height: 180,
  },
  blogContent: {
    padding: 20,
  },
  blogMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blogDate: {
    fontSize: 14,
    color: '#D4AF37',
    marginLeft: 6,
    fontFamily: 'Lato-Regular',
  },
  readTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTime: {
    fontSize: 14,
    color: '#CCCCCC',
    marginLeft: 6,
    fontFamily: 'Lato-Regular',
  },
  blogTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  blogExcerpt: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 22,
    marginBottom: 16,
    fontFamily: 'Lato-Regular',
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  readMoreText: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600',
    marginRight: 6,
    fontFamily: 'Lato-SemiBold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    fontFamily: 'Lato-Regular',
  },
});

export default BlogScreen;