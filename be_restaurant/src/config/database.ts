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
    logging: (msg) => logger.debug(msg),
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
