import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Divider, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface MenuModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

export const MenuModal = ({ visible, onClose, onNavigate }: MenuModalProps) => {
  const theme = useTheme();

  if (!visible) return null;

  const menuItems = [
    { key: 'users', title: 'Người dùng', icon: 'account-group' },
    { key: 'inventory', title: 'Kho hàng', icon: 'package-variant' },
    { key: 'blog', title: 'Blog', icon: 'post' },
    { key: 'chat', title: 'Chat', icon: 'chat' },
    { key: 'notifications', title: 'Thông báo', icon: 'bell' },
    { key: 'reviews', title: 'Đánh giá', icon: 'star' },
    { key: 'vouchers', title: 'Voucher', icon: 'ticket-percent' },
    { key: 'settings', title: 'Cài đặt', icon: 'cog' },
  ];

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />
      <View style={[styles.menu, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            Menu
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
        </View>
        
        <Divider />
        
        <ScrollView style={styles.menuContent}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.menuItem}
              onPress={() => {
                console.log('Menu item pressed:', item.key);
                onNavigate(item.key);
              }}
            >
              <Icon name={item.icon} size={20} color={theme.colors.onSurface} />
              <Text style={[styles.menuItemText, { color: theme.colors.onSurface }]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60, // Account for status bar
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuContent: {
    flex: 1,
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  menuItemText: {
    fontSize: 18,
    marginLeft: 16,
  },
});