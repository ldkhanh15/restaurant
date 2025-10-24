import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, getBaseURL } from '../config/appConfig';

// Key to store the last used API base URL
const LAST_API_URL_KEY = 'last_api_url';

export const checkAndClearOldTokens = async () => {
  try {
    const currentApiUrl = getBaseURL();
    const lastApiUrl = await AsyncStorage.getItem(LAST_API_URL_KEY);
    
    console.log('🔍 Checking API URL change...');
    console.log('Current API URL:', currentApiUrl);
    console.log('Last API URL:', lastApiUrl);
    
    // If API URL changed, clear old tokens
    if (lastApiUrl && lastApiUrl !== currentApiUrl) {
      console.log('🧹 API URL changed - clearing old tokens...');
      
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.USER,
        STORAGE_KEYS.LAST_LOGIN
      ]);
      
      console.log('✅ Old tokens cleared due to API URL change');
    }
    
    // Save current API URL for next time
    await AsyncStorage.setItem(LAST_API_URL_KEY, currentApiUrl);
    
  } catch (error) {
    console.error('❌ Error checking API URL change:', error);
  }
};