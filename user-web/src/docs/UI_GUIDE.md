# UI Design Guide - HIWELL Restaurant

## Design Philosophy

HIWELL sử dụng thiết kế luxury với palette màu đen trắng vàng, typography sang trọng, và animations mượt mà để tạo trải nghiệm cao cấp cho khách hàng.

---

## Color Palette

### Primary Colors (Dark/Luxury Theme)

```css
/* Background & Foreground */
--background: oklch(1 0 0); /* Pure white */
--foreground: oklch(0.1 0 0); /* Deep black */

/* Primary Actions */
--primary: oklch(0.1 0 0); /* Deep black for primary buttons/links */
--primary-foreground: oklch(1 0 0); /* White text on primary */

/* Accent (Gold/Elegant) */
--accent: oklch(0.7 0.15 85); /* Warm gold accent */
--accent-foreground: oklch(0.1 0 0); /* Black text on accent */

/* Secondary */
--secondary: oklch(0.15 0 0); /* Charcoal gray */
--secondary-foreground: oklch(1 0 0); /* White text */

/* Muted (Subtle backgrounds/text) */
--muted: oklch(0.95 0 0); /* Light gray for muted backgrounds */
--muted-foreground: oklch(0.4 0 0); /* Medium gray for muted text */

/* Borders */
--border: oklch(0.9 0 0); /* Light gray borders */
```

### Gold Gradient (Special)

Sử dụng cho CTA buttons, highlights, badges premium:

```css
background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
/* hoặc */
bg-gradient-gold class trong Tailwind
```

### Status Colors

- **Success/Green**: `bg-green-500/20 text-green-400 border-green-500/30`
- **Error/Red**: `bg-red-500/20 text-red-400 border-red-500/30`
- **Warning/Orange**: `bg-yellow-500/20 text-yellow-400 border-yellow-500/30`
- **Info/Blue**: `bg-blue-500/20 text-blue-400 border-blue-500/30`

### Table Status Colors

- **Available**: `bg-gradient-to-br from-green-400 to-green-600 border-green-700`
- **Reserved**: `bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-700`
- **Occupied**: `bg-gradient-to-br from-red-400 to-red-600 border-red-700`
- **VIP**: `bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 border-yellow-800 border-2` với glow effect

---

## Typography

### Font Families

1. **Headings (Playfair Display hoặc tương đương)**

   - Classes: `font-elegant` hoặc `font-serif`
   - Sizes: `text-4xl`, `text-5xl`, `text-6xl`, `text-7xl`, `text-8xl`
   - Usage: Hero titles, section headings, feature titles

2. **Body (Inter/Lora)**

   - Classes: `font-sans` (default), `font-serif` cho body text elegant
   - Sizes: `text-sm`, `text-base`, `text-lg`
   - Usage: Paragraphs, descriptions, UI text

3. **UI Elements**
   - Default: `font-sans` với `font-medium` cho buttons, labels

### Typography Scale

```
Hero: text-8xl (128px) - font-bold
H1: text-5xl (48px) - font-bold
H2: text-4xl (36px) - font-bold
H3: text-2xl (24px) - font-semibold
H4: text-xl (20px) - font-semibold
Body Large: text-lg (18px)
Body: text-base (16px)
Small: text-sm (14px)
Tiny: text-xs (12px)
```

### Font Weights

- `font-light` (300): Subtle text, italics
- `font-normal` (400): Body text
- `font-medium` (500): UI elements, buttons
- `font-semibold` (600): Card titles, labels
- `font-bold` (700): Headings, emphasis

---

## Components

### Buttons

#### Primary Button

```tsx
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Primary Action
</Button>
```

#### Accent/Gold Button

```tsx
<Button className="bg-gradient-gold text-primary-foreground hover:opacity-90">
  Premium Action
</Button>
```

#### Outline Button

```tsx
<Button variant="outline" className="border-primary/20 hover:bg-primary/5">
  Secondary Action
</Button>
```

#### Ghost Button

```tsx
<Button variant="ghost">Tertiary Action</Button>
```

#### Sizes

