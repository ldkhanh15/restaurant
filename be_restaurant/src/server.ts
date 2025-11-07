import dotenv from 'dotenv'
// Load .env in development so local env vars (VNP_*) are available automatically
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: process.env.DOTENV_PATH || '.env' })
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
    if (process.env.NODE_ENV !== 'production') {
      try {
        const cp = require('child_process')
        const portToKill = process.env.PORT || '8000'
        // Use lsof on mac/linux to find pid(s) listening on the port, then kill them.
        const out = cp.execSync(`lsof -iTCP:${portToKill} -sTCP:LISTEN -n -P || true`).toString()
        const lines = out.split('\n').slice(1).filter(Boolean)
        for (const line of lines) {
          const cols = line.trim().split(/\s+/)
          const pid = parseInt(cols[1], 10)
          if (!Number.isNaN(pid) && pid !== process.pid) {
            try { process.kill(pid, 'SIGKILL') } catch (e) { /* ignore */ }
          }
        }
      } catch (e) {
        // ignore any platform-specific failures
      }
    }
    // Test database connection
    await testConnection();

    // Sync database (use { force: true } to drop and recreate tables in development)
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
