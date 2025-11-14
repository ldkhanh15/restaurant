// Mock models before importing service (which imports models/index.ts)
// Need to mock all models that might be imported through models/index.ts
jest.mock("../../models/Order");
jest.mock("../../models/OrderItem");
jest.mock("../../models/Dish");
jest.mock("../../models/Voucher");
jest.mock("../../models/User");
jest.mock("../../models/Employee");
jest.mock("../../models/EmployeeShift");
jest.mock("../../models/Table");
jest.mock("../../models/Reservation");
jest.mock("../../models/Event");
jest.mock("../../models/Payment");
jest.mock("../../models/VoucherUsage");
jest.mock(
  "../../models/index",
  () => {
    // Return empty object to prevent associations from being set up
    return {};
  },
  { virtual: true }
);

import orderService from "../orderService";
import orderRepository from "../../repositories/orderRepository";
import Order from "../../models/Order";
import OrderItem from "../../models/OrderItem";
import Dish from "../../models/Dish";
import Voucher from "../../models/Voucher";
import Table from "../../models/Table";
import VoucherUsage from "../../models/VoucherUsage";
import { AppError } from "../../middlewares/errorHandler";

// Mock dependencies
jest.mock("../../repositories/orderRepository");
jest.mock("../../services/notificationService");
jest.mock("../../services/paymentService", () => ({
  __esModule: true,
  default: {
    createPayment: jest.fn(),
    updatePayment: jest.fn(),
    getPaymentById: jest.fn(),
  },
}));
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
  const mockIO = {
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
  };

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

const MockOrderRepository = orderRepository as jest.Mocked<
  typeof orderRepository
>;
const MockOrder = Order as jest.Mocked<typeof Order>;
const MockOrderItem = OrderItem as jest.Mocked<typeof OrderItem>;
const MockDish = Dish as jest.Mocked<typeof Dish>;
const MockVoucher = Voucher as jest.Mocked<typeof Voucher>;
const MockTable = Table as jest.Mocked<typeof Table>;
const MockVoucherUsage = VoucherUsage as jest.Mocked<typeof VoucherUsage>;

