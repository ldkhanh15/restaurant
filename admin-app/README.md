# Restaurant Admin App

React Native mobile admin application for restaurant management.

## Features

- 📊 Dashboard with statistics and charts
- 📋 Order management with real-time updates
- 👥 User management (customers, employees, admins)
- ⚙️ Settings and preferences
- 🎨 Dark/Light theme support
- 📱 Mobile-optimized UI

## Tech Stack

- React Native 0.74
- Expo
- TypeScript
- React Native Paper (UI Kit)
- React Navigation (Navigation)
- TanStack Query (Data fetching)
- Zustand (State management)
- React Native Chart Kit (Charts)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm or npm
- Android Studio (for Android development)
- Expo CLI

### Installation

1. Install dependencies:
```bash
cd admin-app
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on Android:
```bash
npm android
```

Or scan the QR code with Expo Go app.

### Demo Credentials

**Admin Account:**
- Email: admin@restaurant.com
- Password: admin123

**Manager Account:**
- Email: manager@restaurant.com  
- Password: manager123

## Project Structure

```
admin-app/
├── src/
│   ├── api/           # Mock API and data types
│   ├── components/    # Reusable UI components
│   ├── hooks/         # Custom hooks for data fetching
│   ├── navigation/    # Navigation configuration
│   ├── screens/       # Screen components
│   ├── store/         # Global state management
│   ├── theme/         # Theme and styling
│   └── utils/         # Utility functions
├── App.tsx            # Root component
├── package.json
└── tsconfig.json
```

## Key Features

### Dashboard
- Real-time statistics
- Revenue charts
- Quick action buttons
- Mobile-optimized layout

### Orders Management
- Order list with filtering
- Status updates
- Payment tracking
- Search functionality

### User Management
- Customer, employee, admin management
- User statistics
- Role-based filtering
- Search and filter options

### Settings
- Profile management
- Theme switching
- Account settings
- Logout functionality

## Mock Data

The app uses mock data that mimics the structure from the admin-web (Next.js) application:

- **Orders**: Status tracking, payment information, customer details
- **Users**: Role-based management, ranking system, contact information  
- **Dashboard**: Statistics, charts, performance metrics

## Development Notes

- All mock data is structured to match the admin-web API for easy integration
- TypeScript interfaces ensure type safety
- Components are built mobile-first
- State management with Zustand for simplicity
- React Query for efficient data fetching and caching

## TODO

- [ ] Add real API integration
- [ ] Implement push notifications
- [ ] Add more chart types
- [ ] Implement offline support
- [ ] Add unit tests
- [ ] Add order detail screen
- [ ] Add user detail screen

## License

MIT