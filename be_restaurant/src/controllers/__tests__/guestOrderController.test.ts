// Mock models/index.ts TRƯỚC KHI import bất kỳ thứ gì
jest.mock("../../models/index", () => {
  return {};
});

// Mock OrderItem model before importing controller
const mockOrderItemFindByPk = jest.fn();
jest.mock("../../models/OrderItem", () => ({
  __esModule: true,
  default: {
    findByPk: jest.fn(),
  },
}));

// Mock paymentService before importing controller
jest.mock("../../services/paymentService", () => ({
  __esModule: true,
  default: {
    search: jest.fn(),
  },
}));

import * as guestOrderController from "../guestOrderController";
import orderService from "../../services/orderService";
import { orderEvents } from "../../sockets/orderSocket";
import { tableEvents } from "../../sockets/tableSocket";
import { getIO } from "../../sockets";
import { AppError } from "../../middlewares/errorHandler";

// Mock dependencies
jest.mock("../../services/orderService");
jest.mock("../../sockets/orderSocket");
jest.mock("../../sockets/tableSocket");
jest.mock("../../sockets", () => ({
  getIO: jest.fn(),
}));

const MockOrderService = orderService as jest.Mocked<typeof orderService>;
const MockGetIO = getIO as jest.MockedFunction<typeof getIO>;

// Get mocked OrderItem and paymentService
import OrderItem from "../../models/OrderItem";
import paymentService from "../../services/paymentService";
const MockOrderItem = OrderItem as jest.Mocked<typeof OrderItem>;
const MockPaymentService = paymentService as jest.Mocked<typeof paymentService>;