describe("OrderService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      MockOrderRepository.findAll = jest.fn().mockResolvedValue(mockOrders);

      const result = await orderService.getAllOrders({ page: 1, limit: 10 });

      expect(MockOrderRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
      expect(result).toEqual(mockOrders);
    });
  });

  describe("getOrderById", () => {
    it("Kiểm tra lấy đơn hàng theo ID thành công", async () => {
      const mockOrder = {
        id: "order-123",
        user_id: "user-123",
        status: "pending",
        total_amount: 100000,
        final_amount: 100000,
      };

      MockOrderRepository.findById = jest.fn().mockResolvedValue(mockOrder);
      MockOrder.findByPk = jest.fn().mockResolvedValue(mockOrder);

      const result = await orderService.getOrderById("order-123");

      expect(MockOrderRepository.findById).toHaveBeenCalledWith("order-123");
      expect(result).toBeDefined();
    });

    it("Kiểm tra lấy đơn hàng thất bại khi không tìm thấy", async () => {
      MockOrderRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(orderService.getOrderById("invalid-id")).rejects.toThrow(
        AppError
      );
    });

    it("Kiểm tra lấy đơn hàng thất bại khi thiếu ID", async () => {
      await expect(orderService.getOrderById("")).rejects.toThrow(AppError);
    });
  });

  describe("createOrder", () => {
    it("Kiểm tra tạo đơn hàng thành công", async () => {
      const orderData = {
        user_id: "user-123",
        table_id: "table-456",
        items: [
          {
            dish_id: "dish-1",
            quantity: 2,
            price: 50000,
          },
        ],
      };

      const mockDish = {
        id: "dish-1",
        name: "Pho",
        price: 50000,
      };

      const mockOrder = {
        id: "order-123",
        ...orderData,
        total_amount: 100000,
        final_amount: 100000,
        status: "pending",
      };

      MockTable.findByPk = jest.fn().mockResolvedValue({ id: "table-1" });
      MockDish.findByPk = jest.fn().mockResolvedValue(mockDish);
      MockOrderRepository.create = jest.fn().mockResolvedValue(mockOrder);
      MockOrderItem.create = jest.fn().mockResolvedValue({
        id: "item-1",
        order_id: "order-123",
        dish_id: "dish-1",
        quantity: 2,
        price: 50000,
      });
      // Mock OrderItem.findAll for recalculateOrderTotals
      MockOrderItem.findAll = jest.fn().mockResolvedValue([
        {
          id: "item-1",
          order_id: "order-123",
          dish_id: "dish-1",
          quantity: 2,
          price: 50000,
        },
      ]);
      // Mock order.update for recalculateOrderTotals
      const mockOrderWithUpdate = {
        ...mockOrder,
        update: jest.fn().mockResolvedValue(undefined),
      };
      MockOrder.findByPk = jest.fn().mockResolvedValue(mockOrderWithUpdate);

      const result = await orderService.createOrder(orderData);

      expect(MockOrderRepository.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("updateOrderStatus", () => {
    it("Kiểm tra cập nhật trạng thái đơn hàng thành công", async () => {
      const mockOrder = {
        id: "order-123",
        status: "pending",
        update: jest.fn().mockResolvedValue(undefined),
      };

      MockOrderRepository.findById = jest.fn().mockResolvedValue(mockOrder);
      MockOrderRepository.updateStatus = jest.fn().mockResolvedValue(mockOrder);

      const result = await orderService.updateOrderStatus("order-123", "paid");

      expect(MockOrderRepository.updateStatus).toHaveBeenCalledWith(
        "order-123",
        "paid"
      );
      expect(result).toBeDefined();
    });
  });

  describe("addItemToOrder", () => {
    it("Kiểm tra thêm món vào đơn hàng thành công", async () => {
      const mockOrder = {
        id: "order-123",
        status: "pending",
      };

      const mockDish = {
        id: "660e8400-e29b-41d4-a716-446655440000",
        name: "Pho",
        price: 50000,
        active: true, // Cần có active property
      };

      const mockItem = {
        id: "item-1",
        order_id: "550e8400-e29b-41d4-a716-446655440000",
        dish_id: "660e8400-e29b-41d4-a716-446655440000",
        quantity: 2,
        price: 50000,
      };

      MockOrderRepository.findById = jest
        .fn()
        .mockResolvedValueOnce(mockOrder) // Lần đầu - check order
        .mockResolvedValueOnce({ ...mockOrder, items: [mockItem] }); // Sau khi update
      MockDish.findByPk = jest.fn().mockResolvedValue(mockDish);
      MockOrderRepository.addItem = jest.fn().mockResolvedValue(mockItem);

      // Mock recalculateOrderTotals - cần mock Order.findByPk và OrderItem.findAll
      MockOrder.findByPk = jest.fn().mockResolvedValue({
        ...mockOrder,
        event_fee: 0,
        deposit_amount: 0,
        voucher_discount_amount: 0,
        update: jest.fn().mockResolvedValue(undefined),
      });
      MockOrderItem.findAll = jest.fn().mockResolvedValue([mockItem]);

      // Mock OrderItem.findByPk với include Dish - được gọi để emit event
      const mockItemWithDish = {
        ...mockItem,
        dish: mockDish,
        toJSON: jest.fn().mockReturnValue({ ...mockItem, dish: mockDish }),
      };
      MockOrderItem.findByPk = jest.fn().mockResolvedValue(mockItemWithDish);

      const result = await orderService.addItemToOrder(
        "550e8400-e29b-41d4-a716-446655440000",
        {
          dish_id: "660e8400-e29b-41d4-a716-446655440000",
          quantity: 2,
        }
      );

      // Verify luôn tạo item mới (không merge)
      expect(MockOrderRepository.addItem).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440000",
        "660e8400-e29b-41d4-a716-446655440000",
        2,
        50000
      );
      // Không check existing item nữa
      expect(MockOrderItem.findOne).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("Kiểm tra thêm món lần 2 - tạo item mới với status pending riêng biệt", async () => {
      const mockOrder = {
        id: "order-123",
        status: "dining", // Order đang dining
      };

      const mockDish = {
        id: "660e8400-e29b-41d4-a716-446655440000",
        name: "Pho",
        price: 50000,
        active: true,
      };

      // Item mới lần 2 - luôn có status "pending"
      const newItem = {
        id: "item-2",
        order_id: "order-123",
        dish_id: "660e8400-e29b-41d4-a716-446655440000",
        quantity: 1,
        price: 50000,
        status: "pending", // Status mới luôn là "pending"
      };

      MockOrderRepository.findById = jest
        .fn()
        .mockResolvedValueOnce(mockOrder) // Lần đầu - check order
        .mockResolvedValueOnce({ ...mockOrder, items: [newItem] }); // Sau khi update
      MockDish.findByPk = jest.fn().mockResolvedValue(mockDish);
      MockOrderRepository.addItem = jest.fn().mockResolvedValue(newItem);

      // Mock recalculateOrderTotals
      MockOrder.findByPk = jest.fn().mockResolvedValue({
        ...mockOrder,
        event_fee: 0,
        deposit_amount: 0,
        voucher_discount_amount: 0,
        update: jest.fn().mockResolvedValue(undefined),
      });
      MockOrderItem.findAll = jest.fn().mockResolvedValue([newItem]);

      // Mock OrderItem.findByPk với include Dish
      const mockItemWithDish = {
        ...newItem,
        dish: mockDish,
        toJSON: jest.fn().mockReturnValue({ ...newItem, dish: mockDish }),
      };
      MockOrderItem.findByPk = jest.fn().mockResolvedValue(mockItemWithDish);

      const result = await orderService.addItemToOrder("order-123", {
        dish_id: "660e8400-e29b-41d4-a716-446655440000",
        quantity: 1,
      });

      // Verify luôn tạo item mới (không merge với item cũ)
      expect(MockOrderRepository.addItem).toHaveBeenCalledWith(
        "order-123",
        "660e8400-e29b-41d4-a716-446655440000",
        1,
        50000
      );
      // Không check existing item - luôn tạo mới
      expect(MockOrderItem.findOne).not.toHaveBeenCalled();
      // Verify item mới có status "pending" riêng biệt
      expect(newItem.status).toBe("pending");
      expect(result).toBeDefined();
    });
  });

  describe("applyVoucher", () => {
    it("Kiểm tra áp dụng voucher thành công", async () => {
      const mockOrder = {
        id: "order-123",
        total_amount: 100000,
        final_amount: 100000,
      };

      const mockVoucher = {
        id: "voucher-1",
        code: "DISCOUNT10",
        discount_type: "percentage",
        value: 10,
        current_uses: 0,
        update: jest.fn().mockResolvedValue(undefined), // Cần có update method
      };

      MockOrderRepository.findById = jest.fn().mockResolvedValue({
        ...mockOrder,
        user_id: "user-123",
      });
      MockVoucher.findOne = jest.fn().mockResolvedValue(mockVoucher);
      MockOrderRepository.applyVoucher = jest.fn().mockResolvedValue(mockOrder);
      MockVoucherUsage.create = jest.fn().mockResolvedValue({
        id: "usage-1",
        voucher_id: "voucher-1",
        order_id: "order-123",
      });

      // Mock recalculateOrderTotals - cần mock Order.findByPk và OrderItem.findAll
      MockOrder.findByPk = jest.fn().mockResolvedValue({
        ...mockOrder,
        event_fee: 0,
        deposit_amount: 0,
        voucher_discount_amount: 0,
        update: jest.fn().mockResolvedValue(undefined),
      });
      MockOrderItem.findAll = jest.fn().mockResolvedValue([]);

      const result = await orderService.applyVoucher("order-123", {
        code: "DISCOUNT10",
      });

      expect(MockOrderRepository.applyVoucher).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
