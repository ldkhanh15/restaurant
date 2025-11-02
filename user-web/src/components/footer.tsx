"use client"
import { useRouter } from "@/lib/router"
import { Star, MapPin, Phone, Mail } from "lucide-react"

export default function Footer() {
  const { navigate } = useRouter()

  return (
    <footer className="bg-primary text-primary-foreground py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Restaurant Info */}
          <div>
            <div className="font-bold text-2xl mb-4">Maison Élégante</div>
            <p className="opacity-90 mb-6 leading-relaxed">
              Nhà hàng cao cấp mang đến trải nghiệm ẩm thực đẳng cấp thế giới với không gian sang trọng và dịch vụ
              chuyên nghiệp.
            </p>
            <div className="flex items-center space-x-2 mb-2">
              <Star className="h-4 w-4 text-yellow-400" />
              <span className="text-sm">Michelin Recommended</span>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Liên Hệ</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 opacity-75" />
                <span className="text-sm opacity-90">123 Đường ABC, Quận 1, TP.HCM</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 opacity-75" />
                <span className="text-sm opacity-90">+84 901 234 567</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 opacity-75" />
                <span className="text-sm opacity-90">info@maisonelegante.vn</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Dịch Vụ</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate("menu")}
                className="block text-sm opacity-90 hover:opacity-100 transition-opacity"
              >
                Thực Đơn
              </button>
              <button
                onClick={() => navigate("reservations")}
                className="block text-sm opacity-90 hover:opacity-100 transition-opacity"
              >
                Đặt Bàn
              </button>
              <button
                onClick={() => navigate("events")}
                className="block text-sm opacity-90 hover:opacity-100 transition-opacity"
              >
                Sự Kiện Riêng
              </button>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Giờ Mở Cửa</h3>
            <div className="space-y-2 text-sm opacity-90">
              <div className="flex justify-between">
                <span>Thứ 2 - Thứ 6:</span>
                <span>11:00 - 22:00</span>
              </div>
              <div className="flex justify-between">
                <span>Thứ 7 - Chủ Nhật:</span>
                <span>10:00 - 23:00</span>
              </div>
              <div className="flex justify-between">
                <span>Ngày lễ:</span>
                <span>10:00 - 22:00</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8 text-center">
          <p className="text-sm opacity-75">© 2024 Maison Élégante. Tất cả quyền được bảo lưu. | Thiết kế bởi v0.app</p>
        </div>
      </div>
    </footer>
  )
}
