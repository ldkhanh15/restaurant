"use client";

import apiClient from "./apiClient";

type LoginPayload = { email: string; password: string };
type SignupPayload = { email: string; password: string; username: string };

interface CurrentUserResponse {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role: "admin" | "employee" | "customer"; // Backend uses "employee", frontend maps to "staff"
  full_name?: string;
  ranking?: string;
  points?: number;
}

export const authService = {
  login: (data: LoginPayload) => apiClient.post("/auth/login", data),
  signup: (data: SignupPayload) => apiClient.post("/auth/signup", data),
  getCurrentUser: (): Promise<CurrentUserResponse> => apiClient.get("/auth/me"),
};

export type { LoginPayload, SignupPayload, CurrentUserResponse };
