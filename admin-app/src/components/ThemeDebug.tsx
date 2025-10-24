import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from 'react-native-paper';

export const ThemeDebug: React.FC = () => {
  const theme = useTheme();
  
  console.log('Theme object:', JSON.stringify(theme, null, 2));
  
  return (
    <View>
      <Text>Theme Debug Component</Text>
      <Text>Theme version: {theme.version}</Text>
      <Text>Theme dark: {theme.dark ? 'true' : 'false'}</Text>
    </View>
  );
};