describe("GuestOrderController", () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;
  let mockIO: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockIO = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    MockGetIO.mockReturnValue(mockIO);

    mockReq = {
      query: {},
      params: {},
      body: {},
      user: null, // Guest users don't have user
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe("getCurrentOrder", () => {
    it("Kiểm tra lấy đơn hàng hiện tại thành công", async () => {
      const mockOrder = {
        id: "order-123",
        table_id: "table-456",
        status: "dining",
        total_amount: 100000,
      };

      mockReq.query.table_id = "table-456";
      MockOrderService.getOrderByTable.mockResolvedValue(mockOrder as any);

      await guestOrderController.getCurrentOrder(mockReq, mockRes, mockNext);

      expect(MockOrderService.getOrderByTable).toHaveBeenCalledWith("table-456");
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockOrder,
      });
    });

    it("Kiểm tra lỗi khi thiếu table_id", async () => {
      mockReq.query.table_id = undefined;

      await guestOrderController.getCurrentOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "table_id is required",
      });
    });

    it("Kiểm tra lỗi khi không tìm thấy đơn hàng", async () => {
      mockReq.query.table_id = "table-456";
      MockOrderService.getOrderByTable.mockResolvedValue(null);

      await guestOrderController.getCurrentOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "No active order found for this table",
      });
    });
  });

  describe("addItem", () => {
    it("Kiểm tra thêm món vào đơn hàng mới (tạo đơn hàng nếu chưa có)", async () => {
      const mockOrder = {
        id: "order-123",
        table_id: "table-456",
        status: "dining",
        items: [],
      };

      mockReq.body = {
        table_id: "table-456",
        dish_id: "dish-789",
        quantity: 2,
      };

      // No existing order
      MockOrderService.getOrderByTable.mockResolvedValue(null);
      MockOrderService.createOrder.mockResolvedValue(mockOrder as any);
      MockOrderService.getOrderById.mockResolvedValue(mockOrder as any);

      await guestOrderController.addItem(mockReq, mockRes, mockNext);

      expect(MockOrderService.getOrderByTable).toHaveBeenCalledWith("table-456");
      expect(MockOrderService.createOrder).toHaveBeenCalledWith({
        table_id: "table-456",
        items: [{ dish_id: "dish-789", quantity: 2, price: 0 }],
        status: "dining",
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockOrder,
      });
    });

    it("Kiểm tra thêm món vào đơn hàng đã tồn tại", async () => {
      const existingOrder = {
        id: "order-123",
        table_id: "table-456",
        status: "dining",
        items: [],
      };

      const updatedOrder = {
        ...existingOrder,
        items: [{ id: "item-1", dish_id: "dish-789", quantity: 2 }],
      };

      mockReq.body = {
        table_id: "table-456",
        dish_id: "dish-789",
        quantity: 2,
      };

      MockOrderService.getOrderByTable.mockResolvedValue(existingOrder as any);
      MockOrderService.addItemToOrder.mockResolvedValue(updatedOrder as any);
      MockOrderService.getOrderById.mockResolvedValue(updatedOrder as any);

      await guestOrderController.addItem(mockReq, mockRes, mockNext);

      expect(MockOrderService.addItemToOrder).toHaveBeenCalledWith("order-123", {
        dish_id: "dish-789",
        quantity: 2,
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: updatedOrder,
      });
    });
  });

  describe("updateItemQuantity", () => {
    it("Kiểm tra cập nhật số lượng món thành công", async () => {
      const mockOrder = {
        id: "order-123",
        table_id: "table-456",
        items: [{ id: "item-1", quantity: 3 }],
      };

      mockReq.body = {
        table_id: "table-456",
        item_id: "item-1",
        quantity: 5,
      };

      // Mock OrderItem.findByPk for dynamic import
      (MockOrderItem.findByPk as jest.Mock).mockResolvedValue({
        id: "item-1",
        order_id: "order-123",
      });

      MockOrderService.getOrderByTable.mockResolvedValue(mockOrder as any);
      MockOrderService.updateItemQuantity.mockResolvedValue(mockOrder as any);
      MockOrderService.getOrderById.mockResolvedValue(mockOrder as any);

      await guestOrderController.updateItemQuantity(mockReq, mockRes, mockNext);

      expect(MockOrderService.updateItemQuantity).toHaveBeenCalledWith(
        "item-1",
        5
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockOrder,
      });
    });

    it("Kiểm tra lỗi khi không tìm thấy đơn hàng", async () => {
      mockReq.body = {
        table_id: "table-456",
        item_id: "item-1",
        quantity: 5,
      };

      MockOrderService.getOrderByTable.mockResolvedValue(null);

      await guestOrderController.updateItemQuantity(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "No active order found for this table",
      });
    });
  });

  describe("updateItemStatus", () => {
    it("Kiểm tra cập nhật trạng thái món thành công", async () => {
      const mockOrder = {
        id: "order-123",
        table_id: "table-456",
        items: [{ id: "item-1", status: "pending" }],
      };

      mockReq.body = {
        table_id: "table-456",
        item_id: "item-1",
        status: "preparing",
      };

      // Mock OrderItem.findByPk
      (MockOrderItem.findByPk as jest.Mock).mockResolvedValue({
        id: "item-1",
        order_id: "order-123",
      });

      MockOrderService.getOrderByTable.mockResolvedValue(mockOrder as any);
      MockOrderService.updateItemStatus.mockResolvedValue(mockOrder as any);
      MockOrderService.getOrderById.mockResolvedValue(mockOrder as any);

      await guestOrderController.updateItemStatus(mockReq, mockRes, mockNext);

      expect(MockOrderService.updateItemStatus).toHaveBeenCalledWith(
        "item-1",
        "preparing"
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockOrder,
      });
    });
  });

  describe("removeItem", () => {
    it("Kiểm tra xóa món thành công", async () => {
      const mockOrder = {
        id: "order-123",
        table_id: "table-456",
        items: [],
      };

      mockReq.query = {
        table_id: "table-456",
        item_id: "item-1",
      };

      MockOrderService.getOrderByTable.mockResolvedValue(mockOrder as any);
      MockOrderService.deleteItem.mockResolvedValue(null as any);
      MockOrderService.getOrderById.mockResolvedValue(mockOrder as any);

      await guestOrderController.removeItem(mockReq, mockRes, mockNext);

      expect(MockOrderService.deleteItem).toHaveBeenCalledWith("item-1");
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockOrder,
      });
    });
  });

  describe("applyVoucher", () => {
    it("Kiểm tra áp dụng voucher thành công", async () => {
      const mockOrder = {
        id: "order-123",
        table_id: "table-456",
        voucher_id: "voucher-789",
        voucher_discount_amount: 10000,
      };

      mockReq.body = {
        table_id: "table-456",
        voucher_code: "DISCOUNT10",
      };

      MockOrderService.getOrderByTable.mockResolvedValue(mockOrder as any);
      MockOrderService.applyVoucher.mockResolvedValue(mockOrder as any);
      MockOrderService.getOrderById.mockResolvedValue(mockOrder as any);

      await guestOrderController.applyVoucher(mockReq, mockRes, mockNext);

      expect(MockOrderService.applyVoucher).toHaveBeenCalledWith(
        "order-123",
        "DISCOUNT10"
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockOrder,
      });
    });
  });

  describe("removeVoucher", () => {
    it("Kiểm tra xóa voucher thành công", async () => {
      const mockOrder = {
        id: "order-123",
        table_id: "table-456",
        voucher_id: null,
      };

      mockReq.query = {
        table_id: "table-456",
      };

      MockOrderService.getOrderByTable.mockResolvedValue(mockOrder as any);
      MockOrderService.removeVoucher.mockResolvedValue(mockOrder as any);
      MockOrderService.getOrderById.mockResolvedValue(mockOrder as any);

      await guestOrderController.removeVoucher(mockReq, mockRes, mockNext);

      expect(MockOrderService.removeVoucher).toHaveBeenCalledWith("order-123");
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockOrder,
      });
    });
  });

  describe("requestSupport", () => {
    it("Kiểm tra yêu cầu hỗ trợ thành công", async () => {
      const mockOrder = {
        id: "order-123",
        table_id: "table-456",
      };

      mockReq.body = {
        table_id: "table-456",
      };

      MockOrderService.getOrderByTable.mockResolvedValue(mockOrder as any);
      MockOrderService.requestSupport.mockResolvedValue({ 
        status: "success",
        data: { message: "Support request sent successfully" }
      } as any);
      MockOrderService.getOrderById.mockResolvedValue(mockOrder as any);

      await guestOrderController.requestSupport(mockReq, mockRes, mockNext);

      expect(MockOrderService.requestSupport).toHaveBeenCalledWith("order-123");
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: expect.objectContaining({
          message: expect.any(String),
        }),
      });
    });
  });

  describe("requestPayment", () => {
    it("Kiểm tra yêu cầu thanh toán VNPay thành công", async () => {
      const mockOrder = {
        id: "order-123",
        table_id: "table-456",
        total_amount: 100000,
      };

      const mockPaymentResult = {
        redirect_url: "https://vnpay.vn/payment",
        vat_amount: 10000,
        points_used: 0,
        final_payment_amount: 110000,
      };

      mockReq.body = {
        table_id: "table-456",
        method: "vnpay",
        points_used: 0,
      };

      mockReq.headers = {};
      mockReq.ip = "127.0.0.1";

      MockOrderService.getOrderByTable.mockResolvedValue(mockOrder as any);
      MockOrderService.requestPayment.mockResolvedValue(mockPaymentResult as any);
      MockOrderService.getOrderById.mockResolvedValue(mockOrder as any);

      await guestOrderController.requestPayment(mockReq, mockRes, mockNext);

      expect(MockOrderService.requestPayment).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockPaymentResult,
      });
    });

    it("Kiểm tra yêu cầu thanh toán tiền mặt thành công", async () => {
      const mockOrder = {
        id: "order-123",
        table_id: "table-456",
        total_amount: 100000,
      };

      const mockPaymentResult = {
        message: "Yêu cầu thanh toán tiền mặt đã được gửi",
        vat_amount: 10000,
        points_used: 0,
        final_payment_amount: 110000,
      };

      mockReq.body = {
        table_id: "table-456",
        method: "cash",
        note: "Thanh toán tại bàn",
        points_used: 0,
      };

      MockOrderService.getOrderByTable.mockResolvedValue(mockOrder as any);
      MockOrderService.requestCashPayment.mockResolvedValue(mockPaymentResult as any);
      MockOrderService.getOrderById.mockResolvedValue(mockOrder as any);

      await guestOrderController.requestPayment(mockReq, mockRes, mockNext);

      expect(MockOrderService.requestCashPayment).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockPaymentResult,
      });
    });
  });

  describe("requestPaymentRetry", () => {
    it("Kiểm tra yêu cầu thanh toán lại thành công", async () => {
      const mockOrder = {
        id: "order-123",
        table_id: "table-456",
        payment_status: "failed",
      };

      const mockPaymentResult = {
        redirect_url: "https://vnpay.vn/payment",
      };

      mockReq.body = {
        table_id: "table-456",
        method: "vnpay",
      };

      mockReq.headers = {};
      mockReq.ip = "127.0.0.1";

      // Mock paymentService.search to return no failed payments (will use regular requestPayment)
      (MockPaymentService.search as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

      MockOrderService.getOrderByTable.mockResolvedValue(mockOrder as any);
      MockOrderService.requestPayment.mockResolvedValue(mockPaymentResult as any);
      MockOrderService.getOrderById.mockResolvedValue(mockOrder as any);

      await guestOrderController.requestPaymentRetry(mockReq, mockRes, mockNext);

      expect(MockOrderService.requestPayment).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: expect.objectContaining({
          redirect_url: mockPaymentResult.redirect_url,
        }),
      });
    });
  });

  describe("requestCashPayment", () => {
    it("Kiểm tra yêu cầu thanh toán tiền mặt thành công", async () => {
      const mockOrder = {
        id: "order-123",
        table_id: "table-456",
        total_amount: 100000,
      };

      const mockPaymentResult = {
        message: "Yêu cầu thanh toán tiền mặt đã được gửi",
        vat_amount: 10000,
        points_used: 0,
        final_payment_amount: 110000,
      };

      mockReq.body = {
        table_id: "table-456",
        note: "Thanh toán tại bàn",
        points_used: 0,
      };

      MockOrderService.getOrderByTable.mockResolvedValue(mockOrder as any);
      MockOrderService.requestCashPayment.mockResolvedValue(mockPaymentResult as any);
      MockOrderService.getOrderById.mockResolvedValue(mockOrder as any);

      await guestOrderController.requestCashPayment(mockReq, mockRes, mockNext);

      expect(MockOrderService.requestCashPayment).toHaveBeenCalledWith(
        "order-123",
        "Thanh toán tại bàn",
        0
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockPaymentResult,
      });
    });
  });
});

