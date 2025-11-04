"use client";

import type React from "react";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "@/lib/router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Utensils, Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const { navigate } = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        // Redirect to home page
        window.location.href = "/";
      } else {
        setError("Email hoặc mật khẩu không đúng");
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || "Email hoặc mật khẩu không đúng";
      setError(errorMsg);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("home")}
            className="absolute top-4 left-4 md:top-8 md:left-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Về Trang Chủ
          </Button>

          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Utensils className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Nhà Hàng Cao Cấp</h1>
              <p className="text-sm text-muted-foreground">
                Trải nghiệm ẩm thực đẳng cấp
              </p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold">Đăng Nhập</CardTitle>
            <CardDescription className="text-base">
              Đăng nhập để trải nghiệm đầy đủ dịch vụ của nhà hàng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Nhập email của bạn"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 h-12"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Mật khẩu
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className="pl-10 pr-10 h-12"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Đang đăng nhập..." : "Đăng Nhập"}
              </Button>

              <div className="text-center pt-4">
                <p className="text-muted-foreground">
                  Chưa có tài khoản?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("register")}
                    className="text-primary hover:underline font-medium"
                  >
                    Đăng ký ngay
                  </button>
                </p>
              </div>
            </form>

            {/* Demo Account Info */}
            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2 text-sm">Tài khoản demo:</h4>
              <p className="text-xs text-muted-foreground mb-1">
                Email: demo@restaurant.com
              </p>
              <p className="text-xs text-muted-foreground">Mật khẩu: demo123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
