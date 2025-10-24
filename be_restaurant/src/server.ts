import app from "./app";
import { createServer } from "http";
import { initSocket } from "./sockets";
import sequelize, { testConnection } from "./config/database";
import logger from "./config/logger";
import { runSeeds } from "./seeds/index";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Sync database (use { force: true } to drop and recreate tables in development)
    // await sequelize.sync({ alter: true })
    await sequelize.sync({ alter: true, logging: false });
    // 🔥 Gọi seed
    await runSeeds();
    logger.info("Database synchronized");

    // Start server with Socket.IO
    const httpServer = createServer(app);
    initSocket(httpServer);
    console.log("PORT:", PORT);
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
