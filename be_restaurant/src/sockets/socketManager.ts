import type { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

interface AuthenticatedSocket extends Socket {
  data: {
    user?: {
      id: string;
      role: "admin" | "staff" | "customer";
      username?: string;
    };
  };
}

interface JWT_PAYLOAD {
  id: string;
  role: "admin" | "staff" | "customer";
  username?: string;
}

export class SocketManager {
  private io: Server;
  private adminNamespace: any;
  private customerNamespace: any;

  constructor(io: Server) {
    this.io = io;
    this.initializeNamespaces();
  }

  private initializeNamespaces() {
    // Admin namespace - for admin and staff
    this.adminNamespace = this.io.of("/admin");
    this.adminNamespace.use(this.authenticateAdmin.bind(this));
    this.adminNamespace.on("connection", this.handleAdminConnection.bind(this));

    // Customer namespace - for customers
    this.customerNamespace = this.io.of("/customer");
    this.customerNamespace.use(this.authenticateCustomer.bind(this));
    this.customerNamespace.on(
      "connection",
      this.handleCustomerConnection.bind(this)
    );
  }

  private async authenticateAdmin(socket: AuthenticatedSocket, next: any) {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      ) as JWT_PAYLOAD;

      if (decoded.role !== "admin" && decoded.role !== "staff") {
        return next(
          new Error("Authentication error: Insufficient permissions")
        );
      }

      socket.data.user = {
        id: decoded.id,
        role: decoded.role,
        username: decoded.username,
      };

      next();
    } catch (error) {
      console.error("Admin authentication error:", error);
      next(new Error("Authentication error: Invalid token"));
    }
  }

  private async authenticateCustomer(socket: AuthenticatedSocket, next: any) {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      ) as JWT_PAYLOAD;

      if (decoded.role !== "customer") {
        return next(
          new Error("Authentication error: Customer access required")
        );
      }

      socket.data.user = {
        id: decoded.id,
        role: decoded.role,
        username: decoded.username,
      };

      next();
    } catch (error) {
      console.error("Customer authentication error:", error);
      next(new Error("Authentication error: Invalid token"));
    }
  }

  private handleAdminConnection(socket: AuthenticatedSocket) {
    const userId = socket.data.user?.id;
    const role = socket.data.user?.role;

    console.log(`Admin connected: ${userId} (${role})`);

    // Join admin room
    socket.join("admin");

    // Setup all module events
    this.setupChatEvents(socket);
    this.setupOrderEvents(socket);
    this.setupReservationEvents(socket);
    this.setupNotificationEvents(socket);

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`Admin disconnected: ${userId}`);
    });
  }

  private handleCustomerConnection(socket: AuthenticatedSocket) {
    const userId = socket.data.user?.id;

    console.log(`Customer connected: ${userId}`);

    // Join customer-specific room
    socket.join(`customer:${userId}`);

    // Setup all module events
    this.setupChatEvents(socket);
    this.setupOrderEvents(socket);
    this.setupReservationEvents(socket);
    this.setupNotificationEvents(socket);

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`Customer disconnected: ${userId}`);
    });
  }

  private setupChatEvents(socket: AuthenticatedSocket) {
    const userId = socket.data.user?.id;
    const role = socket.data.user?.role;
    const isAdmin = role === 'admin' || role === 'staff';

    // Message sending
    socket.on('chat:send_message', async (data: { 
      sessionId: string, 
      message: string,
      type?: 'text' | 'image' | 'file'
    }) => {
      try {
        // Create message in database (assuming you have a service for this)
        const message = {
          id: `msg-${Date.now()}`,
          sessionId: data.sessionId,
          senderId: userId,
          content: data.message,
          type: data.type || 'text',
          timestamp: new Date(),
          status: 'sent'
        };

        // Emit to the specific chat session room
        if (isAdmin) {
          // If sender is admin, send to specific customer
          this.customerNamespace.to(`chat:${data.sessionId}`).emit('chat:message_received', message);
          // Also send to all other admins
          socket.to('admin').emit('chat:message_received', message);
        } else {
          // If sender is customer, send to admins
          this.adminNamespace.emit('chat:message_received', message);
        }

        // Confirm message sent to sender
        socket.emit('chat:message_sent', { messageId: message.id });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('chat:error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('chat:typing_start', (data: { sessionId: string }) => {
      if (isAdmin) {
        this.customerNamespace.to(`chat:${data.sessionId}`).emit('chat:typing', {
          userId,
          sessionId: data.sessionId
        });
      } else {
        this.adminNamespace.emit('chat:typing', {
          userId,
          sessionId: data.sessionId
        });
      }
    });

    socket.on('chat:typing_end', (data: { sessionId: string }) => {
      if (isAdmin) {
        this.customerNamespace.to(`chat:${data.sessionId}`).emit('chat:typing_ended', {
          userId,
          sessionId: data.sessionId
        });
      } else {
        this.adminNamespace.emit('chat:typing_ended', {
          userId,
          sessionId: data.sessionId
        });
      }
    });

    // Message read receipts
    socket.on('chat:mark_read', async (data: { 
      sessionId: string,
      messageIds: string[] 
    }) => {
      try {
        // Update messages as read in database
        
        // Notify relevant parties
        if (isAdmin) {
          this.customerNamespace.to(`chat:${data.sessionId}`).emit('chat:messages_read', {
            userId,
            sessionId: data.sessionId,
            messageIds: data.messageIds
          });
        } else {
          this.adminNamespace.emit('chat:messages_read', {
            userId,
            sessionId: data.sessionId,
            messageIds: data.messageIds
          });
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Join specific chat session
    socket.on('chat:join_session', (sessionId: string) => {
      socket.join(`chat:${sessionId}`);
    });

    // Leave specific chat session
    socket.on('chat:leave_session', (sessionId: string) => {
      socket.leave(`chat:${sessionId}`);
    });
  }

  private setupOrderEvents(socket: AuthenticatedSocket) {
    const userId = socket.data.user?.id;
    const role = socket.data.user?.role;
    const isAdmin = role === 'admin' || role === 'staff';

    // Join order room when viewing an order
    socket.on('order:join', (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    // Leave order room
    socket.on('order:leave', (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });

    if (isAdmin) {
      // Admin-only events
      socket.on('order:update_status', async (data: {
        orderId: string,
        status: string,
        note?: string
      }) => {
        try {
          // Update order status in database (using your order service)
          const updatedOrder = {
            id: data.orderId,
            status: data.status,
            updatedAt: new Date(),
            updatedBy: userId
          };

          // Notify all admins
          this.adminNamespace.emit('order:status_updated', updatedOrder);

          // Notify the customer who owns this order
          // Assuming you have a way to get the customer ID from the order
          const customerId = 'get-from-your-service';
          this.customerNamespace
            .to(`customer:${customerId}`)
            .emit('order:status_updated', updatedOrder);

        } catch (error) {
          console.error('Error updating order status:', error);
          socket.emit('order:error', { 
            message: 'Failed to update order status',
            orderId: data.orderId 
          });
        }
      });

      socket.on('order:update_item_status', async (data: {
        orderId: string,
        itemId: string,
        status: string,
        note?: string
      }) => {
        try {
          // Update item status in database
          const updatedItem = {
            orderId: data.orderId,
            itemId: data.itemId,
            status: data.status,
            updatedAt: new Date(),
            updatedBy: userId
          };

          // Notify all admins
          this.adminNamespace.emit('order:item_status_updated', updatedItem);

          // Notify relevant customer
          const customerId = 'get-from-your-service';
          this.customerNamespace
            .to(`customer:${customerId}`)
            .emit('order:item_status_updated', updatedItem);

        } catch (error) {
          console.error('Error updating order item status:', error);
          socket.emit('order:error', {
            message: 'Failed to update item status',
            orderId: data.orderId,
            itemId: data.itemId
          });
        }
      });
    }

    // Events for both admin and customer
    socket.on('order:add_note', async (data: {
      orderId: string,
      note: string,
      type: 'public' | 'internal'
    }) => {
      try {
        // Add note to database
        const noteData = {
          id: `note-${Date.now()}`,
          orderId: data.orderId,
          content: data.note,
          type: data.type,
          createdAt: new Date(),
          createdBy: userId,
          createdByRole: role
        };

        // For public notes, notify all relevant parties
        if (data.type === 'public') {
          // Notify admins
          this.adminNamespace.emit('order:note_added', noteData);

          // If added by admin, notify customer
          if (isAdmin) {
            const customerId = 'get-from-your-service';
            this.customerNamespace
              .to(`customer:${customerId}`)
              .emit('order:note_added', noteData);
          }
        } else {
          // Internal notes only go to admins
          if (isAdmin) {
            this.adminNamespace.emit('order:note_added', noteData);
          }
        }

      } catch (error) {
        console.error('Error adding order note:', error);
        socket.emit('order:error', {
          message: 'Failed to add note',
          orderId: data.orderId
        });
      }
    });
  }

  private setupReservationEvents(socket: AuthenticatedSocket) {
    const userId = socket.data.user?.id;
    const role = socket.data.user?.role;
    const isAdmin = role === 'admin' || role === 'staff';

    // Join reservation room
    socket.on('reservation:join', (reservationId: string) => {
      socket.join(`reservation:${reservationId}`);
    });

    // Leave reservation room
    socket.on('reservation:leave', (reservationId: string) => {
      socket.leave(`reservation:${reservationId}`);
    });

    if (isAdmin) {
      // Admin-only events
      socket.on('reservation:update_status', async (data: {
        reservationId: string,
        status: string,
        note?: string
      }) => {
        try {
          // Update reservation status in database
          const updatedReservation = {
            id: data.reservationId,
            status: data.status,
            updatedAt: new Date(),
            updatedBy: userId,
            note: data.note
          };

          // Notify all admins
          this.adminNamespace.emit('reservation:status_updated', updatedReservation);

          // Notify the customer who owns this reservation
          const customerId = 'get-from-your-service';
          this.customerNamespace
            .to(`customer:${customerId}`)
            .emit('reservation:status_updated', updatedReservation);

        } catch (error) {
          console.error('Error updating reservation status:', error);
          socket.emit('reservation:error', {
            message: 'Failed to update reservation status',
            reservationId: data.reservationId
          });
        }
      });

      socket.on('reservation:assign_table', async (data: {
        reservationId: string,
        tableId: string
      }) => {
        try {
          // Update table assignment in database
          const assignment = {
            reservationId: data.reservationId,
            tableId: data.tableId,
            assignedAt: new Date(),
            assignedBy: userId
          };

          // Notify all admins
          this.adminNamespace.emit('reservation:table_assigned', assignment);

          // Notify the customer
          const customerId = 'get-from-your-service';
          this.customerNamespace
            .to(`customer:${customerId}`)
            .emit('reservation:table_assigned', assignment);

        } catch (error) {
          console.error('Error assigning table:', error);
          socket.emit('reservation:error', {
            message: 'Failed to assign table',
            reservationId: data.reservationId
          });
        }
      });
    }

    // Events for both admin and customer
    socket.on('reservation:add_note', async (data: {
      reservationId: string,
      note: string,
      type: 'public' | 'internal'
    }) => {
      try {
        const noteData = {
          id: `note-${Date.now()}`,
          reservationId: data.reservationId,
          content: data.note,
          type: data.type,
          createdAt: new Date(),
          createdBy: userId,
          createdByRole: role
        };

        if (data.type === 'public') {
          this.adminNamespace.emit('reservation:note_added', noteData);
          if (isAdmin) {
            const customerId = 'get-from-your-service';
            this.customerNamespace
              .to(`customer:${customerId}`)
              .emit('reservation:note_added', noteData);
          }
        } else if (isAdmin) {
          this.adminNamespace.emit('reservation:note_added', noteData);
        }
      } catch (error) {
        console.error('Error adding reservation note:', error);
        socket.emit('reservation:error', {
          message: 'Failed to add note',
          reservationId: data.reservationId
        });
      }
    });
  }

  private setupNotificationEvents(socket: AuthenticatedSocket) {
    const userId = socket.data.user?.id;
    const role = socket.data.user?.role;
    const isAdmin = role === 'admin' || role === 'staff';

    // Join notification room
    if (isAdmin) {
      socket.join('notifications:admin');
    }
    socket.join(`notifications:user:${userId}`);

    // Mark notifications as read
    socket.on('notification:mark_read', async (data: {
      notificationIds: string[]
    }) => {
      try {
        // Update notifications as read in database
        const readStatus = {
          notificationIds: data.notificationIds,
          readAt: new Date(),
          readBy: userId
        };

        if (isAdmin) {
          // Update read status for admin notifications
          this.adminNamespace.emit('notification:marked_read', readStatus);
        } else {
          // Update read status for customer notifications
          socket.emit('notification:marked_read', readStatus);
        }
      } catch (error) {
        console.error('Error marking notifications as read:', error);
        socket.emit('notification:error', {
          message: 'Failed to mark notifications as read'
        });
      }
    });

    if (isAdmin) {
      // Admin can broadcast notifications
      socket.on('notification:broadcast', async (data: {
        title: string,
        message: string,
        type: string,
        targetUserIds?: string[],
        metadata?: any
      }) => {
        try {
          const notification = {
            id: `notif-${Date.now()}`,
            title: data.title,
            message: data.message,
            type: data.type,
            createdAt: new Date(),
            createdBy: userId,
            metadata: data.metadata
          };

          if (data.targetUserIds?.length) {
            // Send to specific users
            data.targetUserIds.forEach(targetUserId => {
              this.customerNamespace
                .to(`notifications:user:${targetUserId}`)
                .emit('notification:new', notification);
            });
          } else {
            // Broadcast to all customers
            this.customerNamespace.emit('notification:new', notification);
          }

          // Also notify other admins
          socket.to('notifications:admin').emit('notification:new', notification);
        } catch (error) {
          console.error('Error broadcasting notification:', error);
          socket.emit('notification:error', {
            message: 'Failed to broadcast notification'
          });
        }
      });
    }
  }

  // Emit to admin namespace
  emitToAdmin(event: string, data: any) {
    this.adminNamespace.emit(event, data);
  }

  // Emit to specific customer
  emitToCustomer(userId: string, event: string, data: any) {
    this.customerNamespace.to(`customer:${userId}`).emit(event, data);
  }

  // Emit to all customers
  emitToAllCustomers(event: string, data: any) {
    this.customerNamespace.emit(event, data);
  }

  // Get namespaces for external use
  getAdminNamespace() {
    return this.adminNamespace;
  }

  getCustomerNamespace() {
    return this.customerNamespace;
  }
}

export default SocketManager;

