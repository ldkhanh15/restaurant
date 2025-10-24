import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/appConfig';

export const debugAuth = async () => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    const user = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    
    console.log('🔍 DEBUG AUTH STATE:');
    console.log('Token:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
    console.log('User:', user ? JSON.parse(user) : 'NOT FOUND');
    
    return { token, user: user ? JSON.parse(user) : null };
  } catch (error) {
    console.log('❌ Error checking auth state:', error);
    return { token: null, user: null };
  }
};

export const clearAuth = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    console.log('🗑️ Cleared auth data');
  } catch (error) {
    console.log('❌ Error clearing auth:', error);
  }
};