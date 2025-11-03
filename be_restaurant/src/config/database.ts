import { Sequelize } from "sequelize"
import dotenv from "dotenv"
import logger from "./logger"

dotenv.config()

const sequelize = new Sequelize(
  process.env.DB_NAME || "restaurant_db",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: Number.parseInt(process.env.DB_PORT || "3306"),
    dialect: "mysql",
    logging: (msg) => {
      // Print raw SQL to console during development or when DEBUG_SQL is enabled
      if (process.env.DEBUG_SQL === "true" || process.env.NODE_ENV !== "production") {
        // Some messages may be objects; stringify safely
        try {
          if (typeof msg === "string") console.log('[SQL]', msg)
          else console.log('[SQL]', JSON.stringify(msg))
        } catch (e) {
          console.log('[SQL]', msg)
        }
      } else {
        logger.debug(msg)
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: false,
    },
  },
)

export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate()
    logger.info("Database connection established successfully.")
  } catch (error) {
    logger.error("Unable to connect to the database:", error)
    throw error
  }
}

export default sequelize
