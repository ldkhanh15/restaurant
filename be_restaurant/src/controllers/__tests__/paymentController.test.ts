// Mock models/index.ts TRƯỚC KHI import bất kỳ thứ gì
jest.mock("../../models/index", () => {
  return {};
});

import * as paymentController from "../paymentController";
import paymentService from "../../services/paymentService";
import orderService from "../../services/orderService";
import Order from "../../models/Order";
import Reservation from "../../models/Reservation";
import Payment from "../../models/Payment";
import { AppError } from "../../middlewares/errorHandler";

// Mock dependencies
jest.mock("../../services/paymentService");
jest.mock("../../services/orderService");
jest.mock("../../models/Order");
jest.mock("../../models/Reservation");
jest.mock("../../models/Payment");

const MockPaymentService = paymentService as jest.Mocked<typeof paymentService>;
const MockOrderService = orderService as jest.Mocked<typeof orderService>;
const MockOrder = Order as jest.Mocked<typeof Order>;
const MockReservation = Reservation as jest.Mocked<typeof Reservation>;

describe("PaymentController", () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: {},
      body: {},
      headers: {},
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
      user: {
        id: "user-123",
        email: "test@example.com",
        role: "customer",
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe("requestOrderPaymentRetry", () => {
    it("Kiểm tra retry thanh toán khi có payment failed", async () => {
      const orderId = "order-123";
      const mockOrder = {
        id: orderId,
        user_id: "user-123",
        status: "waiting_payment",
        payment_status: "failed",
      };

      const mockFailedPayment = {
        id: "payment-456",
        order_id: orderId,
        status: "failed",
      };

      const mockPaymentResult = {
        redirect_url: "https://vnpay.vn/payment",
      };

      mockReq.params.id = orderId;
      mockReq.body = {
        method: "vnpay",
        bankCode: "VNBANK",
        pointsUsed: 0,
      };

      (MockOrder.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (MockPaymentService.search as jest.Mock).mockResolvedValue({
        rows: [mockFailedPayment],
        count: 1,
      });

      // Mock retryPayment to be called
      const retryPaymentSpy = jest
        .spyOn(paymentController, "retryPayment")
        .mockImplementation(async (req: any, res: any, next: any) => {
          res.json({
            status: "success",
            data: mockPaymentResult,
          });
        });

      await paymentController.requestOrderPaymentRetry(
        mockReq,
        mockRes,
        mockNext
      );

      expect(MockOrder.findByPk).toHaveBeenCalledWith(orderId);
      expect(MockPaymentService.search).toHaveBeenCalledWith({
        order_id: orderId,
        status: "failed",
      });
      expect(retryPaymentSpy).toHaveBeenCalled();

      retryPaymentSpy.mockRestore();
    });

    it("Kiểm tra tạo payment mới khi không có payment failed", async () => {
      const orderId = "order-123";
      const mockOrder = {
        id: orderId,
        user_id: "user-123",
        status: "waiting_payment",
      };

      const mockPaymentResult = {
        redirect_url: "https://vnpay.vn/payment",
        vat_amount: 10000,
        points_used: 0,
        final_payment_amount: 110000,
      };

      mockReq.params.id = orderId;
      mockReq.body = {
        method: "vnpay",
        bankCode: "VNBANK",
        pointsUsed: 0,
      };

      (MockOrder.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (MockPaymentService.search as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0,
      });
      (MockOrderService.requestPayment as jest.Mock).mockResolvedValue(
        mockPaymentResult
      );

      await paymentController.requestOrderPaymentRetry(
        mockReq,
        mockRes,
        mockNext
      );

      expect(MockOrderService.requestPayment).toHaveBeenCalledWith(
        orderId,
        expect.objectContaining({
          bankCode: "VNBANK",
          client: "user",
          pointsUsed: 0,
          clientIp: expect.any(String),
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockPaymentResult,
      });
    });

    it("Kiểm tra retry thanh toán tiền mặt", async () => {
      const orderId = "order-123";
      const mockOrder = {
        id: orderId,
        user_id: "user-123",
        status: "waiting_payment",
      };

      const mockPaymentResult = {
        message: "Yêu cầu thanh toán tiền mặt đã được gửi",
        vat_amount: 10000,
        points_used: 0,
        final_payment_amount: 110000,
      };

      mockReq.params.id = orderId;
      mockReq.body = {
        method: "cash",
        note: "Thanh toán tại bàn",
        pointsUsed: 0,
      };

      (MockOrder.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (MockPaymentService.search as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0,
      });
      (MockOrderService.requestCashPayment as jest.Mock).mockResolvedValue(
        mockPaymentResult
      );

      await paymentController.requestOrderPaymentRetry(
        mockReq,
        mockRes,
        mockNext
      );

      expect(MockOrderService.requestCashPayment).toHaveBeenCalledWith(
        orderId,
        "Thanh toán tại bàn",
        0
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockPaymentResult,
      });
    });

    it("Kiểm tra lỗi khi không tìm thấy order", async () => {
      const orderId = "order-123";

      mockReq.params.id = orderId;
      mockReq.body = {
        method: "vnpay",
      };

      (MockOrder.findByPk as jest.Mock).mockResolvedValue(null);

      await paymentController.requestOrderPaymentRetry(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Order not found",
          statusCode: 404,
        })
      );
    });
  });

  describe("requestReservationDepositRetry", () => {
    it("Kiểm tra retry đặt cọc khi có payment failed", async () => {
      const reservationId = "reservation-123";
      const mockReservation = {
        id: reservationId,
        user_id: "user-123",
        status: "pending",
      };

      const mockFailedPayment = {
        id: "payment-456",
        reservation_id: reservationId,
        status: "failed",
      };

      const mockPaymentResult = {
        redirect_url: "https://vnpay.vn/payment",
      };

      mockReq.params.id = reservationId;
      mockReq.body = {
        bankCode: "VNBANK",
      };

      (MockReservation.findByPk as jest.Mock).mockResolvedValue(
        mockReservation
      );
      (MockPaymentService.search as jest.Mock).mockResolvedValue({
        rows: [mockFailedPayment],
        count: 1,
      });

      // Mock retryPayment to be called
      const retryPaymentSpy = jest
        .spyOn(paymentController, "retryPayment")
        .mockImplementation(async (req: any, res: any, next: any) => {
          res.json({
            status: "success",
            data: mockPaymentResult,
          });
        });

      await paymentController.requestReservationDepositRetry(
        mockReq,
        mockRes,
        mockNext
      );

      expect(MockReservation.findByPk).toHaveBeenCalledWith(reservationId);
      expect(MockPaymentService.search).toHaveBeenCalledWith({
        reservation_id: reservationId,
        status: "failed",
      });
      expect(retryPaymentSpy).toHaveBeenCalled();

      retryPaymentSpy.mockRestore();
    });

    it("Kiểm tra lỗi khi không tìm thấy reservation", async () => {
      const reservationId = "reservation-123";

      mockReq.params.id = reservationId;
      mockReq.body = {
        bankCode: "VNBANK",
      };

      (MockReservation.findByPk as jest.Mock).mockResolvedValue(null);

      await paymentController.requestReservationDepositRetry(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Reservation not found",
          statusCode: 404,
        })
      );
    });
  });
});
