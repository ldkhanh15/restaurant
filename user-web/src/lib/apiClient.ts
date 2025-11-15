const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:8000";

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}/api${endpoint}`;

    // Get token, but validate it exists and is not empty
    // For walk-in customers, we should not send token at all
    const token = localStorage.getItem("auth_token");
    const hasValidToken = token && token.trim().length > 0;

    // Check if we're in a walk-in customer context (no user logged in)
    // If there's no user in localStorage/auth context, don't send token
    // Note: user is stored as "restaurant_user" in auth.tsx
    const userStr = localStorage.getItem("restaurant_user");
    const isWalkInCustomer =
      !userStr || userStr === "null" || userStr === "undefined";

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        // Only add Authorization header if token exists, is valid, and user is logged in
        // Don't send token for walk-in customers
        ...(hasValidToken &&
          !isWalkInCustomer && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // If 401 and we have a token, it might be expired or invalid
        // For walk-in customers, we should not send token at all
        // But if we get 401 with a token, it means the token is invalid
        if (response.status === 401 && hasValidToken) {
          // Check if this is a walk-in customer scenario (no user logged in)
          // If the error message suggests invalid token, we might want to clear it
          // But be careful - only clear if it's clearly an auth error
          const errorMsg = data?.message || data?.error || "";
          if (
            errorMsg.includes("token") ||
            errorMsg.includes("expired") ||
            errorMsg.includes("Invalid")
          ) {
            // Token is invalid - but don't clear it automatically
            // The auth system should handle token refresh/removal
            console.warn(
              "[apiClient] Received 401 with token - token may be invalid"
            );
          }
        }
        const errorMessage =
          data?.message || data?.error || `HTTP ${response.status}`;
        const error: any = new Error(errorMessage);
        error.response = { data, status: response.status };
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error("API Error:", error);
      throw error;
    }
  }

  get<T>(
    endpoint: string,
    config?: { params?: Record<string, any> }
  ): Promise<T> {
    let url = endpoint;
    if (config?.params) {
      const params = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      url += `?${params.toString()}`;
    }
    return this.request<T>(url, { method: "GET" });
  }

  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

const apiClient = new ApiClient(API_URL);

export default apiClient;
