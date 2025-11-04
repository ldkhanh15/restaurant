"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Clock, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/notification/NotificationBell";

export default function Header() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Trang Chủ" },
    { href: "/menu", label: "Thực Đơn" },
    { href: "/tables", label: "Bàn Ăn" },
    ...(user
      ? [
          { href: "/reservations", label: "Đặt Bàn" },
          { href: "/reservations/list", label: "Lịch Đặt Bàn" },
          { href: "/orders", label: "Đơn Hàng" },
        ]
      : []),
    { href: "/events", label: "Sự Kiện" },
    { href: "/blog", label: "Blog" },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="border-b border-border/30 bg-background/80 backdrop-blur-md sticky top-0 z-50 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/"
              className="font-elegant font-bold text-2xl tracking-tight text-primary hover:text-accent transition-colors"
            >
              HIWELL
            </Link>
            <div className="ml-3 text-xs text-muted-foreground font-serif italic hidden sm:block">
              Fine Dining Experience
            </div>
          </motion.div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors relative group",
                  isActive(item.href)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "absolute bottom-0 left-0 h-0.5 bg-accent transition-all duration-300",
                    isActive(item.href) ? "w-full" : "w-0 group-hover:w-full"
                  )}
                />
              </Link>
            ))}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <NotificationBell />
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Link href="/orders">
                    <Button variant="ghost" size="sm" className="relative">
                      <Clock className="h-4 w-4" />
                    </Button>
                  </Link>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 hover:bg-muted/50 rounded-lg px-3 py-2 transition-colors"
                >
                  <Link href="/profile" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-accent" />
                    </div>
                    <div className="text-left hidden md:block">
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <Badge
                        variant="secondary"
                        className="bg-accent/20 text-accent text-xs"
                      >
                        {user.ranking}
                      </Badge>
                    </div>
                  </Link>
                </motion.button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Đăng Nhập
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Đặt Bàn Ngay
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden border-t border-border/30 bg-background/95 backdrop-blur-md"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-primary"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
