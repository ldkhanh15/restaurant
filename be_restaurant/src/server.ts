import app from "./app"
import sequelize, { testConnection } from "./config/database"
import logger from "./config/logger"

const PORT = process.env.PORT || 3000

const startServer = async () => {
  try {
    // Test database connection
    await testConnection()

    // Sync database (use { force: true } to drop and recreate tables in development)
    await sequelize.sync({ alter: true })
    logger.info("Database synchronized")

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`)
    })
  } catch (error) {
    logger.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()
