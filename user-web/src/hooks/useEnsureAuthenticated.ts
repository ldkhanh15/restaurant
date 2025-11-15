"use client";

import { useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";

interface UseEnsureAuthenticatedOptions {
  redirectTo?: string;
  optional?: boolean; // If true, don't redirect if not authenticated
}

export function useEnsureAuthenticated(
  options: UseEnsureAuthenticatedOptions = {}
) {
  const { redirectTo = "/login", optional = false } = options;
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const redirectTarget = useMemo(() => {
    const search = searchParams?.toString();
    return search && search.length > 0
      ? `${pathname}?${search}`
      : pathname || "/";
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!optional && !isLoading && !user) {
      const encoded = encodeURIComponent(redirectTarget);
      router.replace(`${redirectTo}?redirect=${encoded}`);
    }
  }, [isLoading, user, router, redirectTo, redirectTarget, optional]);

  return { user, isLoading };
}
