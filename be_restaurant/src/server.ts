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
<<<<<<< HEAD
    // await sequelize.sync({ alter: true })
    await sequelize.sync({ alter: false, logging: false });
=======
    // Try to run alter sync; if MySQL complains about dropping a missing FK (errno 1091),
    // fall back to syncing without alter to allow the server to start.
    try {
      await sequelize.sync({ alter: true, logging: false });
    } catch (syncErr: any) {
      // ER_CANT_DROP_FIELD_OR_KEY = 1091
      // ER_TOO_MANY_KEYS = 1069 (MySQL cannot add additional keys because table already has max keys)
      const errno = syncErr && syncErr.parent && syncErr.parent.errno
      if (errno === 1091 || errno === 1069) {
        logger.warn(`Sequelize alter sync failed (errno=${errno}). Retrying sync without alter.`);
        await sequelize.sync({ logging: false });
      } else {
        throw syncErr
      }
    }
>>>>>>> 007920e (Use appRouter.push for /order-confirmation navigation across screens)
    // 🔥 Gọi seed
    //await runSeeds();
    //logger.info("Database synchronized");

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
