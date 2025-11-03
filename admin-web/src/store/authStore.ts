"use client";

import { create } from "zustand";

type AuthState = {
  token: string | null;
  user: {
    id: string;
    email: string;
    username?: string;
    role?: "admin" | "staff" | "customer";
  } | null;
  setToken: (token: string | null) => void;
  setUser: (user: AuthState["user"]) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  user: null,
  setToken: (token) => {
    set({ token });
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("token", token);
      else localStorage.removeItem("token");
    }
  },
  setUser: (user) => set({ user }),
  logout: () => {
    if (typeof window !== "undefined") localStorage.removeItem("token");
    set({ token: null, user: null });
  },
  isAuthenticated: () => true,
}));
