"use client";

import { useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";

interface UseEnsureAuthenticatedOptions {
  redirectTo?: string;
}

export function useEnsureAuthenticated(
  options: UseEnsureAuthenticatedOptions = {}
) {
  const { redirectTo = "/login" } = options;
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
    if (!isLoading && !user) {
      const encoded = encodeURIComponent(redirectTarget);
      router.replace(`${redirectTo}?redirect=${encoded}`);
    }
  }, [isLoading, user, router, redirectTo, redirectTarget]);

  return { user, isLoading };
}