- `size="sm"`: Small buttons (h-8, px-3)
- Default: Medium (h-10, px-4)
- `size="lg"`: Large (h-12, px-8)

---

### Cards

#### Standard Card

```tsx
<Card className="border-2 hover:border-accent/50 transition-all shadow-md hover:shadow-xl">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

#### Featured/Premium Card

```tsx
<Card className="border-2 border-accent/20 hover:border-accent/50 bg-gradient-to-br from-card to-card/50">
  {/* Gold shimmer effect on hover */}
</Card>
```

#### Card Variants

- **Standard**: `border-border`, white background
- **Accent Border**: `border-accent/20 hover:border-accent/50`
- **Premium**: Gold gradient background, elevated shadow

---

### Badges

```tsx
<Badge className="bg-accent/10 text-accent border-accent/20">
  Premium
</Badge>

<Badge className="bg-green-500/20 text-green-400 border-green-500/30">
  Available
</Badge>
```

---

### Input Fields

```tsx
<Input
  className="border-border focus:border-accent focus:ring-accent/20"
  placeholder="Placeholder text"
/>
```

---

## Animations (Framer Motion)

### Page Entry

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

### Staggered List Items

```tsx
{
  items.map((item, index) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      Item
    </motion.div>
  ));
}
```

### Hover Effects

```tsx
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 300 }}
>
  Interactive Element
</motion.div>
```

### Scroll Reveal

```tsx
<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.5 }}
>
  Content that appears on scroll
</motion.div>
```

### Common Transitions

- **Default**: `duration: 0.3-0.5s`, `ease: "easeInOut"`
- **Spring**: `type: "spring"`, `stiffness: 300`, `damping: 30`
- **Bounce**: `type: "spring"`, `bounce: 0.3`

---

## Layout Patterns

### Container

```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">Content</div>
```

### Section Spacing

```tsx
<section className="py-24 px-6">Content</section>
```

### Grid Layouts

```tsx
{/* 3 columns */}
<div className="grid md:grid-cols-3 gap-8">

{/* 2 columns */}
<div className="grid lg:grid-cols-2 gap-8">

{/* 4 columns */}
<div className="grid md:grid-cols-4 gap-8">
```

---

## Interactive States

### Hover

- Cards: `hover:shadow-xl`, `hover:border-accent/50`, `hover:scale-105` (images)
- Buttons: `hover:bg-primary/90`, `hover:opacity-90`
- Links: `hover:text-accent`, underline on hover

### Focus

- Inputs: `focus:border-accent`, `focus:ring-accent/20`
- Buttons: `focus:ring-2`, `focus:ring-accent`

### Active/Pressed

- Buttons: `active:scale-95` với Framer Motion
- Cards: `active:shadow-md`

### Disabled

- Opacity: `opacity-50`, `cursor-not-allowed`

---

## Accessibility

### ARIA Labels

```tsx
<Button aria-label="Mở chat">
  <MessageCircle />
</Button>
```

### Keyboard Navigation

- Tất cả interactive elements phải có `tabIndex` và keyboard handlers
- Focus states rõ ràng
- Skip links cho screen readers

### Color Contrast

- Text on background: minimum 4.5:1 ratio
- Large text: minimum 3:1 ratio

---

## Responsive Breakpoints

- **Mobile**: `< 640px` (sm)
- **Tablet**: `640px - 1024px` (md, lg)
- **Desktop**: `> 1024px` (lg, xl, 2xl)

### Mobile-First Approach

```tsx
<div className="flex flex-col md:flex-row gap-4">
  Mobile: stacked, Desktop: side-by-side
