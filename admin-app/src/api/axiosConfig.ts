import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getBaseURL, API_CONFIG, DEBUG_CONFIG, STORAGE_KEYS } from "../config/appConfig";
import { clearAuthData, triggerLogout } from "../utils/authUtils";

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Debug logging
if (DEBUG_CONFIG.ENABLE_LOGGING) {
  console.log("🔗 API Base URL:", getBaseURL());
  console.log("🔧 Development mode:", __DEV__);
  console.log("📱 Platform:", require('react-native').Platform.OS);
  console.log("⚙️ API Config:", API_CONFIG);
}

// Request interceptor để thêm token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      
      // Debug logging for token
      if (DEBUG_CONFIG.LOG_REQUESTS) {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        console.log(`� Full URL: ${config.baseURL}${config.url}`);
        console.log(`�🔑 Token status:`, token ? `Present (${token.substring(0, 20)}...)` : 'NOT FOUND');
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.log("⚠️ No token found in AsyncStorage - user may not be logged in");
      }
      
    } catch (error) {
      if (DEBUG_CONFIG.LOG_ERRORS) {
        console.log("❌ Error getting token:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => {
    if (DEBUG_CONFIG.LOG_RESPONSES) {
      console.log(`✅ API Success: ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    if (DEBUG_CONFIG.LOG_ERRORS) {
      console.log("❌ API Error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
        }
      });
    }
    
    if (error.response?.status === 401) {
      console.log("🔑 401 Unauthorized - Token expired or invalid");
      
      // Clear all authentication data
      await clearAuthData();
      
      // Trigger logout and redirect to login screen
      triggerLogout();
      console.log("🔄 Redirecting to login screen...");
    }
    return Promise.reject(error);
  }
);

export default api;