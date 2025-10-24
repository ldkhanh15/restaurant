import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppNavigator } from './src/navigation';
import { useThemeStore } from './src/store';
import { lightTheme, darkTheme } from './src/theme';

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

  const theme = isDarkMode 
    ? { ...MD3DarkTheme, ...darkTheme }
    : { ...MD3LightTheme, ...lightTheme };

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