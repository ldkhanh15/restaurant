import { Server } from "socket.io";
import { reservationEvents } from "../reservationSocket";
import { forwardToAdmin, forwardToCustomer, broadcastToAdmin } from "../index";

// Mock socket.io helpers
jest.mock("../index", () => ({
  forwardToAdmin: jest.fn(),
  forwardToCustomer: jest.fn(),
  broadcastToAdmin: jest.fn(),
}));

describe("Reservation Socket Events", () => {
  let mockIO: Partial<Server>;

  beforeEach(() => {
    mockIO = {} as any;
    jest.clearAllMocks();
  });

  describe("reservationCreated", () => {
    it("Kiểm tra emit reservationCreated event đến admin và customer", () => {
      const mockReservation = {
        id: "reservation-123",
        user_id: "user-456",
        table_id: "table-789",
        reservation_date: "2024-12-25",
        reservation_time: "18:00",
        number_of_guests: 4,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      reservationEvents.reservationCreated(mockIO as Server, mockReservation);

      // Verify broadcast to admin
      expect(broadcastToAdmin).toHaveBeenCalledWith(
        mockIO,
        "admin:reservation:created",
        expect.objectContaining({
          reservationId: "reservation-123",
          status: "pending",
          number_of_guests: 4,
        })
      );

      // Verify forward to customer
      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        "user-456",
        "reservation:created",
        expect.objectContaining({
          reservationId: "reservation-123",
        })
      );
    });

    it("Kiểm tra reservationCreated không forward đến customer nếu không có user_id", () => {
      const mockReservation = {
        id: "reservation-123",
        status: "pending",
      };

      reservationEvents.reservationCreated(mockIO as Server, mockReservation);

      expect(broadcastToAdmin).toHaveBeenCalled();
      expect(forwardToCustomer).not.toHaveBeenCalled();
    });
  });

  describe("reservationUpdated", () => {
    it("Kiểm tra emit reservationUpdated event khi cập nhật thông tin đặt bàn", () => {
      const mockReservation = {
        id: "reservation-123",
        user_id: "user-456",
        number_of_guests: 6, // Đã thay đổi từ 4 lên 6
        special_requests: "Bàn gần cửa sổ",
        updated_at: new Date().toISOString(),
      };

      reservationEvents.reservationUpdated(mockIO as Server, mockReservation);

      expect(broadcastToAdmin).toHaveBeenCalledWith(
        mockIO,
        "admin:reservation:updated",
        expect.objectContaining({
          reservationId: "reservation-123",
          number_of_guests: 6,
        })
      );

      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        "user-456",
        "reservation:updated",
        expect.objectContaining({
          reservationId: "reservation-123",
        })
      );
    });
  });

  describe("reservationStatusChanged", () => {
    it("Kiểm tra emit reservationStatusChanged event khi status thay đổi", () => {
      const mockReservation = {
        id: "reservation-123",
        user_id: "user-456",
        status: "confirmed", // Status đã thay đổi từ pending -> confirmed
        updated_at: new Date().toISOString(),
      };

      reservationEvents.reservationStatusChanged(
        mockIO as Server,
        mockReservation
      );

      expect(broadcastToAdmin).toHaveBeenCalledWith(
        mockIO,
        "admin:reservation:status_changed",
        expect.objectContaining({
          reservationId: "reservation-123",
          status: "confirmed",
          changes: { status: "confirmed" },
        })
      );

      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        "user-456",
        "reservation:status_changed",
        expect.objectContaining({
          status: "confirmed",
        })
      );
    });

    it("Kiểm tra reservationStatusChanged với status cancelled", () => {
      const mockReservation = {
        id: "reservation-123",
        user_id: "user-456",
        status: "cancelled",
        cancellation_reason: "Khách hủy",
        updated_at: new Date().toISOString(),
      };

      reservationEvents.reservationStatusChanged(
        mockIO as Server,
        mockReservation
      );

      expect(broadcastToAdmin).toHaveBeenCalledWith(
        mockIO,
        "admin:reservation:status_changed",
        expect.objectContaining({
          status: "cancelled",
        })
      );

      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        "user-456",
        "reservation:status_changed",
        expect.objectContaining({
          status: "cancelled",
        })
      );
    });
  });

  describe("reservationCheckedIn", () => {
    it("Kiểm tra emit reservationCheckedIn event khi khách check-in", () => {
      const mockReservation = {
        id: "reservation-123",
        user_id: "user-456",
        table_id: "table-789",
        status: "checked_in",
        checked_in_at: new Date().toISOString(),
      };

      const mockOrder = {
        id: "order-456",
        reservation_id: "reservation-123",
        status: "dining",
        total_amount: 200000,
      };

      reservationEvents.reservationCheckedIn(
        mockIO as Server,
        mockReservation,
        mockOrder
      );

      expect(broadcastToAdmin).toHaveBeenCalledWith(
        mockIO,
        "admin:reservation:checked_in",
        expect.objectContaining({
          reservationId: "reservation-123",
          reservation: expect.objectContaining({
            status: "checked_in",
          }),
          order: expect.objectContaining({
            id: "order-456",
          }),
        })
      );

      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        "user-456",
        "reservation:checked_in",
        expect.objectContaining({
          reservationId: "reservation-123",
        })
      );
    });
  });

  describe("depositPaymentRequested", () => {
    it("Kiểm tra emit depositPaymentRequested event khi yêu cầu thanh toán cọc", () => {
      const mockReservation = {
        id: "reservation-123",
        user_id: "user-456",
        deposit_amount: 50000,
      };

      const paymentUrl = "https://vnpay.vn/payment/abc123";

      reservationEvents.depositPaymentRequested(
        mockIO as Server,
        mockReservation,
        paymentUrl
      );

      expect(broadcastToAdmin).toHaveBeenCalledWith(
        mockIO,
        "admin:reservation:deposit_payment_requested",
        expect.objectContaining({
          reservationId: "reservation-123",
          payment_url: paymentUrl,
        })
      );

      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        "user-456",
        "reservation:deposit_payment_requested",
        expect.objectContaining({
          payment_url: paymentUrl,
        })
      );
    });
  });

  describe("depositPaymentCompleted", () => {
    it("Kiểm tra emit depositPaymentCompleted event khi thanh toán cọc thành công", () => {
      const mockReservation = {
        id: "reservation-123",
        user_id: "user-456",
        deposit_amount: 50000,
        deposit_paid: true,
        deposit_paid_at: new Date().toISOString(),
      };

      reservationEvents.depositPaymentCompleted(
        mockIO as Server,
        mockReservation
      );

      expect(broadcastToAdmin).toHaveBeenCalledWith(
        mockIO,
        "admin:reservation:deposit_payment_completed",
        expect.objectContaining({
          reservationId: "reservation-123",
          deposit_paid: true,
        })
      );

      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        "user-456",
        "reservation:deposit_payment_completed",
        expect.objectContaining({
          reservationId: "reservation-123",
        })
      );
    });
  });

  describe("depositPaymentFailed", () => {
    it("Kiểm tra emit depositPaymentFailed event khi thanh toán cọc thất bại", () => {
      const mockReservation = {
        id: "reservation-123",
        user_id: "user-456",
        deposit_amount: 50000,
        deposit_paid: false,
      };

      reservationEvents.depositPaymentFailed(mockIO as Server, mockReservation);

      expect(broadcastToAdmin).toHaveBeenCalledWith(
        mockIO,
        "admin:reservation:deposit_payment_failed",
        expect.objectContaining({
          reservationId: "reservation-123",
        })
      );

      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        "user-456",
        "reservation:deposit_payment_failed",
        expect.objectContaining({
          reservationId: "reservation-123",
        })
      );
    });
  });

  describe("reservationDishAdded", () => {
    it("Kiểm tra emit reservationDishAdded event khi thêm món vào pre-order", () => {
      const reservationId = "reservation-123";
      const mockDish = {
        id: "dish-456",
        name: "Pho Bo",
        price: 50000,
        quantity: 2,
      };

      const mockReservation = {
        id: reservationId,
        user_id: "user-456",
        pre_order_items: [mockDish],
        deposit_amount: 100000,
        updated_at: new Date().toISOString(),
      };

      reservationEvents.reservationDishAdded(
        mockIO as Server,
        reservationId,
        mockDish,
        mockReservation
      );

      expect(broadcastToAdmin).toHaveBeenCalledWith(
        mockIO,
        "admin:reservation:dish_added",
        expect.objectContaining({
          reservationId,
          dish: expect.objectContaining({
            id: "dish-456",
            name: "Pho Bo",
          }),
          reservation: expect.objectContaining({
            pre_order_items: [mockDish],
          }),
        })
      );

      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        "user-456",
        "reservation:dish_added",
        expect.objectContaining({
          reservationId,
          dish: mockDish,
        })
      );
    });
  });

  describe("reservationDishUpdated", () => {
    it("Kiểm tra emit reservationDishUpdated event khi cập nhật món trong pre-order", () => {
      const reservationId = "reservation-123";
      const mockDish = {
        id: "dish-456",
        name: "Pho Bo",
        price: 50000,
        quantity: 3, // Số lượng đã thay đổi
      };

      const mockReservation = {
        id: reservationId,
        user_id: "user-456",
        pre_order_items: [mockDish],
        deposit_amount: 150000, // Deposit đã thay đổi
        updated_at: new Date().toISOString(),
      };

      reservationEvents.reservationDishUpdated(
        mockIO as Server,
        reservationId,
        mockDish,
        mockReservation
      );

      expect(broadcastToAdmin).toHaveBeenCalledWith(
        mockIO,
        "admin:reservation:dish_updated",
        expect.objectContaining({
          reservationId,
          dish: expect.objectContaining({
            quantity: 3,
          }),
        })
      );

      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        "user-456",
        "reservation:dish_updated",
        expect.objectContaining({
          reservationId,
        })
      );
    });
  });

  describe("reservationDishRemoved", () => {
    it("Kiểm tra emit reservationDishRemoved event khi xóa món khỏi pre-order", () => {
      const reservationId = "reservation-123";
      const dishId = "dish-456";

      const mockReservation = {
        id: reservationId,
        user_id: "user-456",
        pre_order_items: [], // Món đã bị xóa
        deposit_amount: 50000, // Deposit đã giảm
        updated_at: new Date().toISOString(),
      };

      reservationEvents.reservationDishRemoved(
        mockIO as Server,
        reservationId,
        dishId,
        mockReservation
      );

      expect(broadcastToAdmin).toHaveBeenCalledWith(
        mockIO,
        "admin:reservation:dish_removed",
        expect.objectContaining({
          reservationId,
          dishId,
          reservation: expect.objectContaining({
            pre_order_items: [],
          }),
        })
      );

      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        "user-456",
        "reservation:dish_removed",
        expect.objectContaining({
          reservationId,
          dishId,
        })
      );
    });
  });
});
