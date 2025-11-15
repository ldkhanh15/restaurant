import orderRepository from "../orderRepository";
import Order from "../../models/Order";
import OrderItem from "../../models/OrderItem";
import User from "../../models/User";
import Table from "../../models/Table";
import Voucher from "../../models/Voucher";
import Reservation from "../../models/Reservation";
import Dish from "../../models/Dish";
import { AppError } from "../../middlewares/errorHandler";

// Mock models
jest.mock("../../models/Order");
jest.mock("../../models/OrderItem");
jest.mock("../../models/User");
jest.mock("../../models/Table");
jest.mock("../../models/Voucher");
jest.mock("../../models/Reservation");
jest.mock("../../models/Dish");

const MockOrder = Order as jest.Mocked<typeof Order>;
const MockOrderItem = OrderItem as jest.Mocked<typeof OrderItem>;

describe("OrderRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("Kiểm tra lấy tất cả đơn hàng thành công", async () => {
      const mockOrders = [
        {
          id: "order-1",
          user_id: "user-123",
          status: "pending",
          total_amount: 100000,
          final_amount: 100000,
        },
        {
          id: "order-2",
          user_id: "user-456",
          status: "paid",
          total_amount: 200000,
          final_amount: 200000,
        },
      ];

      MockOrder.findAndCountAll = jest.fn().mockResolvedValue({
        rows: mockOrders,
        count: 2,
      });

      const result = await orderRepository.findAll({ page: 1, limit: 10 });

      expect(MockOrder.findAndCountAll).toHaveBeenCalled();
      expect(result.rows).toEqual(mockOrders);
      expect(result.count).toBe(2);
    });

    it("Kiểm tra lấy đơn hàng với filter status", async () => {
      const mockOrders = [
        {
          id: "order-1",
          status: "paid",
          total_amount: 100000,
          final_amount: 100000,
        },
      ];

      MockOrder.findAndCountAll = jest.fn().mockResolvedValue({
        rows: mockOrders,
        count: 1,
      });

      const result = await orderRepository.findAll({
        status: "paid",
        page: 1,
        limit: 10,
      });

      expect(MockOrder.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "paid" }),
        })
      );
      expect(result.rows).toEqual(mockOrders);
    });

    it("Kiểm tra lấy đơn hàng với filter date", async () => {
      const mockOrders: any[] = [];
      MockOrder.findAndCountAll = jest.fn().mockResolvedValue({
        rows: mockOrders,
        count: 0,
      });

      await orderRepository.findAll({
        date: "2024-01-01",
        page: 1,
        limit: 10,
      });

      expect(MockOrder.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            created_at: expect.any(Object),
          }),
        })
      );
    });

    it("Kiểm tra lấy đơn hàng với filter user_id", async () => {
      const mockOrders: any[] = [];
      MockOrder.findAndCountAll = jest.fn().mockResolvedValue({
        rows: mockOrders,
        count: 0,
      });

      await orderRepository.findAll({
        user_id: "user-123",
        page: 1,
        limit: 10,
      });

      expect(MockOrder.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ user_id: "user-123" }),
        })
      );
    });
  });

  describe("findById", () => {
    it("Kiểm tra lấy đơn hàng theo ID thành công", async () => {
      const mockOrder = {
        id: "order-123",
        user_id: "user-123",
        status: "pending",
        total_amount: 100000,
        final_amount: 100000,
        items: [],
      };

      MockOrder.findByPk = jest.fn().mockResolvedValue(mockOrder);

      const result = await orderRepository.findById("order-123");

      expect(MockOrder.findByPk).toHaveBeenCalledWith("order-123", {
        include: expect.any(Array),
      });
      expect(result).toEqual(mockOrder);
    });

    it("Kiểm tra lấy đơn hàng thất bại khi không tìm thấy", async () => {
      MockOrder.findByPk = jest.fn().mockResolvedValue(null);

      const result = await orderRepository.findById("invalid-id");

      expect(result).toBeNull();
    });
  });

  describe("findByTableId", () => {
    it("Kiểm tra lấy đơn hàng theo table_id thành công", async () => {
      const mockOrder = {
        id: "order-123",
        table_id: "table-456",
        status: "pending",
      };

      MockOrder.findOne = jest.fn().mockResolvedValue(mockOrder);

      const result = await orderRepository.findByTableId("table-456");

      expect(MockOrder.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            table_id: "table-456",
          }),
        })
      );
      expect(result).toEqual(mockOrder);
    });

    it("Kiểm tra lấy đơn hàng theo table_id với status filter", async () => {
      const mockOrder = {
        id: "order-123",
        table_id: "table-456",
        status: "paid",
      };

      MockOrder.findOne = jest.fn().mockResolvedValue(mockOrder);

      const result = await orderRepository.findByTableId("table-456", "paid");

      expect(MockOrder.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { table_id: "table-456", status: "paid" },
        })
      );
      expect(result).toEqual(mockOrder);
    });
  });

  describe("create", () => {
    it("Kiểm tra tạo đơn hàng thành công", async () => {
      const orderData = {
        user_id: "user-123",
        table_id: "table-456",
        status: "pending",
        total_amount: 100000,
        final_amount: 100000,
      };

      const mockOrder = { id: "order-123", ...orderData };
      MockOrder.create = jest.fn().mockResolvedValue(mockOrder);

      const result = await orderRepository.create(orderData);

      expect(MockOrder.create).toHaveBeenCalledWith(orderData);
      expect(result).toEqual(mockOrder);
    });
  });

  describe("update", () => {
    it("Kiểm tra cập nhật đơn hàng thành công", async () => {
      const mockOrder = {
        id: "order-123",
        status: "pending",
        update: jest.fn().mockResolvedValue(undefined),
      };

      MockOrder.findByPk = jest.fn().mockResolvedValue(mockOrder);

      const updateData = { status: "paid" };
      const result = await orderRepository.update("order-123", updateData);

      expect(MockOrder.findByPk).toHaveBeenCalledWith("order-123");
      expect(mockOrder.update).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(mockOrder);
    });

    it("Kiểm tra cập nhật đơn hàng thất bại khi không tìm thấy", async () => {
      MockOrder.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        orderRepository.update("invalid-id", { status: "paid" })
      ).rejects.toThrow(AppError);
    });
  });

  describe("delete", () => {
    it("Kiểm tra xóa đơn hàng thành công", async () => {
      const mockOrder = {
        id: "order-123",
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      MockOrder.findByPk = jest.fn().mockResolvedValue(mockOrder);

      await orderRepository.delete("order-123");

      expect(MockOrder.findByPk).toHaveBeenCalledWith("order-123");
      expect(mockOrder.destroy).toHaveBeenCalled();
    });

    it("Kiểm tra xóa đơn hàng thất bại khi không tìm thấy", async () => {
      MockOrder.findByPk = jest.fn().mockResolvedValue(null);

      await expect(orderRepository.delete("invalid-id")).rejects.toThrow(
        AppError
      );
    });
  });

  describe("updateStatus", () => {
    it("Kiểm tra cập nhật trạng thái đơn hàng thành công", async () => {
      const mockOrder = {
        id: "order-123",
        status: "pending",
        update: jest.fn().mockResolvedValue(undefined),
      };

      MockOrder.findByPk = jest.fn().mockResolvedValue(mockOrder);

      const result = await orderRepository.updateStatus("order-123", "paid");

      expect(mockOrder.update).toHaveBeenCalledWith({ status: "paid" });
      expect(result).toEqual(mockOrder);
    });
  });

  describe("addItem", () => {
    it("Kiểm tra thêm món vào đơn hàng thành công - luôn tạo item mới", async () => {
      const mockOrder = {
        id: "order-123",
      };

      const mockItem = {
        id: "item-123",
        order_id: "order-123",
        dish_id: "dish-456",
        quantity: 2,
        price: 50000,
        status: "pending",
      };

      MockOrder.findByPk = jest.fn().mockResolvedValue(mockOrder);
      MockOrderItem.create = jest.fn().mockResolvedValue(mockItem);

      const result = await orderRepository.addItem(
        "order-123",
        "dish-456",
        2,
        50000
      );

      expect(MockOrder.findByPk).toHaveBeenCalledWith("order-123");
      // Không check existing item nữa - luôn tạo mới
      expect(MockOrderItem.findOne).not.toHaveBeenCalled();
      expect(MockOrderItem.create).toHaveBeenCalledWith({
        order_id: "order-123",
        dish_id: "dish-456",
        quantity: 2,
        price: 50000,
        status: "pending",
      });
      expect(result).toEqual(mockItem);
    });

    it("Kiểm tra thêm món vào đơn hàng lần 2 - tạo item mới riêng biệt với status pending", async () => {
      const mockOrder = {
        id: "order-123",
      };

      // Item mới lần 2 - luôn có status "pending" dù món đã có trong order
      const newItem = {
        id: "item-456",
        order_id: "order-123",
        dish_id: "dish-456",
        quantity: 1,
        price: 50000,
        status: "pending",
      };

      MockOrder.findByPk = jest.fn().mockResolvedValue(mockOrder);
      MockOrderItem.create = jest.fn().mockResolvedValue(newItem);

      const result = await orderRepository.addItem(
        "order-123",
        "dish-456",
        1,
        50000
      );

      expect(MockOrder.findByPk).toHaveBeenCalledWith("order-123");
      // Không check existing item - luôn tạo mới
      expect(MockOrderItem.findOne).not.toHaveBeenCalled();
      expect(MockOrderItem.create).toHaveBeenCalledWith({
        order_id: "order-123",
        dish_id: "dish-456",
        quantity: 1,
        price: 50000,
        status: "pending", // Status mới luôn là "pending"
      });
      expect(result).toEqual(newItem);
      // Đảm bảo item mới có status "pending" riêng biệt
      expect(result.status).toBe("pending");
    });
  });

  describe("updateItemQuantity", () => {
    it("Kiểm tra cập nhật số lượng món thành công", async () => {
      const mockItem = {
        id: "item-123",
        quantity: 2,
        update: jest.fn().mockResolvedValue(undefined),
      };

      MockOrderItem.findByPk = jest.fn().mockResolvedValue(mockItem);

      const result = await orderRepository.updateItemQuantity("item-123", 3);

      expect(mockItem.update).toHaveBeenCalledWith({ quantity: 3 });
      expect(result).toEqual(mockItem);
    });

    it("Kiểm tra xóa món khi quantity = 0", async () => {
      const mockItem = {
        id: "item-123",
        quantity: 2,
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      MockOrderItem.findByPk = jest.fn().mockResolvedValue(mockItem);

      const result = await orderRepository.updateItemQuantity("item-123", 0);

      expect(mockItem.destroy).toHaveBeenCalled();
      expect(result).toEqual(mockItem);
    });
  });

  describe("deleteItem", () => {
    it("Kiểm tra xóa món khỏi đơn hàng thành công", async () => {
      const mockItem = {
        id: "item-123",
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      MockOrderItem.findByPk = jest.fn().mockResolvedValue(mockItem);

      await orderRepository.deleteItem("item-123");

      expect(mockItem.destroy).toHaveBeenCalled();
    });
  });

  describe("applyVoucher", () => {
    it("Kiểm tra áp dụng voucher thành công", async () => {
      const mockOrder = {
        id: "order-123",
        total_amount: 100000,
        final_amount: 100000,
        update: jest.fn().mockResolvedValue(undefined),
      };

      MockOrder.findByPk = jest.fn().mockResolvedValue(mockOrder);

      const result = await orderRepository.applyVoucher(
        "order-123",
        "voucher-456",
        10000
      );

      expect(mockOrder.update).toHaveBeenCalledWith({
        voucher_id: "voucher-456",
        voucher_discount_amount: 10000,
        final_amount: 90000,
      });
      expect(result).toEqual(mockOrder);
    });
  });

  describe("removeVoucher", () => {
    it("Kiểm tra xóa voucher khỏi đơn hàng thành công", async () => {
      const mockOrder = {
        id: "order-123",
        total_amount: 100000,
        final_amount: 90000,
        voucher_discount_amount: 10000,
        update: jest.fn().mockResolvedValue(undefined),
      };

      MockOrder.findByPk = jest.fn().mockResolvedValue(mockOrder);

      const result = await orderRepository.removeVoucher("order-123");

      expect(mockOrder.update).toHaveBeenCalledWith({
        voucher_id: null,
        voucher_discount_amount: 0,
        final_amount: 100000,
      });
      expect(result).toEqual(mockOrder);
    });
  });

  describe("mergeOrders", () => {
    it("Kiểm tra gộp đơn hàng thành công", async () => {
      const sourceOrder = {
        id: "order-1",
        total_amount: 50000,
        update: jest.fn().mockResolvedValue(undefined),
      };

      const targetOrder = {
        id: "order-2",
        total_amount: 100000,
        voucher_discount_amount: 0,
        update: jest.fn().mockResolvedValue(undefined),
      };

      const sourceItems = [
        {
          id: "item-1",
          dish_id: "dish-1",
          quantity: 1,
          price: 50000,
          update: jest.fn().mockResolvedValue(undefined),
        },
      ];

      MockOrder.findByPk = jest
        .fn()
        .mockResolvedValueOnce(sourceOrder)
        .mockResolvedValueOnce(targetOrder);

      MockOrderItem.findAll = jest
        .fn()
        .mockResolvedValueOnce(sourceItems)
        .mockResolvedValueOnce([
          {
            id: "item-2",
            dish_id: "dish-2",
            quantity: 2,
            price: 50000,
          },
        ]);

      MockOrderItem.findOne = jest.fn().mockResolvedValue(null);
      (sourceItems[0] as any).destroy = jest.fn().mockResolvedValue(undefined);

      const result = await orderRepository.mergeOrders("order-1", "order-2");

      expect(sourceOrder.update).toHaveBeenCalledWith({ status: "cancelled" });
      expect(result).toEqual(targetOrder);
    });
  });

  describe("getRevenueStats", () => {
    it("Kiểm tra lấy thống kê doanh thu thành công", async () => {
      MockOrder.count = jest.fn().mockResolvedValue(100);
      MockOrder.findAll = jest.fn().mockResolvedValue([
        { status: "pending", count: 30 },
        { status: "paid", count: 70 },
      ]);
      MockOrder.findOne = jest.fn().mockResolvedValue({
        total_revenue: 10000000,
      });

      const result = await orderRepository.getRevenueStats();

      expect(result).toHaveProperty("total_orders");
      expect(result).toHaveProperty("total_revenue");
    });
  });
});
