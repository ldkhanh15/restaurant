import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { clearUser } from '../store/slices/userSlice';
import { mockApi } from '../services/mockApi';
import { Order, Review } from '../data/mockData';
import LuxuryCard from '../components/LuxuryCard';
import LuxuryButton from '../components/LuxuryButton';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  User,
  Settings,
  Star,
  ShoppingBag,
  Heart,
  LogOut,
  Crown,
  Award,
  Calendar,
} from 'lucide-react-native';

const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    if (currentUser) {
      try {
        const [userOrders, userReviews] = await Promise.all([
          mockApi.getUserOrders(currentUser.id),
          mockApi.getReviews(),
        ]);
        setOrders(userOrders);
        setReviews(userReviews.filter(review => review.user_id === currentUser.id));
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await mockApi.logout();
            dispatch(clearUser());
          },
        },
      ]
    );
  };

  const getRankingColor = (ranking: string) => {
    switch (ranking) {
      case 'platinum': return '#E5E4E2';
      case 'vip': return '#D4AF37';
      default: return '#C0C0C0';
    }
  };

  const getRankingIcon = (ranking: string) => {
    switch (ranking) {
      case 'platinum': return Crown;
      case 'vip': return Award;
      default: return Star;
    }
  };

  const formatPrice = (price: number) => {
    return `₫${price.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalSpent = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  if (!currentUser) {
    return (
      <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Please login to view profile</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut color="#FF4444" size={24} />
          </TouchableOpacity>
        </View>

        {/* User Info Card */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <LuxuryCard gradient>
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                <User color="#D4AF37" size={40} />
              </View>
              
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{currentUser.full_name}</Text>
                <Text style={styles.userEmail}>{currentUser.email}</Text>
                
                <View style={styles.rankingContainer}>
                  {(() => {
                    const RankingIcon = getRankingIcon(currentUser.ranking);
                    return <RankingIcon color={getRankingColor(currentUser.ranking)} size={16} />;
                  })()}
                  <Text style={[styles.rankingText, { color: getRankingColor(currentUser.ranking) }]}>
                    {currentUser.ranking.toUpperCase()} MEMBER
                  </Text>
                </View>
                
                <Text style={styles.pointsText}>
                  {currentUser.points} Loyalty Points
                </Text>
              </View>
            </View>
          </LuxuryCard>
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <View style={styles.statsContainer}>
            <LuxuryCard style={styles.statCard}>
              <ShoppingBag color="#D4AF37" size={24} />
              <Text style={styles.statNumber}>{orders.length}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </LuxuryCard>
            
            <LuxuryCard style={styles.statCard}>
              <Star color="#D4AF37" size={24} fill="#D4AF37" />
              <Text style={styles.statNumber}>{averageRating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </LuxuryCard>
            
            <LuxuryCard style={styles.statCard}>
              <Heart color="#D4AF37" size={24} />
              <Text style={styles.statNumber}>{formatPrice(totalSpent)}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </LuxuryCard>
          </View>
        </Animated.View>

        {/* Recent Orders */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <LuxuryCard>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            {orders.length > 0 ? (
              orders.slice(0, 3).map((order, index) => (
                <View key={order.id} style={styles.orderItem}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                  </View>
                  <Text style={styles.orderAmount}>{formatPrice(order.total_amount)}</Text>
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, styles[`${order.status}Status`]]}>
                      <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No orders yet</Text>
            )}
            
            {orders.length > 3 && (
              <LuxuryButton
                title="View All Orders"
                onPress={() => navigation.navigate('OrderHistory')}
                variant="outline"
                style={styles.viewAllButton}
              />
            )}
          </LuxuryCard>
        </Animated.View>

        {/* Preferences */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <LuxuryCard>
            <Text style={styles.sectionTitle}>Dining Preferences</Text>
            
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Preferred Location:</Text>
              <Text style={styles.preferenceValue}>
                {currentUser.preferences.preferred_location?.replace('_', ' ').toUpperCase() || 'Not Set'}
              </Text>
            </View>
            
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Allergies:</Text>
              <Text style={styles.preferenceValue}>
                {currentUser.preferences.allergies?.join(', ') || 'None specified'}
              </Text>
            </View>
            
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Favorite Dishes:</Text>
              <Text style={styles.preferenceValue}>
                {currentUser.preferences.favorite_dishes?.length || 0} saved
              </Text>
            </View>
          </LuxuryCard>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <LuxuryCard>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('Reservations')}
            >
              <Calendar color="#D4AF37" size={24} />
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>My Reservations</Text>
                <Text style={styles.actionSubtitle}>View and manage your bookings</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('Reviews')}
            >
              <Star color="#D4AF37" size={24} />
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Reviews & Feedback</Text>
                <Text style={styles.actionSubtitle}>Rate your dining experiences</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Settings color="#D4AF37" size={24} />
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Settings</Text>
                <Text style={styles.actionSubtitle}>Manage your preferences</Text>
              </View>
            </TouchableOpacity>
          </LuxuryCard>
        </Animated.View>
      </ScrollView>
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
  logoutButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Lato-Regular',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  userDetails: {
    marginLeft: 20,
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
    fontFamily: 'Lato-Regular',
  },
  rankingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankingText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    fontFamily: 'Lato-Bold',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
    fontFamily: 'Lato-SemiBold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    paddingVertical: 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginTop: 8,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#CCCCCC',
    marginTop: 4,
    fontFamily: 'Lato-Regular',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 16,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  orderItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Lato-SemiBold',
  },
  orderDate: {
    fontSize: 14,
    color: '#CCCCCC',
    fontFamily: 'Lato-Regular',
  },
  orderAmount: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Lato-SemiBold',
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingStatus: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  preparingStatus: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  readyStatus: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  deliveredStatus: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D4AF37',
    fontFamily: 'Lato-SemiBold',
  },
  viewAllButton: {
    marginTop: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  preferenceLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    fontFamily: 'Lato-Regular',
  },
  preferenceValue: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
    fontFamily: 'Lato-SemiBold',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.1)',
  },
  actionInfo: {
    marginLeft: 16,
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
    fontFamily: 'Lato-SemiBold',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    fontFamily: 'Lato-Regular',
  },
});

export default ProfileScreen;