import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card as PaperCard, Text, useTheme } from 'react-native-paper';
import { spacing, shadows } from '@/theme';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: any;
  onPress?: () => void;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  style,
  onPress,
  elevated = true,
}) => {
  const theme = useTheme();

  return (
    <PaperCard
      style={[
        styles.card,
        elevated && shadows.md,
        { backgroundColor: theme.colors.surface },
        style,
      ]}
      onPress={onPress}
    >
      {(title || subtitle) && (
        <PaperCard.Title
          title={title}
          subtitle={subtitle}
          titleStyle={{ color: theme.colors.onSurface }}
          subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
        />
      )}
      <PaperCard.Content>
        {children}
      </PaperCard.Content>
    </PaperCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    borderRadius: 12,
  },
});