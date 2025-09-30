import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { markAsRead, markAllAsRead } from '../store/slices/notificationSlice';
import { Notification } from '../data/mockData';
import LuxuryCard from '../components/LuxuryCard';
import LuxuryButton from '../components/LuxuryButton';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Bell, Calendar, Gift, CircleAlert as AlertCircle, CheckCheck } from 'lucide-react-native';

const NotificationsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector((state: RootState) => state.notification);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reservation_confirm':
        return Calendar;
      case 'order_ready':
        return Bell;
      case 'promotion':
        return Gift;
      default:
        return AlertCircle;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'reservation_confirm':
        return '#4CAF50';
      case 'order_ready':
        return '#2196F3';
      case 'promotion':
        return '#D4AF37';
      default:
        return '#FF9800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      dispatch(markAsRead(notification.id));
    }
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      Alert.alert(
        'Mark All as Read',
        'Are you sure you want to mark all notifications as read?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes', onPress: () => dispatch(markAllAsRead()) },
        ]
      );
    }
  };

  const renderNotificationItem = ({ item, index }: { item: Notification; index: number }) => {
    const IconComponent = getNotificationIcon(item.type);
    const iconColor = getNotificationColor(item.type);

    return (
      <Animated.View entering={FadeInDown.delay(index * 100)}>
        <TouchableOpacity
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.8}
        >
          <LuxuryCard
            style={[
              styles.notificationCard,
              !item.read && styles.unreadNotification,
            ]}
          >
            <View style={styles.notificationContent}>
              <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
                <IconComponent color={iconColor} size={24} />
              </View>

              <View style={styles.notificationDetails}>
                <Text
                  style={[
                    styles.notificationText,
                    !item.read && styles.unreadText,
                  ]}
                >
                  {item.content}
                </Text>
                <Text style={styles.notificationTime}>
                  {formatDate(item.created_at)}
                </Text>
              </View>

              {!item.read && <View style={styles.unreadDot} />}
            </View>
          </LuxuryCard>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadCountText}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
            <CheckCheck color="#D4AF37" size={24} />
          </TouchableOpacity>
        )}
      </View>

      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Bell color="#D4AF37" size={64} />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySubtitle}>
            You'll receive updates about your orders, reservations, and special offers here
          </Text>
        </View>
      )}
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
    alignItems: 'flex-start',
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
  unreadCountText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 4,
    fontFamily: 'Lato-Regular',
  },
  markAllButton: {
    padding: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  notificationCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#D4AF37',
    backgroundColor: '#2a2a2a',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationDetails: {
    flex: 1,
  },
  notificationText: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 22,
    marginBottom: 6,
    fontFamily: 'Lato-Regular',
  },
  unreadText: {
    color: 'white',
    fontWeight: '500',
  },
  notificationTime: {
    fontSize: 14,
    color: '#999999',
    fontFamily: 'Lato-Regular',
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D4AF37',
    marginLeft: 8,
    marginTop: 4,
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
    lineHeight: 24,
    fontFamily: 'Lato-Regular',
  },
});

export default NotificationsScreen;