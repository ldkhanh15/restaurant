import { Server } from "socket.io";
import { forwardToAdmin, forwardToCustomer, broadcastToAdmin } from "../index";

describe("Socket Helper Functions", () => {
  let mockIO: Partial<Server>;
  let mockAdminNsp: any;
  let mockCustomerNsp: any;
  let mockRoom: any;

  beforeEach(() => {
    // Mock room (returned by .to())
    mockRoom = {
      emit: jest.fn(),
    };

    // Mock admin namespace
    mockAdminNsp = {
      emit: jest.fn(),
      to: jest.fn().mockReturnValue(mockRoom),
    };

    // Mock customer namespace
    mockCustomerNsp = {
      emit: jest.fn(),
      to: jest.fn().mockReturnValue(mockRoom),
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

  describe("forwardToAdmin", () => {
    it("Kiểm tra forwardToAdmin emit event đến admin namespace với prefix customer:", () => {
      const event = "order:created";
      const data = {
        customer_id: "user-123",
        orderId: "order-456",
        status: "pending",
      };

      forwardToAdmin(mockIO as Server, event, data);

      // Verify get admin namespace
      expect(mockIO.of).toHaveBeenCalledWith("/admin");

      // Verify emit với prefix customer:
      expect(mockAdminNsp.emit).toHaveBeenCalledWith(
        `customer:${event}`,
        expect.objectContaining({
          customer_id: "user-123",
          orderId: "order-456",
          status: "pending",
          timestamp: expect.any(String),
        })
      );
    });

    it("Kiểm tra forwardToAdmin extract customer_id từ data", () => {
      const event = "reservation:created";
      const data = {
        customer_id: "user-789",
        reservationId: "reservation-123",
        extra_field: "test",
      };

      forwardToAdmin(mockIO as Server, event, data);

      expect(mockAdminNsp.emit).toHaveBeenCalledWith(
        "customer:reservation:created",
        expect.objectContaining({
          customer_id: "user-789",
          reservationId: "reservation-123",
          extra_field: "test",
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe("forwardToCustomer", () => {
    it("Kiểm tra forwardToCustomer emit event đến customer room cụ thể", () => {
      const customerId = "user-123";
      const event = "order:created";
      const data = {
        orderId: "order-456",
        status: "pending",
      };

      forwardToCustomer(mockIO as Server, customerId, event, data);

      // Verify get customer namespace
      expect(mockIO.of).toHaveBeenCalledWith("/customer");

      // Verify join customer room
      expect(mockCustomerNsp.to).toHaveBeenCalledWith(`customer:${customerId}`);

      // Verify emit với metadata
      expect(mockRoom.emit).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          orderId: "order-456",
          status: "pending",
          from_admin: true,
          timestamp: expect.any(String),
        })
      );
    });

    it("Kiểm tra forwardToCustomer thêm from_admin flag", () => {
      const customerId = "user-456";
      const event = "reservation:status_changed";
      const data = {
        reservationId: "reservation-789",
        status: "confirmed",
      };

      forwardToCustomer(mockIO as Server, customerId, event, data);

      expect(mockRoom.emit).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          reservationId: "reservation-789",
          status: "confirmed",
          from_admin: true,
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe("broadcastToAdmin", () => {
    it("Kiểm tra broadcastToAdmin emit event đến tất cả admin", () => {
      const event = "admin:order:created";
      const data = {
        orderId: "order-123",
        status: "pending",
        total_amount: 100000,
      };

      broadcastToAdmin(mockIO as Server, event, data);

      // Verify get admin namespace
      expect(mockIO.of).toHaveBeenCalledWith("/admin");

      // Verify emit đến tất cả admin (không dùng .to())
      expect(mockAdminNsp.emit).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          orderId: "order-123",
          status: "pending",
          total_amount: 100000,
          timestamp: expect.any(String),
        })
      );

      // Verify không dùng .to() (broadcast to all)
      expect(mockAdminNsp.to).not.toHaveBeenCalled();
    });

    it("Kiểm tra broadcastToAdmin thêm timestamp vào data", () => {
      const event = "admin:reservation:status_changed";
      const data = {
        reservationId: "reservation-456",
        status: "confirmed",
      };

      broadcastToAdmin(mockIO as Server, event, data);

      expect(mockAdminNsp.emit).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          reservationId: "reservation-456",
          status: "confirmed",
          timestamp: expect.any(String),
        })
      );

      // Verify timestamp là ISO string
      const callArgs = mockAdminNsp.emit.mock.calls[0];
      const emittedData = callArgs[1];
      expect(new Date(emittedData.timestamp).toISOString()).toBe(
        emittedData.timestamp
      );
    });
  });

  describe("Integration: Multiple helpers", () => {
    it("Kiểm tra flow: orderCreated sử dụng cả broadcastToAdmin và forwardToCustomer", () => {
      const order = {
        id: "order-123",
        user_id: "user-456",
        status: "pending",
      };

      // Simulate orderCreated flow
      broadcastToAdmin(mockIO as Server, "admin:order:created", {
        orderId: order.id,
        ...order,
      });

      forwardToCustomer(mockIO as Server, order.user_id, "order:created", {
        orderId: order.id,
        ...order,
      });

      // Verify both were called
      expect(mockAdminNsp.emit).toHaveBeenCalledWith(
        "admin:order:created",
        expect.any(Object)
      );

      expect(mockCustomerNsp.to).toHaveBeenCalledWith("customer:user-456");
      expect(mockRoom.emit).toHaveBeenCalledWith(
        "order:created",
        expect.any(Object)
      );
    });
  });
});
