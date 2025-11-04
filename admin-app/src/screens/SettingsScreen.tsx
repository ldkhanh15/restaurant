import React from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Alert 
} from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  Switch, 
  Avatar, 
  List, 
  Divider,
  useTheme 
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore, useThemeStore } from '@/store';
import { spacing } from '@/theme';

const SettingsScreen = () => {
  const theme = useTheme();
  const { user, clearAuth } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất không?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAuth();
              console.log('✅ Logout successful');
            } catch (error) {
              console.error('Logout failed:', error);
            }
          },
        },
      ]
    );
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Quản trị viên';
      case 'manager': return 'Quản lý';
      default: return role;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <Card style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text
              size={80}
              label={user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A'}
              style={{ backgroundColor: theme.colors.primary }}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: theme.colors.onSurface }]}>
                {user?.full_name || 'Admin User'}
              </Text>
              <Text style={[styles.userEmail, { color: theme.colors.onSurfaceVariant }]}>
                {user?.email || 'admin@restaurant.com'}
              </Text>
              <Text style={[styles.role, { color: theme.colors.primary }]}>
                {getRoleText(user?.role || 'admin')}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* App Settings */}
        <Card style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Cài đặt ứng dụng
            </Text>
            
            <List.Item
              title="Chế độ tối"
              description="Bật/tắt giao diện tối"
              left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Thông báo"
              description="Cài đặt thông báo đẩy"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // TODO: Navigate to notification settings
                console.log('Navigate to notification settings');
              }}
            />
          </Card.Content>
        </Card>

        {/* Account Settings */}
        <Card style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Tài khoản
            </Text>
            
            <List.Item
              title="Thông tin cá nhân"
              description="Cập nhật thông tin tài khoản"
              left={(props) => <List.Icon {...props} icon="account-edit" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // TODO: Navigate to profile edit
                console.log('Navigate to profile edit');
              }}
            />
            
            <Divider />
            
            <List.Item
              title="Đổi mật khẩu"
              description="Thay đổi mật khẩu đăng nhập"
              left={(props) => <List.Icon {...props} icon="lock-reset" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // TODO: Navigate to change password
                console.log('Navigate to change password');
              }}
            />
            
            <Divider />
            
            <List.Item
              title="Quyền hạn"
              description="Xem quyền hạn của tài khoản"
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // TODO: Navigate to permissions
                console.log('Navigate to permissions');
              }}
            />
          </Card.Content>
        </Card>

        {/* System Settings */}
        <Card style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Hệ thống
            </Text>
            
            <List.Item
              title="Báo cáo lỗi"
              description="Gửi báo cáo sự cố"
              left={(props) => <List.Icon {...props} icon="bug" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // TODO: Navigate to bug report
                console.log('Navigate to bug report');
              }}
            />
            
            <Divider />
            
            <List.Item
              title="Về ứng dụng"
              description="Thông tin phiên bản và giấy phép"
              left={(props) => <List.Icon {...props} icon="information" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert(
                  'Restaurant Admin',
                  'Phiên bản: 1.0.0\nBản quyền © 2024 Restaurant Team'
                );
              }}
            />
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            mode="contained"
            onPress={handleLogout}
            buttonColor={theme.colors.error}
            textColor={theme.colors.onError}
            style={styles.logoutButton}
            icon="logout"
          >
            Đăng xuất
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: spacing.lg,
  },
  profileCard: {
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  profileInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  role: {
    fontWeight: '600',
    fontSize: 14,
    marginTop: spacing.xs,
  },
  settingsCard: {
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  logoutContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  logoutButton: {
    paddingVertical: spacing.sm,
  },
});

export default SettingsScreen;