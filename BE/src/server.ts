import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app";
import { env } from "./config/index";
import { sequelize } from "./config/database";
import { initializeChatSocket } from "./sockets/chatSocket";
import { initializeOrderSocket } from "./sockets/orderSocket";
import { setIO } from "./sockets/io";

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.corsOrigin || "*",
    methods: ["GET", "POST"],
  },
});

// Initialize socket handlers
initializeChatSocket(io);
initializeOrderSocket(io);
setIO(io);

const port = env.port || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    httpServer.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
}

startServer();
