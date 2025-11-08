"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoginPage from "@/components/login-page";
import { useAuth } from "@/lib/auth";

export default function LoginRoutePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get("redirect") || "/";

  const safeRedirect = useMemo(() => {
    return redirectParam.startsWith("/") ? redirectParam : "/";
  }, [redirectParam]);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(safeRedirect);
    }
  }, [user, isLoading, router, safeRedirect]);

  return <LoginPage redirectTo={safeRedirect} />;
}
