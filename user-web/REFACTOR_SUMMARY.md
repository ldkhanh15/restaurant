# Refactor Summary - User Web Project

## ✅ Đã hoàn thành

### 1. Cấu trúc src/ mới

- ✅ Tạo thư mục `src/` trong root
- ✅ Di chuyển toàn bộ code vào `src/`:
  - `src/app/` - Next.js App Router pages
  - `src/components/` - React components
  - `src/lib/` - Utilities, auth, router
  - `src/hooks/` - Custom React hooks
  - `src/providers/` - Context providers
  - `src/services/` - API services
  - `src/styles/` - Global styles

### 2. Cập nhật Config Files

- ✅ `tsconfig.json` - Path aliases trỏ về `src/*`
- ✅ `components.json` - CSS path trỏ về `src/styles/globals.css`
- ✅ `package.json` - Thêm `framer-motion` cho animations

### 3. Theme Sang Trọng

- ✅ Tạo theme mới với màu vàng nhẹ (gold) và cream
- ✅ Font chữ thanh lịch:
  - Playfair Display (headings, elegant text)
  - Lora (serif, body text)
  - Inter (sans-serif, UI elements)
- ✅ Color palette:
  - Primary: Rich warm gold (oklch(0.45 0.12 75))
  - Accent: Elegant gold (oklch(0.55 0.15 80))
  - Background: Cream white (oklch(0.98 0.015 85))
  - Custom gold gradients và cream backgrounds

### 4. App Router Structure

Đã tạo các routes theo Next.js App Router:

- ✅ `/menu` - Thực đơn
- ✅ `/tables` - Danh sách bàn
- ✅ `/reservations` - Đặt bàn
- ✅ `/orders` - Đặt món
- ✅ `/blog` - Blog
- ✅ `/events` - Sự kiện
- ✅ `/vouchers` - Vouchers
- ✅ `/profile` - Hồ sơ
- ✅ `/dishes/[id]` - Chi tiết món
- ✅ `/tables/[id]` - Chi tiết bàn
- ✅ `/events/[id]` - Chi tiết sự kiện

### 5. Component Improvements

- ✅ **Header**:

  - Thêm Framer Motion animations
  - Mobile menu với animations
  - Gradient gold buttons
  - Elegant hover effects
  - Responsive design

- ✅ **Layout**:
  - Cập nhật để dùng theme mới
  - Loading spinner với animation
  - Font loading optimization

### 6. Global Styles

- ✅ Custom scrollbar với gold accent
- ✅ Smooth transitions
- ✅ Custom animations (fadeInUp, shimmer)
- ✅ Gradient utilities (bg-gradient-gold, bg-gradient-cream)
- ✅ Text gradients (text-gradient-gold)

## 📝 Cần hoàn thiện tiếp

### 1. Cập nhật Imports

- ⏳ Kiểm tra và cập nhật tất cả imports trong components để dùng path aliases `@/*`
- ⏳ Đảm bảo các imports từ `@/components/*`, `@/lib/*`, etc. đều đúng

### 2. Cải thiện UI Modules

Các component sau cần được cải thiện với UI sang trọng:

- ⏳ **Order module** (`order-placement.tsx`, `order-tracking-page.tsx`):
  - Large dish images
  - Easy quantity selection
  - Elegant cart UI
- ⏳ **Table module** (`table-listing.tsx`, `table-detail-page.tsx`):
  - Table diagram hoặc elegant list
  - Status indicators (available/reserved/occupied)
  - Luxury styling
- ⏳ **Reservation module** (`reservation-booking.tsx`):
  - Elegant date/time picker
  - Professional form design
  - Smooth animations
- ⏳ **Dish module** (`menu-browser.tsx`, `dish-detail-page.tsx`):
  - HD images with zoom
  - Clean descriptions
  - Chef's choice badges
  - Promotions display
- ⏳ **Blog module** (`blog-system.tsx`):
  - Magazine-style layout
  - Large cover images
  - Readable typography
- ⏳ **Voucher module** (`vouchers-page.tsx`):
  - Card design
  - Soft hover effects
  - Prominent "Use Now" CTA

### 3. Framer Motion Animations

- ⏳ Thêm page transitions
- ⏳ Component entrance animations
- ⏳ Hover effects cho cards
- ⏳ Smooth scroll animations

### 4. Responsive Design

- ⏳ Mobile-first approach
- ⏳ Tablet optimizations
- ⏳ Desktop enhancements
- ⏳ Touch-friendly interactions

### 5. Homepage Migration

- ⏳ Migrate homepage từ custom router sang Next.js App Router
- ⏳ Sử dụng Next.js Link thay vì custom navigate
- ⏳ SEO optimization với metadata

## 🎨 Design Guidelines

### Colors

- **Primary Gold**: `oklch(0.45 0.12 75)` - Main actions, buttons
- **Accent Gold**: `oklch(0.55 0.15 80)` - Highlights, badges
- **Cream Background**: `oklch(0.98 0.015 85)` - Main background
- **Warm Beige**: `oklch(0.92 0.02 80)` - Secondary backgrounds

### Typography

- **Headings**: Playfair Display (elegant, serif)
- **Body**: Lora (readable, serif) hoặc Inter (modern, sans)
- **UI**: Inter (clean, sans-serif)

### Spacing

- Consistent padding: `px-4 sm:px-6 lg:px-8`
- Card spacing: `gap-6` hoặc `gap-8`
- Section padding: `py-16` hoặc `py-24`

### Animations

- Duration: `200ms` cho quick interactions
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Hover scale: `1.05` hoặc `1.1`
- Tap scale: `0.95`

## 🚀 Next Steps

1. Chạy `npm install` để cài framer-motion
2. Test tất cả routes hoạt động
3. Cải thiện từng module với UI mới
4. Thêm animations cho user experience tốt hơn
5. Test responsive trên các devices

## 📁 Cấu trúc thư mục mới

```
user-web/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx      # Homepage
│   │   ├── menu/
│   │   ├── tables/
│   │   ├── reservations/
│   │   ├── orders/
│   │   ├── blog/
│   │   ├── events/
│   │   ├── vouchers/
│   │   ├── profile/
│   │   └── dishes/[id]/
│   ├── components/       # React components
│   │   ├── ui/          # Shadcn/ui components
│   │   └── *.tsx        # Feature components
│   ├── lib/             # Utilities
│   ├── hooks/           # Custom hooks
│   ├── providers/       # Context providers
│   ├── services/        # API services
│   └── styles/          # Global styles
├── public/              # Static assets
├── tsconfig.json
├── package.json
└── next.config.mjs
```
