# Restaurant Management System Backend

A comprehensive backend API for restaurant management built with Express.js, TypeScript, and Sequelize ORM.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (Admin, Employee, Customer)
- **User Management**: Complete CRUD operations for users with different roles
- **Menu Management**: Dishes, categories, ingredients with media support
- **Order Management**: Full order lifecycle with items, customizations, and payments
- **Reservation System**: Table and table group reservations with preferences
- **Inventory Management**: Track ingredients, suppliers, and imports
- **Employee Management**: Shifts, attendance logs, and payroll
- **Reviews & Complaints**: Customer feedback system
- **Events**: Event planning and bookings
- **Vouchers & Promotions**: Discount codes and loyalty points
- **Chatbot**: Multi-channel chat sessions
- **Notifications**: System notifications for various events
- **Blog**: Content management for blog posts

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: MySQL
- **Authentication**: JWT with bcrypt
- **Validation**: express-validator
- **Logging**: Winston
- **CORS**: Enabled for cross-origin requests

## Project Structure

\`\`\`
src/
├── config/          # Database and logger configuration
├── models/          # Sequelize models with associations
├── controllers/     # Request handlers for each resource
├── routes/          # Express route definitions
├── middlewares/     # Auth, validation, and error handling
├── utils/           # Helper functions (JWT, password, pagination)
├── types/           # TypeScript type definitions
├── app.ts           # Express app setup
└── server.ts        # Server entry point
\`\`\`

## Setup

1. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and update with your settings:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

3. **Update database credentials** in `.env`:
   \`\`\`
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=restaurant_db
   DB_USER=root
   DB_PASSWORD=your_password
   JWT_SECRET=your_secret_key
   \`\`\`

4. **Run database migrations**:
   The app will automatically sync the database schema on startup.

5. **Start the development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

6. **Build for production**:
   \`\`\`bash
   npm run build
   npm start
   \`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/validate` - Validate JWT token

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Dishes
- `GET /api/dishes` - Get all dishes (public)
- `GET /api/dishes/:id` - Get dish by ID
- `POST /api/dishes` - Create dish (Admin/Employee)
- `PUT /api/dishes/:id` - Update dish (Admin/Employee)
- `DELETE /api/dishes/:id` - Delete dish (Admin)

### Orders
- `GET /api/orders` - Get all orders (Admin/Employee)
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order (Admin)

## Role-Based Access Control

### Admin
- Full access to all resources
- Can manage users, employees, payroll
- Can create/edit/delete all content

### Employee
- Access to operational resources
- Can manage dishes, orders, reservations, inventory
- Cannot access payroll or admin-only features

### Customer
- Limited access to own resources
- Can create orders, reservations, reviews
- Can view dishes and tables
- Cannot access internal resources

## Authentication

All protected routes require a JWT token in the Authorization header:

\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

Get a token by calling the `/api/auth/login` endpoint with valid credentials.

## Error Handling

The API uses consistent error responses:

\`\`\`json
{
  "status": "error",
  "message": "Error description"
}
\`\`\`

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Pagination

List endpoints support pagination with query parameters:

\`\`\`
GET /api/users?page=1&limit=10&sortBy=created_at&sortOrder=DESC
\`\`\`

Response format:
\`\`\`json
{
  "status": "success",
  "data": {
    "data": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
\`\`\`

## Development

- **Hot reload**: `npm run dev` uses ts-node-dev for automatic restarts
- **Linting**: `npm run lint` to check code quality
- **Logs**: Check `logs/` directory for error and combined logs

## Production Deployment

1. Build the TypeScript code: `npm run build`
2. Set `NODE_ENV=production` in your environment
3. Configure production database credentials
4. Use a process manager like PM2: `pm2 start dist/server.js`
5. Set up reverse proxy (nginx) for SSL and load balancing

## License

MIT
