"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ShieldX } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Array<"admin" | "staff" | "employee">;
  fallback?: React.ReactNode;
}

export default function RoleGuard({
  children,
  allowedRoles,
  fallback,
}: RoleGuardProps) {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token || !user) {
      setIsAuthorized(false);
      return;
    }

    // Map backend role "employee" to frontend role "staff"
    const userRole = user.role === "employee" ? "staff" : user.role;

    const hasAccess = allowedRoles.includes(userRole as any);
    setIsAuthorized(hasAccess);

    if (!hasAccess) {
      console.warn(
        `⚠️ RoleGuard: User role "${userRole}" not in allowed roles:`,
        allowedRoles
      );
    }
  }, [user, token, allowedRoles]);

  if (isAuthorized === null) {
    // Still checking
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            Đang kiểm tra quyền truy cập...
          </p>
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
                  Trang này chỉ dành cho: {allowedRoles.join(", ")}
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
              onClick={() => router.back()}
              className="w-full"
            >
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
