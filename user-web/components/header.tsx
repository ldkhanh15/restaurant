"use client"
import { useAuth } from "@/lib/auth"
import { useRouter } from "@/lib/router"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Clock } from "lucide-react"

export default function Header() {
  const { user } = useAuth()
  const { navigate } = useRouter()

  return (
    <nav className="border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => navigate("home")}
              className="font-bold text-2xl tracking-tight text-primary hover:text-accent transition-colors"
            >
              Maison Élégante
            </button>
            <div className="ml-3 text-sm text-muted-foreground font-light">Fine Dining Experience</div>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center space-x-12">
            <button
              onClick={() => navigate("home")}
              className="text-sm font-medium text-primary hover:text-accent transition-colors"
            >
              Trang Chủ
            </button>
            <button
              onClick={() => navigate("menu")}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Thực Đơn
            </button>
            <button
              onClick={() => navigate("tables")}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Bàn Ăn
            </button>
            {user && (
              <button
                onClick={() => navigate("reservations")}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Đặt Bàn
              </button>
            )}
            <button
              onClick={() => navigate("events")}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Sự Kiện
            </button>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("order-tracking")}>
                  <Clock className="h-4 w-4" />
                </Button>
                <button
                  onClick={() => navigate("profile")}
                  className="flex items-center space-x-2 hover:bg-muted/50 rounded-lg px-3 py-2 transition-colors"
                >
                  <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-accent" />
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium">{user.full_name}</p>
                    <Badge variant="secondary" className="bg-accent/20 text-accent text-xs">
                      {user.ranking}
                    </Badge>
                  </div>
                </button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("login")}>
                  Đăng Nhập
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("register")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Đặt Bàn Ngay
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
