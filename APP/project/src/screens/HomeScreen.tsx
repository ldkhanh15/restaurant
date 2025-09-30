import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { mockApi } from '../services/mockApi';
import { setNotifications } from '../store/slices/notificationSlice';
import LuxuryCard from '../components/LuxuryCard';
import LuxuryButton from '../components/LuxuryButton';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { UtensilsCrossed, Calendar, ShoppingCart, FileText, MessageCircle, Bell } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const { unreadCount } = useSelector((state: RootState) => state.notification);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    if (currentUser) {
      const notifications = await mockApi.getUserNotifications(currentUser.id);
      dispatch(setNotifications(notifications));
    }
  };

  const getRankingColor = (ranking: string) => {
    switch (ranking) {
      case 'platinum': return '#E5E4E2';
      case 'vip': return '#D4AF37';
      default: return '#C0C0C0';
    }
  };

  const featuredDishes = [
    {
      id: 'dish-1',
      name: 'Grilled Salmon with Truffle',
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500',
      price: '₫150,000',
    },
    {
      id: 'dish-3',
      name: 'Wagyu Beef Tenderloin',
      image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=500',
      price: '₫320,000',
    },
    {
      id: 'dish-2',
      name: 'Beluga Caviar Tasting',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500',
      price: '₫280,000',
    },
  ];

  return (
    <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Welcome */}
        <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <View style={styles.nameContainer}>
                <Text style={[styles.nameText, { color: getRankingColor(currentUser?.ranking || 'regular') }]}>
                  {currentUser?.ranking?.toUpperCase()} {currentUser?.full_name}
                </Text>
              </View>
              <Text style={styles.pointsText}>Points: {currentUser?.points || 0}</Text>
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Bell color="#D4AF37" size={24} />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Featured Dishes Carousel */}
        <Animated.View entering={FadeInDown.delay(200).duration(800)}>
          <Text style={styles.sectionTitle}>Featured Dishes</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
          >
            {featuredDishes.map((dish, index) => (
              <Animated.View
                key={dish.id}
                entering={FadeInDown.delay(300 + index * 100).duration(600)}
              >
                <TouchableOpacity
                  style={styles.featuredCard}
                  onPress={() => navigation.navigate('DishDetail', { dishId: dish.id })}
                >
                  <Image source={{ uri: dish.image }} style={styles.featuredImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.featuredOverlay}
                  >
                    <Text style={styles.featuredName}>{dish.name}</Text>
                    <Text style={styles.featuredPrice}>{dish.price}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Promotions */}
        <Animated.View entering={FadeInDown.delay(400).duration(800)}>
          <LuxuryCard gradient>
            <Text style={styles.promoTitle}>Special Offer</Text>
            <Text style={styles.promoText}>
              Use code <Text style={styles.promoCode}>LUXURY10</Text> for 10% off your next order
            </Text>
            <Text style={styles.promoSubtext}>Minimum order ₫200,000</Text>
          </LuxuryCard>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Menu')}
            >
              <UtensilsCrossed color="#D4AF37" size={32} />
              <Text style={styles.actionText}>View Menu</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Reservations')}
            >
              <Calendar color="#D4AF37" size={32} />
              <Text style={styles.actionText}>Reserve Table</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Cart')}
            >
              <ShoppingCart color="#D4AF37" size={32} />
              <Text style={styles.actionText}>Order Now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Chat')}
            >
              <MessageCircle color="#D4AF37" size={32} />
              <Text style={styles.actionText}>Chat</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View entering={FadeInDown.delay(800).duration(800)}>
          <LuxuryCard>
            <Text style={styles.cardTitle}>Recent Activity</Text>
            <Text style={styles.activityText}>
              Your last order: Grilled Salmon with Truffle - ₫150,000
            </Text>
            <Text style={styles.activityDate}>January 15, 2025</Text>
            <LuxuryButton
              title="Order Again"
              onPress={() => navigation.navigate('Menu')}
              variant="outline"
              style={{ marginTop: 16 }}
            />
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontSize: 16,
    color: '#CCCCCC',
    fontFamily: 'Lato-Regular',
  },
  nameContainer: {
    marginVertical: 4,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'PlayfairDisplay-Bold',
  },
  pointsText: {
    fontSize: 14,
    color: '#D4AF37',
    fontFamily: 'Lato-Regular',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D4AF37',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  carouselContent: {
    paddingLeft: 20,
  },
  featuredCard: {
    width: width * 0.7,
    height: 200,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
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
    padding: 16,
  },
  featuredName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'PlayfairDisplay-SemiBold',
  },
  featuredPrice: {
    fontSize: 16,
    color: '#D4AF37',
    fontWeight: '600',
    marginTop: 4,
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 8,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  promoText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 4,
    fontFamily: 'Lato-Regular',
  },
  promoCode: {
    fontWeight: '700',
    color: '#D4AF37',
  },
  promoSubtext: {
    fontSize: 14,
    color: '#CCCCCC',
    fontFamily: 'Lato-Regular',
  },
  quickActions: {
    marginTop: 24,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 60) / 2,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  actionText: {
    fontSize: 14,
    color: 'white',
    marginTop: 8,
    fontWeight: '600',
    fontFamily: 'Lato-SemiBold',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 12,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  activityText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 4,
    fontFamily: 'Lato-Regular',
  },
  activityDate: {
    fontSize: 14,
    color: '#CCCCCC',
    fontFamily: 'Lato-Regular',
  },
});

export default HomeScreen;