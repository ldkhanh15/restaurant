import React, { useState } from 'react';
import { NavigationContainer, useNavigation, NavigationProp } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme, IconButton } from 'react-native-paper';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import { 
  LoginScreen,
  DashboardScreen,
  OrdersScreen,
  OrderDetailScreen,  // NEW: Import OrderDetailScreen
  UsersScreen,
  SettingsScreen,
  ReservationScreen,
  MenuScreen,
  EmployeeScreen,
  InventoryScreen,
  BlogScreen,
  ChatScreen,
  NotificationScreen,
  ReviewScreen,
  VoucherScreen
} from '../screens';

import { useAuthStore } from '../store';
import { MenuModal } from '../components/MenuModal';
import { STORAGE_KEYS } from '../config/appConfig';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  OrderDetail: { orderId: string };  // NEW: Add OrderDetail route
  Users: undefined;
  Inventory: undefined;
  Blog: undefined;
  Chat: undefined;
  Notifications: undefined;
  Reviews: undefined;
  Vouchers: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Orders: undefined;
  Reservations: undefined;
  Menu: undefined;
  Employees: undefined;
};

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
};

const MainTabNavigator = () => {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleMenuPress = () => {
    setMenuVisible(true);
  };

  const handleMenuClose = () => {
    setMenuVisible(false);
  };

  const handleMenuNavigate = (screen: string) => {
    console.log('Navigate to:', screen);
    
    // Đóng menu trước khi navigate
    setMenuVisible(false);
    
    // Navigate to the actual screen
    switch (screen) {
      case 'users':
        console.log('Navigating to Users screen');
        navigation.navigate('Users');
        break;
      case 'inventory':
        console.log('Navigating to Inventory screen');
        navigation.navigate('Inventory');
        break;
      case 'blog':
        console.log('Navigating to Blog screen');
        navigation.navigate('Blog');
        break;
      case 'chat':
        console.log('Navigating to Chat screen');
        navigation.navigate('Chat');
        break;
      case 'notifications':
        console.log('Navigating to Notifications screen');
        navigation.navigate('Notifications');
        break;
      case 'reviews':
        console.log('Navigating to Reviews screen');
        navigation.navigate('Reviews');
        break;
      case 'vouchers':
        console.log('Navigating to Vouchers screen');
        navigation.navigate('Vouchers');
        break;
      case 'settings':
        console.log('Navigating to Settings screen');
        navigation.navigate('Settings');
        break;
      default:
        console.log('Unknown screen:', screen);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <MainTab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: string;

            switch (route.name) {
              case 'Dashboard':
                iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
                break;
              case 'Orders':
                iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
                break;
              case 'Reservations':
                iconName = focused ? 'calendar-clock' : 'calendar-clock-outline';
                break;
              case 'Menu':
                iconName = focused ? 'food' : 'food-outline';
                break;
              case 'Employees':
                iconName = focused ? 'account-group' : 'account-group-outline';
                break;
              default:
                iconName = 'help-circle-outline';
            }

            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outline,
          },
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.onSurface,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <IconButton 
              icon="menu" 
              size={24}
              iconColor={theme.colors.onSurface}
              onPress={handleMenuPress}
            />
          ),
        })}
      >
        <MainTab.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{ title: 'Tổng quan' }}
        />
        <MainTab.Screen 
          name="Orders" 
          component={OrdersScreen}
          options={{ title: 'Đơn hàng' }}
        />
        <MainTab.Screen 
          name="Reservations" 
          component={ReservationScreen}
          options={{ title: 'Đặt bàn' }}
        />
        <MainTab.Screen 
          name="Menu" 
          component={MenuScreen}
          options={{ title: 'Thực đơn' }}
        />
        <MainTab.Screen 
          name="Employees" 
          component={EmployeeScreen}
          options={{ title: 'Nhân viên' }}
        />
      </MainTab.Navigator>

      <MenuModal
        visible={menuVisible}
        onClose={handleMenuClose}
        onNavigate={handleMenuNavigate}
      />
    </View>
  );
};

export const AppNavigator = () => {
  const { isAuthenticated, checkAuth, isLoading, clearAuth } = useAuthStore();
  const theme = useTheme();

  // Setup logout handler for axios interceptor
  React.useEffect(() => {
    const { setLogoutHandler } = require('../utils/authUtils');
    setLogoutHandler(() => {
      console.log('🔄 Logout triggered by 401 response');
      clearAuth();
    });
  }, [clearAuth]);

  // Check authentication on app start
  React.useEffect(() => {
    const initAuth = async () => {
      console.log('🚀 App starting - checking auth...');
      
      // Only check auth if there's potentially a token
      try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        if (token) {
          console.log('🔑 Token found, validating...');
          await checkAuth();
        } else {
          console.log('❌ No token found, skipping validation');
          // Ensure we're in logged out state
          clearAuth();
        }
      } catch (error) {
        console.error('❌ Error during auth init:', error);
        clearAuth();
      }
    };
    initAuth();
  }, [checkAuth, clearAuth]);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <Icon name="loading" size={50} color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.onSurface,
          border: theme.colors.outline,
          notification: theme.colors.error,
        },
      }}
    >
      <RootStack.Navigator 
        screenOptions={{ 
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.onSurface,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {isAuthenticated ? (
          <>
            <RootStack.Screen 
              name="Main" 
              component={MainTabNavigator} 
              options={{ headerShown: false }} 
            />
            <RootStack.Screen 
              name="OrderDetail" 
              component={OrderDetailScreen}
              options={{ title: 'Chi tiết đơn hàng' }}
            />
            <RootStack.Screen 
              name="Users" 
              component={UsersScreen}
              options={{ title: 'Quản lý người dùng' }}
            />
            <RootStack.Screen 
              name="Inventory" 
              component={InventoryScreen}
              options={{ title: 'Quản lý kho hàng' }}
            />
            <RootStack.Screen 
              name="Blog" 
              component={BlogScreen}
              options={{ title: 'Quản lý blog' }}
            />
            <RootStack.Screen 
              name="Chat" 
              component={ChatScreen}
              options={{ title: 'Chat hỗ trợ' }}
            />
            <RootStack.Screen 
              name="Notifications" 
              component={NotificationScreen}
              options={{ title: 'Thông báo' }}
            />
            <RootStack.Screen 
              name="Reviews" 
              component={ReviewScreen}
              options={{ title: 'Quản lý đánh giá' }}
            />
            <RootStack.Screen 
              name="Vouchers" 
              component={VoucherScreen}
              options={{ title: 'Quản lý voucher' }}
            />
            <RootStack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ title: 'Cài đặt' }}
            />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};