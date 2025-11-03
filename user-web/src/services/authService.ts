"use client";

import apiClient from "@/lib/apiClient";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  status: string;
  data: {
    user: {
      id: string;
      username: string;
      email: string;
      role: string;
    };
    token: string;
  };
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role: string;
  full_name?: string;
  ranking?: string;
  points?: number;
}

export interface GetCurrentUserResponse {
  status: string;
  data: UserInfo;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  role?: "customer" | "employee" | "admin";
}

export interface SignupResponse {
  status: string;
  data: {
    user: {
      id: string;
      username: string;
      email: string;
      role: string;
    };
    token: string;
  };
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>("/auth/login", { email, password });
  },

  signup: async (data: SignupRequest): Promise<SignupResponse> => {
    return apiClient.post<SignupResponse>("/auth/signup", data);
  },

  getCurrentUser: async (): Promise<GetCurrentUserResponse> => {
    return apiClient.get<GetCurrentUserResponse>("/auth/me");
  },

  validateToken: async () => {
    return apiClient.get("/auth/validate");
  },
};
