"use client";

import { useRouter } from "next/navigation";
import { useEnsureAuthenticated } from "@/hooks/useEnsureAuthenticated";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useEffect } from "react";

export default function ReservationGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useEnsureAuthenticated();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=/reservations");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isLoading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Yêu Cầu Đăng Nhập</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Vui lòng đăng nhập để đặt bàn
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push("/login?redirect=/reservations")}
                className="flex-1"
              >
                Đăng Nhập
              </Button>
              <Button
                onClick={() => router.push("/register")}
                variant="outline"
                className="flex-1"
              >
                Đăng Ký
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
