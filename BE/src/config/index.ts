import dotenv from 'dotenv';
dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || 'restaurant_db',
    user: process.env.DB_USER || 'root',
    pass: process.env.DB_PASS || ''
  },
  jwtSecret: process.env.JWT_SECRET || 'supersecret',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};

export { env };
