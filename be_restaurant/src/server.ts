import dotenv from "dotenv";
// Load .env in development so local env vars (VNP_*) are available automatically
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: process.env.DOTENV_PATH || ".env" });
}

import app from "./app";
import { createServer } from "http";
import { initSocket } from "./sockets";
import sequelize, { testConnection } from "./config/database";
import logger from "./config/logger";
import { runSeeds } from "./seeds/index";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // In development, try to free the configured port before starting to reduce
    // race conditions with ts-node-dev respawn which can cause EADDRINUSE.
    if (process.env.NODE_ENV !== "production") {
      try {
        const cp = require("child_process");
        const portToKill = process.env.PORT || "8000";
        // Use lsof on mac/linux to find pid(s) listening on the port, then kill them.
        const out = cp
          .execSync(`lsof -iTCP:${portToKill} -sTCP:LISTEN -n -P || true`)
          .toString();
        const lines = out.split("\n").slice(1).filter(Boolean);
        for (const line of lines) {
          const cols = line.trim().split(/\s+/);
          const pid = parseInt(cols[1], 10);
          if (!Number.isNaN(pid) && pid !== process.pid) {
            try {
              process.kill(pid, "SIGKILL");
            } catch (e) {
              /* ignore */
            }
          }
        }
      } catch (e) {
        // ignore any platform-specific failures
      }
    }
    // Test database connection
    await testConnection();

    // Sync database (use { force: true } to drop and recreate tables in development)
    // await sequelize.sync({ alter: true })
    await sequelize.sync({ alter: true, logging: false });
    // 🔥 Gọi seed
    //await runSeeds();
    logger.info("Database synchronized");

    // Start server with Socket.IO
    const httpServer = createServer(app);
    initSocket(httpServer);
    console.log("PORT:", PORT);
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);

      // Start scheduled tasks
      const { startScheduledTasks } = require("./services/scheduledTasks");
      startScheduledTasks();
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
