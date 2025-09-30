import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface LuxuryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

const LuxuryButton: React.FC<LuxuryButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  disabled = false,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const renderButton = () => {
    if (variant === 'primary') {
      return (
        <LinearGradient
          colors={disabled ? ['#666666', '#333333'] : ['#D4AF37', '#B8941F']}
          style={[styles.button, style]}
        >
          <Text style={[styles.text, styles.primaryText, textStyle]}>{title}</Text>
        </LinearGradient>
      );
    }

    return (
      <AnimatedTouchableOpacity
        style={[
          styles.button,
          variant === 'outline' ? styles.outlineButton : styles.secondaryButton,
          disabled && styles.disabledButton,
          style,
        ]}
      >
        <Text
          style={[
            styles.text,
            variant === 'outline' ? styles.outlineText : styles.secondaryText,
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      </AnimatedTouchableOpacity>
    );
  };

  return (
    <AnimatedTouchableOpacity
      style={animatedStyle}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={variant === 'primary' ? 1 : 0.8}
    >
      {renderButton()}
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  secondaryButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  disabledButton: {
    backgroundColor: '#333333',
    borderColor: '#666666',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#000000',
  },
  secondaryText: {
    color: '#D4AF37',
  },
  outlineText: {
    color: '#D4AF37',
  },
  disabledText: {
    color: '#999999',
  },
});

export default LuxuryButton;