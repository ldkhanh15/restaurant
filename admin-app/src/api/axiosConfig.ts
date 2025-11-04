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

// Response interceptor để xử lý response và lỗi (giống admin-web)
api.interceptors.response.use(
  (response) => {
    if (DEBUG_CONFIG.LOG_RESPONSES) {
      console.log(`✅ API Success: ${response.config.url}`);
      console.log(`📦 Response.data:`, response.data);
    }
    
    // Unwrap response.data.data như admin-web
    // Backend structure: { status: "success", data: {...} }
    // Interceptor unwraps to return data directly
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    
    // Fallback: return response.data if structure is different
    return response.data;
  },
  async (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || error.message || "Đã xảy ra lỗi";
    const url = error.config?.url || '';
    
    if (DEBUG_CONFIG.LOG_ERRORS) {
      console.log("❌ API Error:", {
        message,
        status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
        }
      });
    }
    
    // Xử lý lỗi 401 - Unauthorized (giống admin-web)
    // KHÔNG logout nếu đang ở login/signup endpoint (sai credentials là bình thường)
    if (status === 401 && !url.includes('/auth/login') && !url.includes('/auth/signup')) {
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