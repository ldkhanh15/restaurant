"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, Lock, Mail, Crown } from "lucide-react";
import { authService, LoginPayload } from "@/services/authService";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/authStore";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { setToken, setUser } = useAuthStore();

  const [formData, setFormData] = useState<LoginPayload>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Check for unauthorized error from query params
  useEffect(() => {
    const errorParam = searchParams?.get("error");
    if (errorParam === "unauthorized") {
      setError(
        "Bạn không có quyền truy cập hệ thống quản lý. Chỉ admin và nhân viên mới được phép."
      );
      toast({
        title: "Không có quyền truy cập",
        description:
          "Chỉ admin và nhân viên mới có thể đăng nhập vào hệ thống quản lý",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await authService.login(formData);
      console.log("Login response:", response);
      if (response.token) {
        // Validate role - only admin and employee allowed in admin-web
        const userRole = response.user?.role || "";
        const allowedRoles = ["admin", "employee", "staff"];

        // Map backend "employee" to frontend "staff"
        const mappedRole = userRole === "employee" ? "staff" : userRole;

        if (!allowedRoles.includes(mappedRole)) {
          setError(
            "Chỉ admin và nhân viên mới có thể đăng nhập vào hệ thống quản lý"
          );
          toast({
            title: "Không có quyền truy cập",
            description:
              "Chỉ admin và nhân viên mới có thể đăng nhập vào hệ thống quản lý",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));

        // Set token and user in store
        setToken(response.token);
        setUser({
          id: response.user.id,
          email: response.user.email,
          username: response.user.username,
          role: mappedRole as "admin" | "staff" | "customer",
        });

        toast({
          title: "Đăng nhập thành công",
          description: `Chào mừng ${response.user.username}!`,
          variant: "success",
        });

        router.push("/");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.message || "Đăng nhập thất bại";
      setError(errorMessage);
      toast({
        title: "Lỗi đăng nhập",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Crown className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold gold-text mb-2">
            Restaurant Admin
          </h1>
          <p className="text-muted-foreground">Đăng nhập để quản lý nhà hàng</p>
        </div>

        <Card className="luxury-card shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center font-semibold">
              Đăng nhập
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Nhập thông tin đăng nhập của bạn
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@restaurant.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="pl-10 luxury-focus"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="pl-10 pr-10 luxury-focus"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full luxury-button h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Chưa có tài khoản?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-semibold text-primary hover:text-primary/80"
                  onClick={() => router.push("/signup")}
                >
                  Đăng ký ngay
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            © 2024 Restaurant Management System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
