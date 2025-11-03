"use client";

import { useEffect } from "react";
import RegisterPage from "@/components/register-page";
import { useAuth } from "@/lib/auth";

export default function RegisterRoutePage() {
  const { user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      window.location.href = "/";
    }
  }, [user]);

  return <RegisterPage />;
}
