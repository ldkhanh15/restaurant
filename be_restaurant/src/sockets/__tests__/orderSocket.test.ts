import { Server } from "socket.io";
import { orderEvents } from "../orderSocket";
import { forwardToAdmin, forwardToCustomer, broadcastToAdmin } from "../index";

// Mock socket.io helpers
jest.mock("../index", () => ({
  forwardToAdmin: jest.fn(),
  forwardToCustomer: jest.fn(),
  broadcastToAdmin: jest.fn(),
}));

describe("Order Socket Events", () => {
  let mockIO: Partial<Server>;
  let mockAdminNsp: any;
  let mockCustomerNsp: any;

  beforeEach(() => {
    // Mock admin namespace
    mockAdminNsp = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };

    // Mock customer namespace
    mockCustomerNsp = {
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

  describe("orderCreated", () => {
    it("Kiểm tra emit orderCreated event đến admin và customer", () => {
      const mockOrder = {
        id: "order-123",
        user_id: "user-456",
        customer_id: "user-456",
        status: "pending",
        total_amount: 100000,
        final_amount: 100000,
        updated_at: new Date().toISOString(),
      };

      orderEvents.orderCreated(mockIO as Server, mockOrder);

      // Verify broadcast to admin
      expect(broadcastToAdmin).toHaveBeenCalledWith(
        mockIO,
        "admin:order:created",
        expect.objectContaining({
          orderId: "order-123",
          status: "pending",
        })
      );

      // Verify forward to customer
      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        "user-456",
        "order:created",
        expect.objectContaining({
          orderId: "order-123",
          status: "pending",
        })
      );
    });

    it("Kiểm tra orderCreated không forward đến customer nếu không có customer_id", () => {
      const mockOrder = {
        id: "order-123",
        status: "pending",
        updated_at: new Date().toISOString(),
      };

      orderEvents.orderCreated(mockIO as Server, mockOrder);

      expect(broadcastToAdmin).toHaveBeenCalled();
      expect(forwardToCustomer).not.toHaveBeenCalled();
    });
  });

  describe("orderUpdated", () => {
    it("Kiểm tra emit orderUpdated event đến admin và customer", () => {
      const mockOrder = {
        id: "order-123",
        user_id: "user-456",
        status: "preparing",
        total_amount: 150000,
        final_amount: 150000,
        updated_at: new Date().toISOString(),
      };

      orderEvents.orderUpdated(mockIO as Server, mockOrder);

      expect(broadcastToAdmin).toHaveBeenCalledWith(
        mockIO,
        "admin:order:updated",
        expect.objectContaining({
          orderId: "order-123",
          status: "preparing",
        })
      );

      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        "user-456",
        "order:updated",
        expect.objectContaining({
          orderId: "order-123",
        })
      );
    });
  });

  describe("orderStatusChanged", () => {
    it("Kiểm tra emit orderStatusChanged event khi status thay đổi", () => {
      const mockOrder = {
        id: "order-123",
        user_id: "user-456",
        status: "completed",
        updated_at: new Date().toISOString(),
      };

      orderEvents.orderStatusChanged(mockIO as Server, mockOrder);

      expect(broadcastToAdmin).toHaveBeenCalledWith(
        mockIO,
        "admin:order:status_changed",
        expect.objectContaining({
          orderId: "order-123",
          status: "completed",
          id: "order-123",
        })
      );

      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        "user-456",
        "order:status_changed",
        expect.objectContaining({
          status: "completed",
        })
      );
    });
  });

  describe("paymentCompleted", () => {
    it("Kiểm tra emit paymentCompleted event sau khi thanh toán thành công", () => {
      const mockOrder = {
        id: "order-123",
        user_id: "user-456",
        customer_id: "user-456",
        status: "paid",
        payment_status: "completed",
        total_amount: 200000,
        final_amount: 200000,
        payment_method: "vnpay",
      };

      orderEvents.paymentCompleted(mockIO as Server, mockOrder);

      expect(broadcastToAdmin).toHaveBeenCalledWith(
        mockIO,
        "admin:order:payment_completed",
        expect.objectContaining({
          orderId: "order-123",
          payment_status: "completed",
        })
      );

      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        "user-456",
        "order:payment_completed",
        expect.objectContaining({
          orderId: "order-123",
        })
      );
    });
  });

  describe("orderItemCreated", () => {
    it("Kiểm tra emit orderItemCreated event khi thêm món mới vào đơn hàng", () => {
      const orderId = "order-123";
      const mockItem = {
        id: "item-456",
        order_id: orderId,
        dish_id: "dish-789",
        quantity: 2,
        price: 50000,
        status: "pending",
        dish: {
          id: "dish-789",
          name: "Pho Bo",
          price: 50000,
        },
      };

      const mockOrder = {
        id: orderId,
        user_id: "user-456",
        customer_id: "user-456",
        total_amount: 100000,
        final_amount: 100000,
        status: "pending",
      };

      orderEvents.orderItemCreated(
        mockIO as Server,
        orderId,
        mockItem,
        mockOrder
      );

      // Verify emit to admin namespace trong order room
      expect(mockIO.of).toHaveBeenCalledWith("/admin");
      expect(mockAdminNsp.to).toHaveBeenCalledWith(`order:${orderId}`);
      expect(mockAdminNsp.emit).toHaveBeenCalledWith(
        "admin:order:item_created",
        expect.objectContaining({
          orderId,
          itemId: "item-456",
          item: expect.objectContaining({
            id: "item-456",
            quantity: 2,
            status: "pending",
          }),
        })
      );

      // Verify forward to customer
      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        "user-456",
        "order:item_created",
        expect.objectContaining({
          orderId,
          itemId: "item-456",
        })
      );
    });
  });

  describe("orderItemStatusChanged", () => {
    it("Kiểm tra emit orderItemStatusChanged event khi cập nhật status món", () => {
      const orderId = "order-123";
      const mockItem = {
        id: "item-456",
        order_id: orderId,
        dish_id: "dish-789",
        quantity: 2,
        price: 50000,
        status: "completed", // Status đã thay đổi
        dish: {
          id: "dish-789",
          name: "Pho Bo",
        },
      };

      const mockOrder = {
        id: orderId,
        user_id: "user-456",
        total_amount: 100000,
        final_amount: 100000,
        status: "dining",
      };

      orderEvents.orderItemStatusChanged(
        mockIO as Server,
        orderId,
        mockItem,
        mockOrder
      );

      // Verify emit to admin namespace
      expect(mockAdminNsp.to).toHaveBeenCalledWith(`order:${orderId}`);
      expect(mockAdminNsp.emit).toHaveBeenCalledWith(
        "admin:order:item_status_changed",
        expect.objectContaining({
          orderId,
          itemId: "item-456",
          item: expect.objectContaining({
            status: "completed",
          }),
        })
      );

      // Verify forward to customer
      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        "user-456",
        "order:item_status_changed",
        expect.objectContaining({
          itemId: "item-456",
        })
      );
    });
  });

  describe("orderItemQuantityChanged", () => {
    it("Kiểm tra emit orderItemQuantityChanged event khi thay đổi số lượng món", () => {
      const orderId = "order-123";
      const mockItem = {
        id: "item-456",
        order_id: orderId,
        dish_id: "dish-789",
        quantity: 3, // Số lượng đã thay đổi từ 2 lên 3
        price: 50000,
        status: "pending",
        dish: {
          id: "dish-789",
          name: "Pho Bo",
        },
      };

      const mockOrder = {
        id: orderId,
        user_id: "user-456",
        total_amount: 150000, // Tổng tiền đã thay đổi
        final_amount: 150000,
        status: "pending",
      };

      orderEvents.orderItemQuantityChanged(
        mockIO as Server,
        orderId,
        mockItem,
        mockOrder
      );

      expect(mockAdminNsp.to).toHaveBeenCalledWith(`order:${orderId}`);
      expect(mockAdminNsp.emit).toHaveBeenCalledWith(
        "admin:order:item_quantity_changed",
        expect.objectContaining({
          orderId,
          itemId: "item-456",
          item: expect.objectContaining({
            quantity: 3,
          }),
          order: expect.objectContaining({
            total_amount: 150000,
          }),
        })
      );

      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        "user-456",
        "order:item_quantity_changed",
        expect.objectContaining({
          itemId: "item-456",
        })
      );
    });
  });

  describe("orderItemDeleted", () => {
    it("Kiểm tra emit orderItemDeleted event khi xóa món khỏi đơn hàng", () => {
      const orderId = "order-123";
      const itemId = "item-456";

      const mockOrder = {
        id: orderId,
        user_id: "user-456",
        total_amount: 50000, // Tổng tiền đã giảm
        final_amount: 50000,
        status: "pending",
      };

      orderEvents.orderItemDeleted(
        mockIO as Server,
        orderId,
        itemId,
        mockOrder
      );

      expect(mockAdminNsp.to).toHaveBeenCalledWith(`order:${orderId}`);
      expect(mockAdminNsp.emit).toHaveBeenCalledWith(
        "admin:order:item_deleted",
        expect.objectContaining({
          orderId,
          itemId,
          order: expect.objectContaining({
            total_amount: 50000,
          }),
        })
      );

      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        "user-456",
        "order:item_deleted",
        expect.objectContaining({
          itemId,
        })
      );
    });
  });

  describe("voucherApplied", () => {
    it("Kiểm tra emit voucherApplied event khi áp dụng voucher", () => {
      const mockOrder = {
        id: "order-123",
        user_id: "user-456",
        voucher_id: "voucher-789",
        voucher_discount_amount: 10000,
        total_amount: 100000,
        final_amount: 90000,
      };

      orderEvents.voucherApplied(mockIO as Server, mockOrder);

      expect(broadcastToAdmin).toHaveBeenCalledWith(
        mockIO,
        "admin:order:voucher_applied",
        expect.objectContaining({
          orderId: "order-123",
          voucher_id: "voucher-789",
        })
      );

      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        "user-456",
        "order:voucher_applied",
        expect.objectContaining({
          orderId: "order-123",
        })
      );
    });
  });

  describe("supportRequested", () => {
    it("Kiểm tra emit supportRequested event khi khách yêu cầu hỗ trợ", () => {
      const mockOrder = {
        id: "order-123",
        user_id: "user-456",
        customer_id: "user-456",
      };

      orderEvents.supportRequested(mockIO as Server, mockOrder);

      // Chỉ notify admin, không notify customer
      expect(broadcastToAdmin).toHaveBeenCalledWith(
        mockIO,
        "admin:order:support_requested",
        expect.objectContaining({
          orderId: "order-123",
          customerId: "user-456",
        })
      );

      expect(forwardToCustomer).not.toHaveBeenCalled();
    });
  });
});
