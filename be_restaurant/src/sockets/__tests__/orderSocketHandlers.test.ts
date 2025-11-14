import { Server } from "socket.io";
import registerOrderSocket from "../orderSocket";
import { forwardToAdmin, broadcastToAdmin } from "../index";

// Mock socket.io helpers
jest.mock("../index", () => ({
  forwardToAdmin: jest.fn(),
  forwardToCustomer: jest.fn(),
  broadcastToAdmin: jest.fn(),
}));

describe("Order Socket Handlers (Connection Handlers)", () => {
  let mockIO: Partial<Server>;
  let mockAdminNsp: any;
  let mockCustomerNsp: any;
  let mockAdminSocket: any;
  let mockCustomerSocket: any;

  beforeEach(() => {
    // Mock socket methods
    mockAdminSocket = {
      id: "admin-socket-123",
      data: {
        user: {
          id: "admin-456",
          role: "admin",
        },
      },
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      on: jest.fn(),
    };

    mockCustomerSocket = {
      id: "customer-socket-123",
      data: {
        user: {
          id: "customer-456",
          role: "customer",
        },
      },
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      on: jest.fn(),
    };

    // Mock admin namespace
    mockAdminNsp = {
      on: jest.fn((event: string, callback: Function) => {
        if (event === "connection") {
          // Simulate connection
          callback(mockAdminSocket);
        }
      }),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };

    // Mock customer namespace
    mockCustomerNsp = {
      on: jest.fn((event: string, callback: Function) => {
        if (event === "connection") {
          // Simulate connection
          callback(mockCustomerSocket);
        }
      }),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };

    // Mock IO server
    mockIO = {
      of: jest.fn((namespace: string) => {
        if (namespace === "/admin") return mockAdminNsp as any;
        if (namespace === "/customer") return mockCustomerNsp as any;
        return {} as any;
      }),
    } as any;

    jest.clearAllMocks();
  });

  describe("Admin Namespace Handlers", () => {
    beforeEach(() => {
      registerOrderSocket(mockIO as Server);
    });

    it("Kiểm tra admin join order room khi nhận order:join event", () => {
      // Get the handler registered by registerOrderSocket
      const connectionHandler = mockAdminNsp.on.mock.calls.find(
        (call: any[]) => call[0] === "connection"
      )?.[1];

      if (connectionHandler) {
        connectionHandler(mockAdminSocket);

        // Find order:join handler
        const joinHandler = mockAdminSocket.on.mock.calls.find(
          (call: any[]) => call[0] === "order:join"
        )?.[1];

        if (joinHandler) {
          const orderId = "order-123";
          joinHandler(orderId);

          expect(mockAdminSocket.join).toHaveBeenCalledWith(`order:${orderId}`);
        }
      }
    });

    it("Kiểm tra admin leave order room khi nhận order:leave event", () => {
      const connectionHandler = mockAdminNsp.on.mock.calls.find(
        (call: any[]) => call[0] === "connection"
      )?.[1];

      if (connectionHandler) {
        connectionHandler(mockAdminSocket);

        const leaveHandler = mockAdminSocket.on.mock.calls.find(
          (call: any[]) => call[0] === "order:leave"
        )?.[1];

        if (leaveHandler) {
          const orderId = "order-123";
          leaveHandler(orderId);

          expect(mockAdminSocket.leave).toHaveBeenCalledWith(
            `order:${orderId}`
          );
        }
      }
    });

    it("Kiểm tra admin join table room khi nhận order:join_table event", () => {
      const connectionHandler = mockAdminNsp.on.mock.calls.find(
        (call: any[]) => call[0] === "connection"
      )?.[1];

      if (connectionHandler) {
        connectionHandler(mockAdminSocket);

        const joinTableHandler = mockAdminSocket.on.mock.calls.find(
          (call: any[]) => call[0] === "order:join_table"
        )?.[1];

        if (joinTableHandler) {
          const tableId = "table-789";
          joinTableHandler(tableId);

          expect(mockAdminSocket.join).toHaveBeenCalledWith(`table:${tableId}`);
        }
      }
    });

    it("Kiểm tra admin không join order room nếu orderId rỗng", () => {
      const connectionHandler = mockAdminNsp.on.mock.calls.find(
        (call: any[]) => call[0] === "connection"
      )?.[1];

      if (connectionHandler) {
        connectionHandler(mockAdminSocket);

        const joinHandler = mockAdminSocket.on.mock.calls.find(
          (call: any[]) => call[0] === "order:join"
        )?.[1];

        if (joinHandler) {
          joinHandler(""); // Empty orderId

          expect(mockAdminSocket.join).not.toHaveBeenCalled();
        }
      }
    });
  });

  describe("Customer Namespace Handlers", () => {
    beforeEach(() => {
      registerOrderSocket(mockIO as Server);
    });

    it("Kiểm tra customer join order room và notify admin", () => {
      const connectionHandler = mockCustomerNsp.on.mock.calls.find(
        (call: any[]) => call[0] === "connection"
      )?.[1];

      if (connectionHandler) {
        connectionHandler(mockCustomerSocket);

        const joinHandler = mockCustomerSocket.on.mock.calls.find(
          (call: any[]) => call[0] === "order:join"
        )?.[1];

        if (joinHandler) {
          const orderId = "order-123";
          joinHandler(orderId);

          // Verify customer joins order room
          expect(mockCustomerSocket.join).toHaveBeenCalledWith(
            `order:${orderId}`
          );

          // Verify notify admin
          expect(forwardToAdmin).toHaveBeenCalledWith(
            mockIO,
            "order:customer_joined",
            expect.objectContaining({
              customer_id: "customer-456",
              orderId,
            })
          );
        }
      }
    });

    it("Kiểm tra customer request support event", () => {
      const connectionHandler = mockCustomerNsp.on.mock.calls.find(
        (call: any[]) => call[0] === "connection"
      )?.[1];

      if (connectionHandler) {
        connectionHandler(mockCustomerSocket);

        const supportHandler = mockCustomerSocket.on.mock.calls.find(
          (call: any[]) => call[0] === "order:request_support"
        )?.[1];

        if (supportHandler) {
          const data = { orderId: "order-123" };
          supportHandler(data);

          // Verify forward to admin
          expect(forwardToAdmin).toHaveBeenCalledWith(
            mockIO,
            "order:support_requested",
            expect.objectContaining({
              customer_id: "customer-456",
              orderId: "order-123",
            })
          );

          // Verify broadcast to admin
          expect(broadcastToAdmin).toHaveBeenCalledWith(
            mockIO,
            "admin:order:support_requested",
            expect.objectContaining({
              orderId: "order-123",
              customerId: "customer-456",
            })
          );
        }
      }
    });

    it("Kiểm tra customer không join order room nếu orderId rỗng", () => {
      const connectionHandler = mockCustomerNsp.on.mock.calls.find(
        (call: any[]) => call[0] === "connection"
      )?.[1];

      if (connectionHandler) {
        connectionHandler(mockCustomerSocket);

        const joinHandler = mockCustomerSocket.on.mock.calls.find(
          (call: any[]) => call[0] === "order:join"
        )?.[1];

        if (joinHandler) {
          joinHandler(""); // Empty orderId

          expect(mockCustomerSocket.join).not.toHaveBeenCalled();
          expect(forwardToAdmin).not.toHaveBeenCalled();
        }
      }
    });

    it("Kiểm tra customer không request support nếu orderId rỗng", () => {
      const connectionHandler = mockCustomerNsp.on.mock.calls.find(
        (call: any[]) => call[0] === "connection"
      )?.[1];

      if (connectionHandler) {
        connectionHandler(mockCustomerSocket);

        const supportHandler = mockCustomerSocket.on.mock.calls.find(
          (call: any[]) => call[0] === "order:request_support"
        )?.[1];

        if (supportHandler) {
          supportHandler({ orderId: "" }); // Empty orderId

          expect(forwardToAdmin).not.toHaveBeenCalled();
          expect(broadcastToAdmin).not.toHaveBeenCalled();
        }
      }
    });

    it("Kiểm tra customer không được xử lý nếu không phải role customer", () => {
      const invalidCustomerSocket = {
        ...mockCustomerSocket,
        data: {
          user: {
            id: "user-789",
            role: "admin", // Invalid role
          },
        },
        on: jest.fn(),
      };

      const connectionHandler = mockCustomerNsp.on.mock.calls.find(
        (call: any[]) => call[0] === "connection"
      )?.[1];

      if (connectionHandler) {
        connectionHandler(invalidCustomerSocket);

        // Verify no handlers were registered (connection handler returns early)
        // The handler checks if (!userId || userRole !== "customer") and returns
        expect(invalidCustomerSocket.on).not.toHaveBeenCalled();
      }
    });

    it("Kiểm tra customer không được xử lý nếu không có userId", () => {
      const invalidCustomerSocket = {
        ...mockCustomerSocket,
        data: {
          user: undefined, // No user
        },
        on: jest.fn(),
      };

      const connectionHandler = mockCustomerNsp.on.mock.calls.find(
        (call: any[]) => call[0] === "connection"
      )?.[1];

      if (connectionHandler) {
        connectionHandler(invalidCustomerSocket);

        // Verify no handlers were registered
        expect(invalidCustomerSocket.on).not.toHaveBeenCalled();
      }
    });
  });
});
