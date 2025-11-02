import type { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyToken, type JWTPayload } from "../utils/jwt";
import registerNotificationSocket from "./notificationSocket";
import registerOrderSocket from "./orderSocket";
import registerReservationSocket from "./reservationSocket";
import registerChatSocket from "./chatSocket";
import { AppError } from "../middlewares/errorHandler";

let ioInstance: Server | null = null;

// Socket data interface
interface AuthenticatedSocket extends Socket {
  data: {
    user: JWTPayload;
  };
}

/**
 * Extract JWT token from handshake
 */
const extractToken = (socket: Socket): string | null => {
  return (
    (socket.handshake.auth?.token as string) ||
    (socket.handshake.query?.token as string) ||
    null
  );
};

/**
 * JWT Authentication Middleware for Admin Namespace
 * Only allows admin and employee roles
 */
const authenticateAdmin = (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = extractToken(socket);
    if (!token) {
      return next(new Error("Unauthorized: Missing token"));
    }

    const decoded = verifyToken(token.replace(/^Bearer\s+/i, "")) as JWTPayload;

    // Only allow admin and employee (staff) roles
    if (decoded.role !== "admin" && decoded.role !== "employee") {
      return next(new Error("Forbidden: Invalid role for admin namespace"));
    }

    // Attach user and token to socket
    (socket as AuthenticatedSocket).data = { user: decoded };
    (socket as any).user = decoded; // Legacy support
    (socket as any).token = token.replace(/^Bearer\s+/i, ""); // Store token for chatbot API calls
    next();
  } catch (error) {
    console.error("[WS] Admin auth error:", error);
    next(new Error("Unauthorized: Invalid token"));
  }
};

/**
 * JWT Authentication Middleware for Customer Namespace
 * Allows customer role and anonymous connections
 */
const authenticateCustomer = (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = extractToken(socket);

    // Allow anonymous customers (no token)
    if (!token) {
      console.log(
        "[WS] Customer namespace: No token provided, allowing anonymous"
      );
      return next();
    }

    const cleanToken = token.replace(/^Bearer\s+/i, "");
    const decoded = verifyToken(cleanToken) as JWTPayload;

    // Only allow customer role
    if (decoded.role !== "customer") {
      console.warn(
        `[WS] Customer namespace: Rejecting non-customer role: ${decoded.role}`
      );
      // Allow connection but mark as anonymous (don't store token)
      return next();
    }

    // Attach user and token to socket
    (socket as AuthenticatedSocket).data = { user: decoded };
    (socket as any).user = decoded; // Legacy support
    (socket as any).token = cleanToken; // Store token for chatbot API calls
    console.log(
      `[WS] Customer namespace: Authenticated user=${decoded.id} role=${decoded.role}, token stored (length=${cleanToken.length})`
    );
    next();
  } catch (error) {
    // Allow anonymous connection on token error
    console.warn("[WS] Customer auth error (allowing anonymous):", error);
    next();
  }
};

/**
 * Initialize Socket.IO with namespace-based authentication
 */