</div>
```

---

## Icon Usage

Sử dụng `lucide-react` icons với size chuẩn:

- **Small**: `h-4 w-4` (16px)
- **Medium**: `h-5 w-5` (20px)
- **Large**: `h-6 w-6` (24px)
- **Hero**: `h-8 w-8` (32px)

---

## Best Practices

1. **Consistency**: Luôn sử dụng design tokens và component variants
2. **Performance**: Lazy load images, optimize animations
3. **Accessibility**: ARIA labels, keyboard support, focus states
4. **Responsive**: Test trên mobile, tablet, desktop
5. **Animation**: Subtle và purposeful, không over-animate
6. **Loading States**: Hiển thị skeleton/spinner khi cần
7. **Error States**: Inline validation, error messages rõ ràng

---

## Special Components

### Floor Map Component

#### Table Nodes

- **Shape**: Circular hoặc rounded-square
- **Size**: Proportional với capacity (`capacity * 15 + 50px` cho normal, `capacity * 18 + 60px` cho VIP)
- **Colors**: Gradient background theo status
- **VIP Effect**: Animated glow với `motion.div` và `animate={{ scale: [1, 1.2, 1] }}`
- **Tooltip**: Card với table info, appear on hover
- **Selection**: Ring-4 ring-accent với scale animation

#### Controls

- Zoom in/out buttons: Top-right corner
- Reset transform button
- Legend bar: Bottom-left với status indicators

#### Styling

```tsx
<Card className="border-2 border-accent/20 hover:border-accent/50 bg-gradient-to-br from-cream-50 to-cream-100">
  {/* Floor map content */}
</Card>
```

---

### Reservation Detail Page

#### Layout

- **Left Column (2/3)**: Main content - editable info, pre-orders list
- **Right Column (1/3)**: Sticky summary sidebar, actions, QR code

#### Pre-Order Cards

- Large dish image (w-24 h-24)
- Quantity controls với +/- buttons
- Status badge (pending/confirmed)
- Remove button cho pending items
- Framer Motion animations khi add/remove

#### Edit Mode

- Form inputs cho date, time, num_people, special_requests
- Save/Cancel buttons
- Inline validation

#### Styling

```tsx
<Card className="border-2 border-accent/20 shadow-lg">
  {/* Reservation detail */}
</Card>

<Card className="border-2 border-accent/10 hover:border-accent/30 transition-all">
  {/* Pre-order item */}
</Card>
```

---

### Order Detail Page

#### Layout

- **Left Column (2/3)**: Order items list, actions
- **Right Column (1/3)**: Sticky summary sidebar với voucher input

#### Order Item Cards

- Large dish image (w-28 h-28)
- Status badge với icon (pending/preparing/served/cancelled)
- Quantity controls (chỉ cho pending/preparing items)
- Cancel button (chỉ cho pending items)
- Price breakdown

#### Actions

- "Gọi Nhân Viên" - toast notification
- "Thêm Món" - dialog với dish selection
- "Yêu Cầu Thanh Toán" - redirect to mock VNPAY
- "Đánh Giá Bữa Ăn" - chỉ hiển thị khi order completed

#### Voucher Input

- Input field với Apply button
- Success indicator khi applied
- Update summary in real-time

#### Styling

```tsx
<Card className="border-2 border-accent/20 hover:border-accent/30 transition-all hover:shadow-lg">
  {/* Order item */}
</Card>

<Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
  <ChefHat className="h-3 w-3 mr-1" />
  Đang chuẩn bị
</Badge>
```

---

### Table Selection Step

#### View Modes

- **Map View**: Interactive floor map với zoom/pan
- **List View**: Grid cards với filters

#### Filters

- Search by table name/floor
- Filter by status (all/available/reserved/occupied)
- Filter by capacity (2/4/6/8+)

#### Table Cards

- Name, capacity, floor
- Status badge
- VIP badge (nếu có)
- Features list
- Hover effects với scale animation
- Selected state với accent border và ring

#### Styling

```tsx
<Card className="border-2 border-accent/20 hover:border-accent/50 hover:shadow-lg cursor-pointer">
  {/* Table card */}
</Card>

<Badge className="bg-gradient-gold text-primary-foreground border-0">
  <Star className="h-3 w-3 mr-1 fill-current" />
  VIP
</Badge>
```

---

## Example Component Structure

```tsx
"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExampleComponent() {
  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="font-bold text-4xl md:text-5xl text-primary mb-6">
            Section Title
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">{/* Content */}</div>
      </div>
    </section>
  );
}
```

---

**Last Updated**: 2024-02-15
