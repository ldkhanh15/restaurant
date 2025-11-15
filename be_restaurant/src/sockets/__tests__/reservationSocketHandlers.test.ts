import { Server } from "socket.io";
import registerReservationSocket from "../reservationSocket";
import { forwardToAdmin } from "../index";

// Mock socket.io helpers
jest.mock("../index", () => ({
  forwardToAdmin: jest.fn(),
  forwardToCustomer: jest.fn(),
  broadcastToAdmin: jest.fn(),
}));

describe("Reservation Socket Handlers (Connection Handlers)", () => {
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
      registerReservationSocket(mockIO as Server);
    });

    it("Kiểm tra admin join reservation room khi nhận reservation:join event", () => {
      const connectionHandler = mockAdminNsp.on.mock.calls.find(
        (call: any[]) => call[0] === "connection"
      )?.[1];

      if (connectionHandler) {
        connectionHandler(mockAdminSocket);

        const joinHandler = mockAdminSocket.on.mock.calls.find(
          (call: any[]) => call[0] === "reservation:join"
        )?.[1];

        if (joinHandler) {
          const reservationId = "reservation-123";
          joinHandler(reservationId);

          expect(mockAdminSocket.join).toHaveBeenCalledWith(
            `reservation:${reservationId}`
          );
        }
      }
    });

    it("Kiểm tra admin join table room khi nhận reservation:join_table event", () => {
      const connectionHandler = mockAdminNsp.on.mock.calls.find(
        (call: any[]) => call[0] === "connection"
      )?.[1];

      if (connectionHandler) {
        connectionHandler(mockAdminSocket);

        const joinTableHandler = mockAdminSocket.on.mock.calls.find(
          (call: any[]) => call[0] === "reservation:join_table"
        )?.[1];

        if (joinTableHandler) {
          const tableId = "table-789";
          joinTableHandler(tableId);

          expect(mockAdminSocket.join).toHaveBeenCalledWith(`table:${tableId}`);
        }
      }
    });

    it("Kiểm tra admin join table group room khi nhận reservation:join_table_group event", () => {
      const connectionHandler = mockAdminNsp.on.mock.calls.find(
        (call: any[]) => call[0] === "connection"
      )?.[1];

      if (connectionHandler) {
        connectionHandler(mockAdminSocket);

        const joinTableGroupHandler = mockAdminSocket.on.mock.calls.find(
          (call: any[]) => call[0] === "reservation:join_table_group"
        )?.[1];

        if (joinTableGroupHandler) {
          const tableGroupId = "table-group-456";
          joinTableGroupHandler(tableGroupId);

          expect(mockAdminSocket.join).toHaveBeenCalledWith(
            `table_group:${tableGroupId}`
          );
        }
      }
    });
  });

  describe("Customer Namespace Handlers", () => {
    beforeEach(() => {
      registerReservationSocket(mockIO as Server);
    });

    it("Kiểm tra customer join reservation room và notify admin", () => {
      const connectionHandler = mockCustomerNsp.on.mock.calls.find(
        (call: any[]) => call[0] === "connection"
      )?.[1];

      if (connectionHandler) {
        connectionHandler(mockCustomerSocket);

        const joinHandler = mockCustomerSocket.on.mock.calls.find(
          (call: any[]) => call[0] === "reservation:join"
        )?.[1];

        if (joinHandler) {
          const reservationId = "reservation-123";
          joinHandler(reservationId);

          // Verify customer joins reservation room
          expect(mockCustomerSocket.join).toHaveBeenCalledWith(
            `reservation:${reservationId}`
          );

          // Verify notify admin
          expect(forwardToAdmin).toHaveBeenCalledWith(
            mockIO,
            "reservation:customer_joined",
            expect.objectContaining({
              customer_id: "customer-456",
              reservationId,
            })
          );
        }
      }
    });

    it("Kiểm tra customer không join reservation room nếu reservationId rỗng", () => {
      const connectionHandler = mockCustomerNsp.on.mock.calls.find(
        (call: any[]) => call[0] === "connection"
      )?.[1];

      if (connectionHandler) {
        connectionHandler(mockCustomerSocket);

        const joinHandler = mockCustomerSocket.on.mock.calls.find(
          (call: any[]) => call[0] === "reservation:join"
        )?.[1];

        if (joinHandler) {
          joinHandler(""); // Empty reservationId

          expect(mockCustomerSocket.join).not.toHaveBeenCalled();
          expect(forwardToAdmin).not.toHaveBeenCalled();
        }
      }
    });
  });
});
