# Restaurant Admin Dashboard

A luxury restaurant management system built with Next.js 14, TypeScript, and TailwindCSS.

## 🎨 Design Features

- **Luxury Restaurant Theme**: Premium gold and charcoal color scheme
- **Modern UI Components**: Built with Radix UI and custom styling
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Real-time Updates**: WebSocket integration for live data
- **Type Safety**: Fully typed with TypeScript

## 🚀 Features

### Authentication

- Secure login/signup system
- JWT token-based authentication
- Protected routes
- Role-based access control

### Order Management

- **Orders List**: View all orders with filtering and search
- **Order Details**: Complete order information with item management
- **Real-time Updates**: Live order status updates
- **Interactive Features**:
  - Add/Edit/Remove items
  - Apply/Remove vouchers
  - Update order status
  - Request payment

### Reservation Management

- **Reservations List**: View all reservations with filtering
- **Reservation Details**: Complete reservation information
- **Check-in System**: Easy check-in process
- **Status Management**: Update reservation status

### Payment Management

- **Payments List**: View all payment transactions
- **Payment Details**: Detailed payment information in modals
- **Revenue Statistics**: Comprehensive revenue analytics
- **Payment Methods**: Support for cash, card, VNPay, bank transfer

### Voucher Management

- **Voucher CRUD**: Create, read, update, delete vouchers
- **Voucher Types**: Percentage and fixed amount discounts
- **Usage Tracking**: Monitor voucher usage and limits
- **Expiration Management**: Automatic expiration handling

### Dashboard

- **Overview Statistics**: Key metrics at a glance
- **Quick Actions**: Easy navigation to main features
- **Real-time Data**: Live updates from all modules

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: Radix UI
- **State Management**: React Hooks + Context
- **HTTP Client**: Axios
- **Real-time**: Socket.IO
- **Date Handling**: date-fns
- **Icons**: Lucide React

## 📁 Project Structure

```
admin-web/
├── src/
│   ├── app/
│   │   ├── (modules)/
│   │   │   ├── dashboard/
│   │   │   ├── orders/
│   │   │   │   └── [id]/
│   │   │   ├── reservations/
│   │   │   │   └── [id]/
│   │   │   ├── payments/
│   │   │   └── vouchers/
│   │   ├── login/
│   │   ├── signup/
│   │   └── globals.css
│   ├── components/
│   │   ├── modules/
│   │   ├── ui/
│   │   └── layout/
│   ├── lib/
│   │   └── api.ts
│   ├── services/
│   └── hooks/
```

## 🎨 Design System

### Color Palette

- **Primary**: `#b8860b` (Rich Gold)
- **Background**: `#f9fafb` (Light Ivory)
- **Foreground**: `#1c1917` (Deep Charcoal)
- **Accent**: `#b8860b` (Rich Gold)

### Typography

- **Headings**: Semi-bold, clean sans-serif
- **Body**: Regular weight, excellent readability
- **Special**: Gold gradient text for emphasis

### Components

- **Cards**: Rounded corners (`rounded-xl`), soft shadows
- **Buttons**: Luxury styling with hover effects
- **Status Badges**: Color-coded with icons
- **Glass Effects**: Subtle transparency for modals

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Backend API running on `http://localhost:8000`

### Installation

1. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Start development server**

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

3. **Open in browser**
   Navigate to `http://localhost:3000`

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=http://localhost:8000
```

## 📱 Pages & Routes

### Public Routes

- `/login` - Login page
- `/signup` - Registration page

### Protected Routes

- `/` - Dashboard (redirects to `/dashboard`)
- `/dashboard` - Main dashboard
- `/orders` - Orders management
- `/orders/[id]` - Order details
- `/reservations` - Reservations management
- `/reservations/[id]` - Reservation details
- `/payments` - Payments management
- `/vouchers` - Voucher management

## 🔧 API Integration

The dashboard integrates with a comprehensive REST API:

### Endpoints Used

- **Authentication**: `/auth/login`, `/auth/signup`
- **Orders**: `/orders/*` - Full CRUD operations
- **Reservations**: `/reservations/*` - Full CRUD operations
- **Payments**: `/payments/*` - Read operations + statistics
- **Vouchers**: `/vouchers/*` - Full CRUD operations

### Real-time Features

- WebSocket connection for live updates
- Order status changes
- Payment notifications
- Reservation updates

## 🎯 Key Features

### Order Management

- **Real-time Updates**: Orders update automatically
- **Item Management**: Add, edit, remove items
- **Voucher Integration**: Apply discounts easily
- **Status Tracking**: Complete order lifecycle
- **Payment Requests**: Trigger payment flows

### Reservation System

- **Check-in Process**: One-click check-in
- **Status Management**: Track reservation states
- **Customer Info**: Complete customer details
- **Table Management**: Table assignment and capacity

### Payment Analytics

- **Revenue Tracking**: Comprehensive revenue data
- **Payment Methods**: Breakdown by payment type
- **Time-based Analytics**: Daily, weekly, monthly views
- **Transaction Details**: Complete payment information

### Voucher System

- **Flexible Discounts**: Percentage or fixed amount
- **Usage Limits**: Control voucher usage
- **Expiration Management**: Automatic expiration
- **Usage Analytics**: Track voucher performance

## 🎨 Customization

### Theme Customization

The luxury theme can be customized in `src/app/globals.css`:

```css
:root {
  --primary: #b8860b; /* Change primary color */
  --background: #f9fafb; /* Change background */
  /* ... other variables */
}
```

### Component Styling

All components use utility classes and can be easily customized:

```tsx
<Card className="luxury-card"> {/* Custom luxury styling */}
<Button className="luxury-button"> {/* Custom button styling */}
<Badge className="status-badge status-pending"> {/* Status styling */}
```

## 🔒 Security

- **JWT Authentication**: Secure token-based auth
- **Protected Routes**: Automatic route protection
- **Input Validation**: Client and server-side validation
- **XSS Protection**: Sanitized inputs
- **CSRF Protection**: Built-in Next.js protection

## 📊 Performance

- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Bundle Optimization**: Tree shaking and minification
- **Caching**: Strategic data caching
- **Real-time Efficiency**: Optimized WebSocket usage

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### Other Platforms

1. Build the project: `npm run build`
2. Start production server: `npm start`
3. Configure reverse proxy for API

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the API documentation

---

**Built with ❤️ for luxury restaurant management**
