"use client";

import { useEffect } from "react";
import LoginPage from "@/components/login-page";
import { useAuth } from "@/lib/auth";

export default function LoginRoutePage() {
  const { user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      window.location.href = "/";
    }
  }, [user]);

  return <LoginPage />;
}
