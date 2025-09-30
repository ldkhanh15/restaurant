import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { mockApi } from '../services/mockApi';
import { BlogPost } from '../data/mockData';
import LuxuryCard from '../components/LuxuryCard';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Calendar, Clock, Share2, ArrowLeft } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const BlogDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { post } = route.params;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: post.title,
        message: `${post.title}\n\n${post.content.slice(0, 100)}...`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.headerImageContainer}>
          <Image source={{ uri: post.images[0] }} style={styles.headerImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.headerOverlay}
          />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color="#D4AF37" size={24} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.duration(800)}>
            <Text style={styles.title}>{post.title}</Text>

            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <Calendar color="#D4AF37" size={16} />
                <Text style={styles.metaText}>
                  {formatDate(post.created_at)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Clock color="#D4AF37" size={16} />
                <Text style={styles.metaText}>5 min read</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Share2 color="#D4AF37" size={20} />
              <Text style={styles.shareText}>Share Article</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)}>
            <LuxuryCard>
              <Text style={styles.content}>{post.content}</Text>

              {post.images.slice(1).map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image }}
                  style={styles.contentImage}
                />
              ))}
            </LuxuryCard>
          </Animated.View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerImageContainer: {
    height: 300,
    width: '100%',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    marginTop: -40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  meta: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  metaText: {
    fontSize: 14,
    color: '#D4AF37',
    marginLeft: 8,
    fontFamily: 'Lato-Regular',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  shareText: {
    fontSize: 14,
    color: '#D4AF37',
    marginLeft: 8,
    fontWeight: '600',
    fontFamily: 'Lato-SemiBold',
  },
  contentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 16,
  },
});

export default BlogDetailScreen;
