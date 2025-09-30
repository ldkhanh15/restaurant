import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LuxuryCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
}

const LuxuryCard: React.FC<LuxuryCardProps> = ({ children, style, gradient = false }) => {
  const CardComponent = gradient ? LinearGradient : View;
  const cardProps = gradient
    ? {
        colors: ['rgba(212, 175, 55, 0.1)', 'rgba(0, 0, 0, 0.9)'],
        style: [styles.card, style],
      }
    : { style: [styles.card, style] };

  return <CardComponent {...cardProps}>{children}</CardComponent>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#D4AF37',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
});

export default LuxuryCard;