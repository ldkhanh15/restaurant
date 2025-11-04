import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { spacing } from '@/theme';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: string;
  color: string;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  color,
  onPress,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onSurfaceVariant }]}>
          {title}
        </Text>
        <Text style={[styles.icon, { color }]}>{icon}</Text>
      </View>
      
      <Text style={[styles.value, { color: theme.colors.onSurface }]}>
        {value}
      </Text>
      
      <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        <Text style={styles.change}>{change}</Text> so với tháng trước
      </Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 12,
    flex: 1,
    marginRight: spacing.xs,
  },
  icon: {
    fontSize: 20,
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 12,
  },
  change: {
    color: '#10b981',
    fontWeight: '600',
  },
});