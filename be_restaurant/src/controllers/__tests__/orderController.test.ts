// Mock models/index.ts TRƯỚC KHI import bất kỳ thứ gì
jest.mock("../../models/index", () => {
  // Return empty object to prevent associations from being set up
  return {};
});

import * as orderController from "../orderController";
import orderService from "../../services/orderService";
import { AppError } from "../../middlewares/errorHandler";
import { getPaginationParams } from "../../utils/pagination";

// Mock dependencies
jest.mock("../../services/orderService");
jest.mock("../../utils/pagination", () => ({
  getPaginationParams: jest.fn(),
  buildPaginationResult: jest.fn((data, total, page, limit) => ({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })),
}));
jest.mock("../../models/OrderItem");

const MockOrderService = orderService as jest.Mocked<typeof orderService>;
const MockGetPaginationParams = getPaginationParams as jest.MockedFunction<
  typeof getPaginationParams
>;

describe("OrderController", () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      query: {},
      params: {},
      body: {},
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

    MockGetPaginationParams.mockReturnValue({
      page: 1,
      limit: 10,
      sortBy: "created_at",
      sortOrder: "DESC",
    });
  });

  describe("getAllOrders", () => {
    it("Kiểm tra lấy tất cả đơn hàng thành công", async () => {
      const mockOrders = {
        rows: [
          {
            id: "order-1",
            user_id: "user-123",
            status: "pending",
          },
        ],
        count: 1,
      };

      (MockOrderService.getAllOrders as jest.Mock).mockResolvedValue(
        mockOrders
      );

      await orderController.getAllOrders(mockReq, mockRes, mockNext);

      expect(MockOrderService.getAllOrders).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: expect.objectContaining({
          data: mockOrders.rows,
          pagination: expect.any(Object),
        }),
      });
    });

    it("Kiểm tra xử lý lỗi khi service throw error", async () => {
      const error = new AppError("Database error", 500);
      MockOrderService.getAllOrders = jest.fn().mockRejectedValue(error);

      await orderController.getAllOrders(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getMyOrders", () => {
    it("Kiểm tra lấy đơn hàng của user thành công", async () => {
      const mockOrders = {
        rows: [
          {
            id: "order-1",
            user_id: "user-123",
            status: "pending",
          },
        ],
        count: 1,
      };

      (MockOrderService.getAllOrders as jest.Mock).mockResolvedValue(
        mockOrders
      );

      await orderController.getMyOrders(mockReq, mockRes, mockNext);

      expect(MockOrderService.getAllOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-123",
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: expect.objectContaining({
          data: mockOrders.rows,
          pagination: expect.any(Object),
        }),
      });
    });

    it("Kiểm tra trả về 401 khi không có user", async () => {
      mockReq.user = null;

      await orderController.getMyOrders(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Unauthorized",
      });
    });
  });

  describe("getOrderById", () => {
    it("Kiểm tra lấy đơn hàng theo ID thành công", async () => {
      mockReq.params.id = "order-123";

      const mockOrder = {
        id: "order-123",
        user_id: "user-123",
        status: "pending",
      };

      MockOrderService.getOrderById = jest.fn().mockResolvedValue(mockOrder);

      await orderController.getOrderById(mockReq, mockRes, mockNext);

      expect(MockOrderService.getOrderById).toHaveBeenCalledWith("order-123");
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockOrder,
      });
    });

    it("Kiểm tra trả về 404 khi không tìm thấy đơn hàng", async () => {
      mockReq.params.id = "invalid-id";
      MockOrderService.getOrderById = jest.fn().mockResolvedValue(null);

      await orderController.getOrderById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Order not found",
      });
    });

    it("Kiểm tra trả về 403 khi customer truy cập đơn hàng của user khác", async () => {
      mockReq.params.id = "order-123";
      mockReq.user.role = "customer";

      const mockOrder = {
        id: "order-123",
        user_id: "user-456", // Different user
        status: "pending",
      };

      MockOrderService.getOrderById = jest.fn().mockResolvedValue(mockOrder);

      await orderController.getOrderById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Forbidden: You can only access your own orders",
      });
    });
  });

  describe("createOrder", () => {
    it("Kiểm tra tạo đơn hàng thành công", async () => {
      mockReq.body = {
        table_id: "table-456",
      };

      const mockOrder = {
        id: "order-123",
        user_id: "user-123",
        table_id: "table-456",
        status: "pending",
      };

      MockOrderService.createOrder = jest.fn().mockResolvedValue(mockOrder);

      await orderController.createOrder(mockReq, mockRes, mockNext);

      expect(MockOrderService.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          table_id: "table-456",
          user_id: "user-123",
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockOrder,
      });
    });
  });

  describe("updateOrder", () => {
    it("Kiểm tra cập nhật đơn hàng thành công", async () => {
      mockReq.params.id = "order-123";
      mockReq.body = {
        table_id: "table-789",
      };

      const existingOrder = {
        id: "order-123",
        user_id: "user-123",
        status: "pending",
      };

      const updatedOrder = {
        ...existingOrder,
        table_id: "table-789",
      };

      MockOrderService.getOrderById = jest
        .fn()
        .mockResolvedValueOnce(existingOrder)
        .mockResolvedValueOnce(updatedOrder);
      MockOrderService.updateOrder = jest.fn().mockResolvedValue(updatedOrder);

      await orderController.updateOrder(mockReq, mockRes, mockNext);

      expect(MockOrderService.updateOrder).toHaveBeenCalledWith(
        "order-123",
        mockReq.body
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: updatedOrder,
      });
    });

    it("Kiểm tra trả về 404 khi không tìm thấy đơn hàng", async () => {
      mockReq.params.id = "invalid-id";
      MockOrderService.getOrderById = jest.fn().mockResolvedValue(null);

      await orderController.updateOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe("addItemToOrder", () => {
    it("Kiểm tra thêm món vào đơn hàng thành công", async () => {
      mockReq.params.id = "order-123";
      mockReq.body = {
        dish_id: "dish-456",
        quantity: 2,
      };

      const existingOrder = {
        id: "order-123",
        user_id: "user-123",
        status: "pending",
      };

      const updatedOrder = {
        ...existingOrder,
        items: [{ dish_id: "dish-456", quantity: 2 }],
      };

      MockOrderService.getOrderById = jest
        .fn()
        .mockResolvedValueOnce(existingOrder)
        .mockResolvedValueOnce(updatedOrder);
      MockOrderService.addItemToOrder = jest
        .fn()
        .mockResolvedValue(updatedOrder);

      await orderController.addItemToOrder(mockReq, mockRes, mockNext);

      expect(MockOrderService.addItemToOrder).toHaveBeenCalledWith(
        "order-123",
        mockReq.body
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: updatedOrder,
      });
    });
  });

  describe("updateItemQuantity", () => {
    it("Kiểm tra cập nhật số lượng món thành công", async () => {
      mockReq.params.itemId = "item-123";
      mockReq.body = {
        quantity: 3,
      };

      const mockOrderItem = {
        id: "item-123",
        order_id: "order-123",
        quantity: 2,
      };

      const existingOrder = {
        id: "order-123",
        user_id: "user-123",
        status: "pending",
      };

      const updatedItem = {
        ...mockOrderItem,
        quantity: 3,
      };

      const MockOrderItem = (await import("../../models/OrderItem")).default;
      (MockOrderItem.findByPk as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockOrderItem);
      MockOrderService.getOrderById = jest
        .fn()
        .mockResolvedValueOnce(existingOrder);
      MockOrderService.updateItemQuantity = jest
        .fn()
        .mockResolvedValue(updatedItem);

      await orderController.updateItemQuantity(mockReq, mockRes, mockNext);

      expect(MockOrderService.updateItemQuantity).toHaveBeenCalledWith(
        "item-123",
        3
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: updatedItem,
      });
    });

    it("Kiểm tra trả về 404 khi không tìm thấy order item", async () => {
      mockReq.params.itemId = "invalid-item";
      const MockOrderItem = (await import("../../models/OrderItem")).default;
      (MockOrderItem.findByPk as jest.Mock) = jest.fn().mockResolvedValue(null);

      await orderController.updateItemQuantity(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe("requestPayment", () => {
    it("Kiểm tra yêu cầu thanh toán thành công", async () => {
      mockReq.params.id = "order-123";
      mockReq.body = {
        bankCode: "VNPAY",
      };
      mockReq.headers = {};
      mockReq.ip = "127.0.0.1";
      mockReq.socket = { remoteAddress: "127.0.0.1" };

      const existingOrder = {
        id: "order-123",
        user_id: "user-123",
        status: "pending",
      };

      const paymentResult = {
        order_id: "order-123",
        payment_url: "https://vnpay.vn/payment",
      };

      MockOrderService.getOrderById = jest
        .fn()
        .mockResolvedValueOnce(existingOrder);
      MockOrderService.requestPayment = jest
        .fn()
        .mockResolvedValue(paymentResult);

      await orderController.requestPayment(mockReq, mockRes, mockNext);

      expect(MockOrderService.requestPayment).toHaveBeenCalledWith(
        "order-123",
        expect.objectContaining({
          bankCode: "VNPAY",
          client: "user",
          pointsUsed: 0,
          clientIp: expect.any(String),
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: paymentResult,
      });
    });

    it("Kiểm tra xác định client type từ role", async () => {
      mockReq.params.id = "order-123";
      mockReq.user.role = "admin";
      mockReq.headers = {};
      mockReq.ip = "127.0.0.1";
      mockReq.socket = { remoteAddress: "127.0.0.1" };

      const existingOrder = {
        id: "order-123",
        user_id: "user-123",
        status: "pending",
      };

      MockOrderService.getOrderById = jest
        .fn()
        .mockResolvedValueOnce(existingOrder);
      MockOrderService.requestPayment = jest.fn().mockResolvedValue({});

      await orderController.requestPayment(mockReq, mockRes, mockNext);

      expect(MockOrderService.requestPayment).toHaveBeenCalledWith(
        "order-123",
        expect.objectContaining({
          client: "admin",
          pointsUsed: 0,
          clientIp: expect.any(String),
        })
      );
    });
  });

  describe("createOrderFromTable", () => {
    it("Kiểm tra tạo đơn hàng mới từ bàn thành công", async () => {
      const tableId = "table-456";
      const mockOrder = {
        id: "order-123",
        table_id: tableId,
        status: "dining",
        items: [],
      };

      mockReq.params.tableId = tableId;
      mockReq.body.items = [
        { dish_id: "dish-1", quantity: 2 },
        { dish_id: "dish-2", quantity: 1 },
      ];
      mockReq.user = null; // Guest user

      MockOrderService.getOrderByTable.mockResolvedValue(null);
      MockOrderService.createOrder.mockResolvedValue(mockOrder as any);

      await orderController.createOrderFromTable(mockReq, mockRes, mockNext);

      expect(MockOrderService.getOrderByTable).toHaveBeenCalledWith(
        tableId,
        "dining"
      );
      expect(MockOrderService.createOrder).toHaveBeenCalledWith({
        table_id: tableId,
        user_id: undefined,
        items: mockReq.body.items,
        status: "dining",
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockOrder,
      });
    });

    it("Kiểm tra trả về đơn hàng đã tồn tại khi có đơn hàng đang dining", async () => {
      const tableId = "table-456";
      const existingOrder = {
        id: "order-123",
        table_id: tableId,
        status: "dining",
        items: [],
      };

      mockReq.params.tableId = tableId;
      mockReq.body.items = [];

      MockOrderService.getOrderByTable.mockResolvedValue(existingOrder as any);

      await orderController.createOrderFromTable(mockReq, mockRes, mockNext);

      expect(MockOrderService.getOrderByTable).toHaveBeenCalledWith(
        tableId,
        "dining"
      );
      expect(MockOrderService.createOrder).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: existingOrder,
        message: "Đã tìm thấy đơn hàng đang dùng cho bàn này",
      });
    });

    it("Kiểm tra thêm món vào đơn hàng đã tồn tại", async () => {
      const tableId = "table-456";
      const existingOrder = {
        id: "order-123",
        table_id: tableId,
        status: "dining",
        items: [],
      };

      const updatedOrder = {
        ...existingOrder,
        items: [
          { id: "item-1", dish_id: "dish-1", quantity: 2 },
          { id: "item-2", dish_id: "dish-2", quantity: 1 },
        ],
      };

      mockReq.params.tableId = tableId;
      mockReq.body.items = [
        { dish_id: "dish-1", quantity: 2 },
        { dish_id: "dish-2", quantity: 1 },
      ];

      MockOrderService.getOrderByTable.mockResolvedValue(existingOrder as any);
      MockOrderService.addItemToOrder.mockResolvedValue(updatedOrder as any);
      MockOrderService.getOrderById.mockResolvedValue(updatedOrder as any);

      await orderController.createOrderFromTable(mockReq, mockRes, mockNext);

      expect(MockOrderService.addItemToOrder).toHaveBeenCalledTimes(2);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: updatedOrder,
        message: "Đã thêm món vào đơn hàng đang dùng",
      });
    });
  });

  describe("addItemToOrderByTable", () => {
    it("Kiểm tra thêm món vào đơn hàng theo bàn thành công", async () => {
      const tableId = "table-456";
      const existingOrder = {
        id: "order-123",
        table_id: tableId,
        status: "dining",
        items: [],
      };

      const updatedOrder = {
        ...existingOrder,
        items: [{ id: "item-1", dish_id: "dish-789", quantity: 2 }],
      };

      mockReq.params.tableId = tableId;
      mockReq.body = {
        dish_id: "dish-789",
        quantity: 2,
      };

      MockOrderService.getOrderByTable.mockResolvedValue(existingOrder as any);
      MockOrderService.addItemToOrder.mockResolvedValue(updatedOrder as any);

      await orderController.addItemToOrderByTable(mockReq, mockRes, mockNext);

      expect(MockOrderService.getOrderByTable).toHaveBeenCalledWith(
        tableId,
        "dining"
      );
      expect(MockOrderService.addItemToOrder).toHaveBeenCalledWith(
        "order-123",
        {
          dish_id: "dish-789",
          quantity: 2,
        }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: updatedOrder,
      });
    });

    it("Kiểm tra lỗi khi không tìm thấy đơn hàng đang dining", async () => {
      const tableId = "table-456";

      mockReq.params.tableId = tableId;
      mockReq.body = {
        dish_id: "dish-789",
        quantity: 2,
      };

      MockOrderService.getOrderByTable.mockResolvedValue(null);

      await orderController.addItemToOrderByTable(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "No active order found for this table",
      });
    });
  });
});
