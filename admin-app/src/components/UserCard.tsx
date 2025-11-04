import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Avatar, useTheme } from 'react-native-paper';
import { spacing } from '@/theme';
import { User } from '@/api/users';

interface UserCardProps {
  user: User;
  onPress?: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onPress }) => {
  const theme = useTheme();

  // Safe check for theme
  if (!theme || !theme.colors) {
    return null;
  }

  const getRankingColor = (ranking: string) => {
    switch (ranking) {
      case 'platinum': return '#e5e7eb';
      case 'vip': return '#fbbf24';
      case 'regular': return '#6b7280';
      default: return theme.colors.outline;
    }
  };

  const getRankingText = (ranking: string) => {
    switch (ranking) {
      case 'platinum': return 'Platinum';
      case 'vip': return 'VIP';
      case 'regular': return 'Thường';
      default: return ranking;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'customer': return 'Khách hàng';
      case 'employee': return 'Nhân viên';
      case 'admin': return 'Quản trị';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'employee': return '#3b82f6';
      case 'customer': return '#10b981';
      default: return theme.colors.outline;
    }
  };

  return (
    <View 
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      onTouchEnd={onPress}
    >
      <View style={styles.header}>
        <Avatar.Text
          size={48}
          label={user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
          style={{ backgroundColor: theme.colors.primary }}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.colors.onSurface }]}>
            {user.full_name}
          </Text>
          <Text style={[styles.userUsername, { color: theme.colors.onSurfaceVariant }]}>
            @{user.username}
          </Text>
          <Text style={[styles.userEmail, { color: theme.colors.onSurfaceVariant }]}>
            {user.email}
          </Text>
        </View>
        <View style={styles.badges}>
          <View 
            style={{ 
              backgroundColor: getRoleColor(user.role),
              marginBottom: spacing.xs,
              paddingHorizontal: spacing.xs,
              paddingVertical: 4,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: getRoleColor(user.role),
            }}
          >
            <Text style={{ color: '#fff', fontSize: 10 }}>
              {getRoleText(user.role)}
            </Text>
          </View>
          {user.role === 'customer' && (
            <View 
              style={{ 
                backgroundColor: getRankingColor(user.ranking),
                paddingHorizontal: spacing.xs,
                paddingVertical: 4,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: getRankingColor(user.ranking),
              }}
            >
              <Text style={{ 
                color: user.ranking === 'platinum' ? '#000' : '#fff', 
                fontSize: 10 
              }}>
                {getRankingText(user.ranking)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.contactInfo}>
          <Text style={[styles.phoneText, { color: theme.colors.onSurfaceVariant }]}>
            📞 {user.phone}
          </Text>
          {user.role === 'customer' && (
            <Text style={[styles.pointsText, { color: theme.colors.primary }]}>
              🎯 {user.points} điểm
            </Text>
          )}
        </View>
        <Text style={[styles.joinDate, { color: theme.colors.onSurfaceVariant }]}>
          Tham gia: {new Date(user.created_at).toLocaleDateString('vi-VN')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userUsername: {
    fontSize: 14,
  },
  userEmail: {
    fontSize: 14,
  },
  badges: {
    alignItems: 'flex-end',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  contactInfo: {
    flex: 1,
  },
  phoneText: {
    fontSize: 14,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  joinDate: {
    fontSize: 14,
  },
});