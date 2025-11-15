"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ShieldX } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: Array<"customer" | "user">;
  fallback?: React.ReactNode;
}

export default function RoleGuard({
  children,
  allowedRoles = ["customer", "user"],
  fallback,
}: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoading) {
      setIsAuthorized(null);
      return;
    }

    if (!user) {
      setIsAuthorized(false);
      return;
    }

    // For user-web, only customers/users should access
    // Block admin and employee roles
    const userRole = user.role || "";
    const blockedRoles = ["admin", "employee", "staff"];
    
    if (blockedRoles.includes(userRole)) {
      setIsAuthorized(false);
      console.warn(
        `⚠️ RoleGuard: User role "${userRole}" is not allowed in user-web`
      );
      return;
    }

    // Check if user role is in allowed roles
    const hasAccess = allowedRoles.some(
      (role) => role === userRole || role === "user" || role === "customer"
    );
    setIsAuthorized(hasAccess);
  }, [user, isLoading, allowedRoles]);

  if (isLoading || isAuthorized === null) {
    // Still checking
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="max-w-md border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <ShieldX className="h-5 w-5" />
              <CardTitle>Không có quyền truy cập</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 mb-1">
                  Bạn không có quyền truy cập trang này
                </p>
                <p className="text-xs text-red-700">
                  Trang này chỉ dành cho khách hàng
                </p>
                {user && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Vai trò hiện tại của bạn: {user.role || "N/A"}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full"
            >
              Về trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

