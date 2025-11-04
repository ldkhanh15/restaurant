// Import polyfills FIRST before anything else
import 'react-native-url-polyfill/auto';

import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppNavigator } from './src/navigation';
import { useThemeStore, useAuthStore } from './src/store';
import { lightTheme, darkTheme } from './src/theme';
import { initializeSocket, disconnectSocket } from './src/utils/socketClient';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const { isDarkMode } = useThemeStore();
  const { isAuthenticated } = useAuthStore();

  const theme = isDarkMode 
    ? { ...MD3DarkTheme, ...darkTheme }
    : { ...MD3LightTheme, ...lightTheme };

  // Initialize WebSocket when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔌 Initializing WebSocket connection...');
      initializeSocket().catch((error) => {
        console.error('❌ Failed to initialize WebSocket:', error);
      });

      return () => {
        console.log('🔌 Disconnecting WebSocket...');
        disconnectSocket();
      };
    }
  }, [isAuthenticated]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <StatusBar style={isDarkMode ? 'light' : 'dark'} />
          <AppNavigator />
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}