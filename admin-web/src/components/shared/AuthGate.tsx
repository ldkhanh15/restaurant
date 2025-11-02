"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { token, user, setToken, setUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Load user info when token exists but user is not loaded
  useEffect(() => {
    const loadUser = async () => {
      if (token && !user) {
        console.log(
          "🔍 Token exists but user not loaded, fetching user info..."
        );
        try {
          const userInfo = await authService.getCurrentUser();
          // Map backend role "employee" to frontend role "staff"
          const mappedRole =
            userInfo.role === "employee"
              ? "staff"
              : userInfo.role === "admin"
              ? "admin"
              : "customer";

          setUser({
            id: userInfo.id,
            email: userInfo.email,
            username: userInfo.username,
            role: mappedRole,
          });
          console.log("✅ User info loaded from API:", userInfo);
        } catch (error: any) {
          console.error("❌ Failed to load user info:", error);
          // If token is invalid, clear it
          if (error?.response?.status === 401) {
            setToken(null);
            setUser(null);
            if (typeof window !== "undefined") {
              localStorage.removeItem("token");
            }
            router.replace("/login");
          }
        }
      }
    };

    loadUser();
  }, [token, user, setUser, setToken, router]);

  // Redirect to login if no token (but only after trying to load user)
  useEffect(() => {
    if (!token && pathname !== "/login" && pathname !== "/signup") {
      router.replace("/login");
    }
  }, [token, pathname, router]);

  return <>{children}</>;
}
