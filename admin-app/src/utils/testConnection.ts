// Test connection utility
import { getBaseURL } from '../config/appConfig';

export const testAPIConnection = async () => {
  const baseURL = getBaseURL();
  console.log('🔗 Testing API connection to:', baseURL);
  
  try {
    const response = await fetch(`${baseURL.replace('/api', '')}/health`);
    if (response.ok) {
      console.log('✅ API connection successful');
      return true;
    } else {
      console.log('❌ API connection failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ API connection error:', error);
    return false;
  }
};