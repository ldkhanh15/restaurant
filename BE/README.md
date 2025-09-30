# Restaurant API (Express + TypeScript + Sequelize + Socket.IO)

## Prerequisites
- Node.js 18+
- MySQL 8+

## Setup
```bash
# 1) Clone
git clone <repo-url>
cd BE

# 2) Install deps
npm i

# 3) Environment
cp .env.example .env
# Edit .env values (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS, PORT, JWT_SECRET, CORS_ORIGIN)
```

## Database
```bash
# Create DB if not exists
# mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS restaurant_db;"

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed
```

## Run
```bash
# Dev (transpile-only)
npm run dev

# Build + Start (production)
npm run build
npm start
```

## Endpoints
- REST base: http://localhost:${PORT:-4000}
- Health: GET /health (public)
- Swagger: GET /api-docs
- Main modules (plural, kebab-case):
  - /api/users, /api/employees, /api/tables, /api/reservations,
  - /api/orders, /api/order-items, /api/order-item-logs,
  - /api/dishes, /api/ingredients, /api/dish-ingredients,
  - /api/category-dishes, /api/suppliers, /api/inventory,
  - /api/vouchers, /api/voucher-usages,
  - /api/events, /api/event-bookings,
  - /api/blogs, /api/notifications, /api/complaints,
  - /api/analytics

## WebSocket
- Namespace /chat: join_session, leave_session, message events
- Namespace /orders: join_table, join_kitchen, update_order_status, update_item_status
- Global emits from services (kebab-case):
  - voucher-*, voucher-usage-*, table-group-*, event-booking-*, dish-ingredient-*, order-item-log-*

## JWT Authentication
- All routes (except GET /health and /api-docs) use Bearer token auth
- Header: `Authorization: Bearer <token>`
- Helper: `src/utils/jwt.ts` (generateToken, verifyToken)
- Middleware: `src/middleware/auth.ts`

## Swagger
- Config: `src/swagger/swagger.json`
- UI: `GET /api-docs`

## Scripts
```json
{
  "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
  "build": "tsc -p .",
  "start": "node dist/server.js",
  "db:migrate": "sequelize-cli --config src/config/sequelize.cjs --migrations-path src/migrations --seeders-path src/seeders --models-path src/models db:migrate",
  "db:seed": "sequelize-cli --config src/config/sequelize.cjs --migrations-path src/migrations --seeders-path src/seeders --models-path src/models db:seed:all"
}
```

## Notes
- ESM project ("type": "module"). JSON import uses createRequire.
- Socket singleton helper: `src/sockets/io.ts`; wired in `src/server.ts`.
- Migrations newly added for: table_groups, event_bookings, voucher_usages, dish_ingredients, order_item_logs.
- Seeders added for: vouchers, voucher_usages, table_groups, event_bookings, dish_ingredients, order_item_logs.
- created_by_cursor: true markers added to generated modules for review.
