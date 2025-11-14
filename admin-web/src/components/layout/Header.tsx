"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationWidget } from "@/components/shared/NotificationWidget";
import { useAuthStore } from "@/store/authStore";
import { useAuthStore } from "@/store/authStore";

const moduleNames: Record<string, string> = {
  dashboard: "Tổng quan",
  users: "Quản lý người dùng",
  menu: "Quản lý thực đơn",
  orders: "Quản lý đơn hàng",
  reservations: "Quản lý đặt bàn",
  inventory: "Quản lý kho hàng",
  employees: "Quản lý nhân viên",
  blog: "Quản lý blog",
  chat: "Hệ thống chat",
  notifications: "Trung tâm thông báo",
  complaints: "Khiếu nại",
  reviews: "Đánh giá",
  vouchers: "Quản lý voucher",
  table: "Quản lý bàn/sơ đồ bàn",
  supplier: "Quản lý nhà cung cấp",
  event: "Quản lý sự kiện",
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const current = pathname?.split("/")[1] || "dashboard";
  const title = moduleNames[current] || "Tổng quan";
  const { token, user, setToken, setUser } = useAuthStore();

  console.log("User:", user);
  console.log("Token:", token);

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  // Hàm rút gọn username nếu quá dài
  const truncateUsername = (username: string, maxLength: number = 15) => {
    if (username.length <= maxLength) return username;
    return `${username.substring(0, maxLength)}...`;
  };

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between relative z-50">
      <div>
        <h2 className="text-2xl font-bold text-card-foreground">{title}</h2>
      </div>

      <div className="flex items-center gap-4 relative">
        <NotificationWidget />

        {token && user ? (
          <>
            {/* Dropdown menu với thông tin user */}
            <DropdownMenu
              onOpenChange={(isOpen) =>
                console.log("Dropdown open state:", isOpen)
              }
              modal={false}
            >
              <DropdownMenuTrigger
                className="relative h-10 w-10 rounded-full hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center border-0 bg-transparent cursor-pointer"
                onClick={(e) => {
                  console.log("Direct trigger clicked!", e);
                  e.stopPropagation();
                }}
              >
                <Avatar className="h-10 w-10 pointer-events-none">
                  <AvatarImage
                    src="/default-avatar.png"
                    alt={user.username || "User"}
                  />
                  <AvatarFallback>
                    {user.username
                      ? user.username.charAt(0).toUpperCase()
                      : "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 z-[9999] bg-background border shadow-lg"
                align="end"
                side="bottom"
                sideOffset={8}
                avoidCollisions={true}
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {truncateUsername(user.username || "User")}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email || "admin@restaurant.com"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => console.log("Profile clicked")}
                >
                  <span className="mr-2 text-sm">👤</span>
                  <span>Hồ sơ</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => console.log("Settings clicked")}
                >
                  <span className="mr-2 text-sm">⚙️</span>
                  <span>Cài đặt</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <span className="mr-2 text-sm">↗️</span>
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          /* Hiển thị khi user chưa đăng nhập */
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/login")}
              className="h-9 px-4"
            >
              Đăng nhập
            </Button>
            <Button
              variant="default"
              onClick={() => router.push("/register")}
              className="h-9 px-4"
            >
              Đăng ký
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
