// Mock models/index.ts TRƯỚC KHI import bất kỳ thứ gì
jest.mock("../../models/index", () => {
  // Return empty object to prevent associations from being set up
  return {};
});

// Mock authenticate middleware before importing routes
jest.mock("../../middlewares/auth", () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => {
    req.user = {
      id: "user-123",
      email: "test@example.com",
      role: "customer",
    };
    next();
  }),
  authenticateOptional: jest.fn((req: any, res: any, next: any) => {
    // Optional auth - allow without user
    next();
  }),
  authorize: jest.fn((...roles: string[]) => {
    return (req: any, res: any, next: any) => {
      next();
    };
  }),
}));

// Don't mock controllers - test real flow from route -> controller -> service -> repository

import request from "supertest";
import express, { Express } from "express";
import orderRoutes from "../../routes/orderRoutes";
import * as orderController from "../../controllers/orderController";
import orderService from "../../services/orderService";
import orderRepository from "../../repositories/orderRepository";
import Order from "../../models/Order";
import OrderItem from "../../models/OrderItem";
import Dish from "../../models/Dish";
import Table from "../../models/Table";
import { authenticate } from "../../middlewares/auth";
import { AppError } from "../../middlewares/errorHandler";

// Mock chỉ ở tầng thấp nhất (models)
jest.mock("../../models/Order");
jest.mock("../../models/OrderItem");
jest.mock("../../models/Dish");
jest.mock("../../models/User");
jest.mock("../../models/Table");
jest.mock("../../models/Voucher");
jest.mock("../../models/VoucherUsage");
jest.mock("../../services/notificationService");
jest.mock("../../utils/validation", () => ({
  validateOrderOverlap: jest.fn().mockResolvedValue(undefined),
  validateTableGroupOrderOverlap: jest.fn().mockResolvedValue(undefined),
}));
// Mock socket helpers - phải mock trước khi import orderService
jest.mock("../../sockets/index", () => ({
  forwardToAdmin: jest.fn(),
  forwardToCustomer: jest.fn(),
  broadcastToAdmin: jest.fn(),
}));

// Mock orderSocket events - để orderEvents sử dụng mocked helpers
jest.mock("../../sockets/orderSocket", () => {
  return {
    __esModule: true,
    default: jest.fn(),
    orderEvents: {
      orderCreated: jest.fn(),
      orderUpdated: jest.fn(),
      orderStatusChanged: jest.fn(),
      paymentRequested: jest.fn(),
      paymentCompleted: jest.fn(),
      paymentFailed: jest.fn(),
      supportRequested: jest.fn(),
      voucherApplied: jest.fn(),
      voucherRemoved: jest.fn(),
      orderMerged: jest.fn(),
      orderItemCreated: jest.fn(),
      orderItemQuantityChanged: jest.fn(),
      orderItemDeleted: jest.fn(),
      orderItemStatusChanged: jest.fn(),
    },
    serializeOrder: jest.fn((order: any) => order),
  };
});

// Mock tableSocket events - để tableEvents sử dụng mocked helpers
jest.mock("../../sockets/tableSocket", () => {
  return {
    __esModule: true,
    default: jest.fn(),
    tableEvents: {
      tableStatusChanged: jest.fn(),
      tableOrderCreated: jest.fn(),
      tableOrderUpdated: jest.fn(),
    },
  };
});

// Mock socket IO
jest.mock("../../sockets", () => ({
  getIO: jest.fn(() => ({
    emit: jest.fn(),
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
    of: jest.fn(() => ({
      emit: jest.fn(),
      to: jest.fn(() => ({
        emit: jest.fn(),
      })),
    })),
  })),
}));

// Không mock repository, service, controller - test flow thật
const MockOrder = Order as jest.Mocked<typeof Order>;
const MockOrderItem = OrderItem as jest.Mocked<typeof OrderItem>;
const MockDish = Dish as jest.Mocked<typeof Dish>;
const MockTable = Table as jest.Mocked<typeof Table>;