export const initSocket = (server: HTTPServer) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // ============================================
  // ADMIN NAMESPACE (/admin)
  // ============================================
  const adminNsp = io.of("/admin");

  // Apply JWT authentication middleware
  adminNsp.use(authenticateAdmin);

  // Handle admin connections
  adminNsp.on("connection", (socket: Socket) => {
    const user = (socket as AuthenticatedSocket).data?.user;

    if (!user) {
      console.error("[WS] /admin: Connected without user data");
      socket.disconnect();
      return;
    }

    // Join admin room (all admins receive broadcasts)
    socket.join("admin_room");

    // Join staff room for staff-specific events
    socket.join("staff_room");

    console.log(
      `[WS] /admin connected: user=${user.id} role=${user.role} socket=${socket.id}`
    );

    // Handle admin-specific events
    socket.on("admin:join_room", (room: string) => {
      if (room) {
        socket.join(room);
        console.log(`[WS] /admin: ${user.id} joined room: ${room}`);
      }
    });

    socket.on("admin:leave_room", (room: string) => {
      if (room) {
        socket.leave(room);
        console.log(`[WS] /admin: ${user.id} left room: ${room}`);
      }
    });

    // Handle send_to_customer event (admin -> customer)
    socket.on(
      "admin:send_to_customer",
      (data: { customer_id: string; event: string; payload: any }) => {
        if (!data.customer_id || !data.event) {
          console.warn("[WS] /admin: Invalid send_to_customer payload", data);
          return;
        }

        // Forward to customer room in customer namespace
        const customerNsp = io.of("/customer");
        customerNsp.to(`customer:${data.customer_id}`).emit(data.event, {
          ...data.payload,
          from_admin: true,
          admin_id: user.id,
        });

        console.log(
          `[WS] /admin: ${user.id} sent event "${data.event}" to customer:${data.customer_id}`
        );
      }
    );

    // Cleanup on disconnect
    socket.on("disconnect", (reason) => {
      console.log(`[WS] /admin disconnected: user=${user.id} reason=${reason}`);
      // Socket.IO automatically leaves all rooms on disconnect
    });
  });

  // ============================================
  // CUSTOMER NAMESPACE (/customer)
  // ============================================
  const customerNsp = io.of("/customer");

  // Apply JWT authentication middleware (allows anonymous)
  customerNsp.use(authenticateCustomer);

  // Store mapping of customer_id -> socket.id for cleanup
  const customerSocketMap = new Map<string, Set<string>>();

  // Handle customer connections
  customerNsp.on("connection", (socket: Socket) => {
    const user = (socket as AuthenticatedSocket).data?.user;

    if (user && user.role === "customer") {
      // Authenticated customer: join their personal room
      const customerRoom = `customer:${user.id}`;
      socket.join(customerRoom);

      // Track socket mapping for cleanup
      if (!customerSocketMap.has(user.id)) {
        customerSocketMap.set(user.id, new Set());
      }
      customerSocketMap.get(user.id)!.add(socket.id);

      console.log(
        `[WS] /customer connected: user=${user.id} socket=${socket.id} room=${customerRoom}`
      );
    } else {
      // Anonymous customer
      console.log(`[WS] /customer connected (anonymous): socket=${socket.id}`);
    }

    // Handle customer-specific events that should be forwarded to admin
    socket.on("customer:event", (data: { event: string; payload: any }) => {
      if (!data.event || !data.payload) {
        console.warn("[WS] /customer: Invalid customer:event payload", data);
        return;
      }

      // Forward to admin namespace with customer_id
      const customerId = user?.id || "anonymous";
      adminNsp.emit(`customer:${data.event}`, {
        customer_id: customerId,
        socket_id: socket.id,
        ...data.payload,
      });

      console.log(
        `[WS] /customer: Forwarded event "${data.event}" from customer:${customerId} to admin`
      );
    });

    // Cleanup on disconnect
    socket.on("disconnect", (reason) => {
      if (user && user.role === "customer") {
        // Remove from socket mapping
        const socketSet = customerSocketMap.get(user.id);
        if (socketSet) {
          socketSet.delete(socket.id);
          if (socketSet.size === 0) {
            customerSocketMap.delete(user.id);
          }
        }

        console.log(
          `[WS] /customer disconnected: user=${
            user.id
          } reason=${reason} remaining_sockets=${socketSet?.size || 0}`
        );
      } else {
        console.log(
          `[WS] /customer disconnected (anonymous): socket=${socket.id} reason=${reason}`
        );
      }
    });
  });

  // ============================================
  // ROOT NAMESPACE (Legacy support)
  // ============================================
  // Optional: Global middleware for root namespace (backward compatibility)
  io.use((socket, next) => {
    try {
      const token = extractToken(socket);
      if (token) {
        const decoded = verifyToken(
          token.replace(/^Bearer\s+/i, "")
        ) as JWTPayload;
        (socket as any).user = decoded;
        if (decoded.role === "customer") {
          socket.join(`customer:${decoded.id}`);
        }
      }
    } catch {
      // Allow anonymous
    }
    next();
  });

  io.on("connection", (socket) => {
    const user = (socket as any).user;
    if (user) {
      console.log(
        `[WS] Root namespace connected: user=${user.id} role=${user.role}`
      );
    }
  });

  // ============================================
  // Register Module Handlers
  // ============================================
  // Register all socket modules (they receive the full io instance)
  registerChatSocket(io);
  registerNotificationSocket(io);
  registerOrderSocket(io);
  registerReservationSocket(io);

  ioInstance = io;
  return io;
};

/**
 * Get Socket.IO instance
 */
export const getIO = (): Server => {
  if (!ioInstance) {
    throw new AppError("Socket.IO not initialized", 500);
  }
  return ioInstance;
};

/**
 * Helper: Forward event from customer to admin namespace
 */
export const forwardToAdmin = (
  io: Server,
  event: string,
  data: { customer_id: string; [key: string]: any }
) => {
  const { customer_id, ...rest } = data;
  io.of("/admin").emit(`customer:${event}`, {
    customer_id,
    timestamp: new Date().toISOString(),
    ...rest,
  });
};

/**
 * Helper: Forward event from admin to specific customer
 */
export const forwardToCustomer = (
  io: Server,
  customerId: string,
  event: string,
  data: any
) => {
  io.of("/customer")
    .to(`customer:${customerId}`)
    .emit(event, {
      ...data,
      from_admin: true,
      timestamp: new Date().toISOString(),
    });
};

/**
 * Helper: Broadcast to all admins
 */
export const broadcastToAdmin = (io: Server, event: string, data: any) => {
  io.of("/admin").emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};
