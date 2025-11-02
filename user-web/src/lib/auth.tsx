"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { authService } from "@/services/authService";

interface User {
  id: string;
  username: string;
  full_name?: string;
  email: string;
  phone?: string;
  ranking?: string;
  points?: number;
  role?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token and user from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("restaurant_user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));

      // Validate token and refresh user info
      authService
        .getCurrentUser()
        .then((response) => {
          if (response?.data) {
            setUser(response.data as User);
            localStorage.setItem(
              "restaurant_user",
              JSON.stringify(response.data)
            );
          }
        })
        .catch(() => {
          // Token invalid, clear auth
          setToken(null);
          setUser(null);
          localStorage.removeItem("auth_token");
          localStorage.removeItem("restaurant_user");
        });
    }
    setIsLoading(false);
  }, []);

  const refreshUser = async () => {
    if (!token) return;
    try {
      const response = await authService.getCurrentUser();
      if (response?.data) {
        setUser(response.data as User);
        localStorage.setItem("restaurant_user", JSON.stringify(response.data));
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      logout();
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);

      if (response?.status === "success" && response?.data) {
        const { user: userData, token: authToken } = response.data;

        // Save token
        localStorage.setItem("auth_token", authToken);
        setToken(authToken);

        // Get full user info
        try {
          const userInfoResponse = await authService.getCurrentUser();
          if (userInfoResponse?.data) {
            const fullUser: User = {
              id: userInfoResponse.data.id,
              username: userInfoResponse.data.username,
              email: userInfoResponse.data.email,
              phone: userInfoResponse.data.phone,
              full_name: userInfoResponse.data.full_name,
              ranking: userInfoResponse.data.ranking,
              points: userInfoResponse.data.points,
              role: userInfoResponse.data.role,
            };
            setUser(fullUser);
            localStorage.setItem("restaurant_user", JSON.stringify(fullUser));
          } else {
            // Fallback to basic user info
            setUser(userData as User);
            localStorage.setItem("restaurant_user", JSON.stringify(userData));
          }
        } catch (err) {
          // If getCurrentUser fails, use basic user info
          setUser(userData as User);
          localStorage.setItem("restaurant_user", JSON.stringify(userData));
        }

        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authService.signup({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        full_name: userData.full_name,
        phone: userData.phone,
        role: "customer",
      });

      if (response?.status === "success" && response?.data) {
        const { user: userDataResponse, token: authToken } = response.data;

        // Save token
        localStorage.setItem("auth_token", authToken);
        setToken(authToken);

        // Get full user info
        try {
          const userInfoResponse = await authService.getCurrentUser();
          if (userInfoResponse?.data) {
            const fullUser: User = {
              id: userInfoResponse.data.id,
              username: userInfoResponse.data.username,
              email: userInfoResponse.data.email,
              phone: userInfoResponse.data.phone,
              full_name: userInfoResponse.data.full_name,
              ranking: userInfoResponse.data.ranking || "Thành Viên",
              points: userInfoResponse.data.points || 0,
              role: userInfoResponse.data.role,
            };
            setUser(fullUser);
            localStorage.setItem("restaurant_user", JSON.stringify(fullUser));
          } else {
            // Fallback to basic user info
            setUser(userDataResponse as User);
            localStorage.setItem(
              "restaurant_user",
              JSON.stringify(userDataResponse)
            );
          }
        } catch (err) {
          // If getCurrentUser fails, use basic user info
          const basicUser: User = {
            ...userDataResponse,
            ranking: "Thành Viên",
            points: 0,
          };
          setUser(basicUser as User);
          localStorage.setItem("restaurant_user", JSON.stringify(basicUser));
        }

        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Register error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("restaurant_user");
    localStorage.removeItem("auth_token");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, isLoading, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
