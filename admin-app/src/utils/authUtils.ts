import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/appConfig';

// Auth utilities
export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.USER,
      STORAGE_KEYS.LAST_LOGIN
    ]);
    console.log('🧹 Auth data cleared from AsyncStorage');
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
  }
};

export const saveAuthData = async (token: string, user: any) => {
  try {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.TOKEN, token],
      [STORAGE_KEYS.USER, JSON.stringify(user)],
      [STORAGE_KEYS.LAST_LOGIN, new Date().toISOString()]
    ]);
    console.log('💾 Auth data saved to AsyncStorage');
  } catch (error) {
    console.error('❌ Error saving auth data:', error);
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('❌ Error getting auth token:', error);
    return null;
  }
};

export const getAuthUser = async (): Promise<any | null> => {
  try {
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('❌ Error getting auth user:', error);
    return null;
  }
};

// Global logout handler - can be called from anywhere
let logoutHandler: (() => void) | null = null;

export const setLogoutHandler = (handler: () => void) => {
  logoutHandler = handler;
};

export const triggerLogout = () => {
  if (logoutHandler) {
    logoutHandler();
  }
};