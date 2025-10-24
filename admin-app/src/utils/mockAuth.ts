import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/appConfig';

// Temporary mock auth for testing
export const createMockAuth = async () => {
  try {
    const mockToken = 'mock-admin-token-for-testing';
    const mockUser = {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@restaurant.com',
      role: 'admin'
    };

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.TOKEN, mockToken],
      [STORAGE_KEYS.USER, JSON.stringify(mockUser)],
      [STORAGE_KEYS.LAST_LOGIN, new Date().toISOString()]
    ]);

    console.log('🎭 Mock authentication created');
    console.log('Token:', mockToken);
    console.log('User:', mockUser);
    
    return { token: mockToken, user: mockUser };
  } catch (error) {
    console.error('❌ Error creating mock auth:', error);
    throw error;
  }
};

export const removeMockAuth = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.USER,
      STORAGE_KEYS.LAST_LOGIN
    ]);
    console.log('🗑️ Mock auth removed');
  } catch (error) {
    console.error('❌ Error removing mock auth:', error);
  }
};