describe("Order Flow Integration Test", () => {
  let app: Express;
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    role: "customer" as const,
  };

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // authenticate middleware đã được mock ở trên, không cần mock lại

    app.use("/api/orders", orderRoutes);
    app.use((err: any, req: any, res: any, next: any) => {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          status: "error",
          message: err.message,
        });
      }
      return res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("Flow: POST /api/orders/ -> createOrder -> orderService.createOrder -> orderRepository.create", () => {
    it("Kiểm tra flow tạo đơn hàng đầy đủ từ route đến repository", async () => {
      const tableId = "770e8400-e29b-41d4-a716-446655440000";
      const dishId = "660e8400-e29b-41d4-a716-446655440000";
      const dishPrice = 50000;

      // Mock Dish model
      const mockDish = {
        id: dishId,
        name: "Pho",
        price: dishPrice,
        status: "available",
      };

      MockDish.findByPk = jest.fn().mockResolvedValue(mockDish);

      // Mock Table model - cần cho orderService.createOrder
      MockTable.findByPk = jest.fn().mockResolvedValue({
        id: tableId,
        table_number: "T1",
        capacity: 6,
        status: "available",
      });

      // Mock Order model
      const orderId = "550e8400-e29b-41d4-a716-446655440000";
      const mockOrder = {
        id: orderId,
        user_id: mockUser.id,
        table_id: tableId,
        status: "pending",
        total_amount: dishPrice * 2,
        final_amount: dishPrice * 2,
        event_fee: 0,
        deposit_amount: 0,
        voucher_discount_amount: 0,
        save: jest.fn().mockResolvedValue(undefined),
        reload: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
        get: jest.fn((key: string) => {
          const data: any = {
            id: orderId,
            user_id: mockUser.id,
            table_id: tableId,
            status: "pending",
            total_amount: dishPrice * 2,
            final_amount: dishPrice * 2,
            event_fee: 0,
            deposit_amount: 0,
            voucher_discount_amount: 0,
          };
          return data[key];
        }),
      };

      MockOrder.create = jest.fn().mockResolvedValue(mockOrder);

      // Mock OrderItem model
      const itemId = "880e8400-e29b-41d4-a716-446655440000";
      const mockOrderItem = {
        id: itemId,
        order_id: orderId,
        dish_id: dishId,
        quantity: 2,
        price: dishPrice,
        status: "pending",
      };

      MockOrderItem.create = jest.fn().mockResolvedValue(mockOrderItem);
      MockOrderItem.findAll = jest.fn().mockResolvedValue([mockOrderItem]);

      // Mock Order.findByPk for orderRepository.findById (called after order creation)
      // Also used by recalculateOrderTotals
      const mockOrderWithItems = {
        ...mockOrder,
        items: [mockOrderItem],
        update: jest.fn().mockResolvedValue(undefined), // For recalculateOrderTotals
      };
      MockOrder.findByPk = jest.fn().mockResolvedValue(mockOrderWithItems);

      // Mock Table.update for updating table status
      MockTable.update = jest.fn().mockResolvedValue([1]); // Returns [affectedCount]

      const response = await request(app)
        .post("/api/orders/")
        .send({ table_id: tableId })
        .set("Authorization", "Bearer valid-token");

      // Verify response
      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toBeDefined();

      // Verify flow: Route -> Controller -> Service -> Repository
      // 1. Route đã nhận request
      // 2. Controller đã gọi service
      // 3. Service đã gọi repository
      // 4. Repository đã tạo order trong database (mocked)
      expect(MockOrder.create).toHaveBeenCalled();
    });
  });

  describe("Flow: GET /api/orders/:id -> getOrderById -> orderService.getOrderById -> orderRepository.findById", () => {
    it("Kiểm tra flow lấy đơn hàng đầy đủ từ route đến repository", async () => {
      const orderId = "550e8400-e29b-41d4-a716-446655440000";

      const mockOrder = {
        id: orderId,
        user_id: mockUser.id,
        table_id: "table-456",
        status: "pending",
        total_amount: 100000,
        final_amount: 100000,
        items: [],
        get: jest.fn((key: string) => {
          const data: any = {
            id: orderId,
            user_id: mockUser.id,
            table_id: "table-456",
            status: "pending",
            total_amount: 100000,
            final_amount: 100000,
          };
          return data[key];
        }),
      };

      // Mock repository findById
      MockOrder.findByPk = jest.fn().mockResolvedValue(mockOrder);

      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set("Authorization", "Bearer valid-token");

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toBeDefined();

      // Verify flow
      expect(MockOrder.findByPk).toHaveBeenCalledWith(
        orderId,
        expect.objectContaining({
          include: expect.any(Array),
        })
      );
    });
  });

  describe("Flow: POST /api/orders/:id/items -> addItemToOrder -> orderService.addItemToOrder -> orderRepository.addItem", () => {
    it("Kiểm tra flow thêm món vào đơn hàng đầy đủ", async () => {
      const orderId = "550e8400-e29b-41d4-a716-446655440000";
      const dishId = "660e8400-e29b-41d4-a716-446655440000";
      const quantity = 2;
      const dishPrice = 50000;

      // Mock existing order - cần có status hợp lệ ("pending", "preparing", hoặc "dining")
      const mockOrder = {
        id: orderId,
        user_id: mockUser.id,
        status: "pending", // Status hợp lệ để có thể thêm item
        get: jest.fn((key: string) => {
          const data: any = {
            id: orderId,
            user_id: mockUser.id,
            status: "pending",
          };
          return data[key];
        }),
      };

      // Mock Order.findByPk được gọi bởi orderRepository.addItem
      MockOrder.findByPk = jest.fn().mockResolvedValue(mockOrder);

      const mockDish = {
        id: dishId,
        name: "Pho",
        price: dishPrice,
        active: true, // Cần có active property
      };

      const mockOrderItem = {
        id: "880e8400-e29b-41d4-a716-446655440000",
        order_id: orderId,
        dish_id: dishId,
        quantity: quantity,
        price: dishPrice,
      };

      // Mock flow - orderService.addItemToOrder gọi nhiều bước
      // 1. orderRepository.findById (được gọi 2 lần: đầu và sau khi update)
      // 2. Dish.findByPk
      // 3. orderRepository.addItem (gọi Order.findByPk và OrderItem.create - luôn tạo mới)
      // 4. recalculateOrderTotals (gọi OrderItem.findAll và Order.update)
      // 5. OrderItem.findByPk với include Dish (để emit event)

      // Mock Order.findByPk - được gọi bởi orderRepository.addItem, orderRepository.findById, và recalculateOrderTotals
      // Cần mock để trả về order với update method khi được gọi bởi recalculateOrderTotals
      const mockOrderWithUpdate = {
        ...mockOrder,
        event_fee: 0,
        deposit_amount: 0,
        voucher_discount_amount: 0,
        update: jest.fn().mockResolvedValue(undefined),
      };

      (MockOrder.findByPk as jest.Mock) = jest.fn(
        (id: string, options?: any) => {
          if (options && options.include) {
            // Khi có include (orderRepository.findById), trả về order với items
            return Promise.resolve({
              ...mockOrderWithUpdate,
              items: [mockOrderItem],
            } as any);
          }
          // Khi không có include (recalculateOrderTotals, orderRepository.addItem), trả về order với update
          return Promise.resolve(mockOrderWithUpdate as any);
        }
      );

      // Mock Dish.findByPk
      MockDish.findByPk = jest.fn().mockResolvedValue(mockDish);

      // Không cần mock OrderItem.findOne nữa vì luôn tạo item mới

      // Mock OrderItem.create - được gọi bởi orderRepository.addItem
      MockOrderItem.create = jest.fn().mockResolvedValue(mockOrderItem);

      // Mock OrderItem.findAll - được gọi bởi recalculateOrderTotals
      MockOrderItem.findAll = jest.fn().mockResolvedValue([mockOrderItem]);

      // Mock Order.update - được gọi bởi recalculateOrderTotals
      MockOrder.update = jest.fn().mockResolvedValue([1]);

      // Mock OrderItem.findByPk với include - được gọi sau khi add item
      const mockOrderItemWithDish = {
        ...mockOrderItem,
        toJSON: jest.fn().mockReturnValue(mockOrderItem),
        dish: mockDish,
      };
      MockOrderItem.findByPk = jest
        .fn()
        .mockResolvedValue(mockOrderItemWithDish);

      const response = await request(app)
        .post(`/api/orders/${orderId}/items`)
        .send({ dish_id: dishId, quantity: quantity })
        .set("Authorization", "Bearer valid-token");

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");

      // Verify flow
      expect(MockOrder.findByPk).toHaveBeenCalled();
      expect(MockDish.findByPk).toHaveBeenCalledWith(dishId);
      // Verify luôn tạo item mới (không merge với item cũ)
      expect(MockOrderItem.create).toHaveBeenCalledWith({
        order_id: orderId,
        dish_id: dishId,
        quantity: quantity,
        price: dishPrice,
        status: "pending",
      });
      // Không check existing item nữa
      expect(MockOrderItem.findOne).not.toHaveBeenCalled();
    });
  });

  describe("Flow: PATCH /api/orders/:id/status -> updateOrderStatus -> orderService.updateOrderStatus -> orderRepository.updateStatus", () => {
    it("Kiểm tra flow cập nhật trạng thái đơn hàng đầy đủ (admin)", async () => {
      const orderId = "550e8400-e29b-41d4-a716-446655440000";

      // Mock admin user
      jest
        .spyOn(require("../../middlewares/auth"), "authenticate")
        .mockImplementation((req: any, res: any, next: any) => {
          req.user = { id: "admin-123", role: "admin" };
          next();
        });

      jest
        .spyOn(require("../../middlewares/auth"), "authorize")
        .mockImplementation(() => {
          return (req: any, res: any, next: any) => next();
        });

      const mockOrder = {
        id: orderId,
        status: "pending",
        update: jest.fn().mockResolvedValue(undefined),
        get: jest.fn((key: string) => {
          const data: any = {
            id: orderId,
            status: "pending",
          };
          return data[key];
        }),
      };

      MockOrder.findByPk = jest.fn().mockResolvedValue(mockOrder);

      const response = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .send({ status: "paid" })
        .set("Authorization", "Bearer admin-token");

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");

      // Verify flow
      expect(MockOrder.findByPk).toHaveBeenCalled();
    });
  });
});
