import * as reservationController from "../reservationController";
import reservationService from "../../services/reservationService";
import { AppError } from "../../middlewares/errorHandler";
import {
  getPaginationParams,
  buildPaginationResult,
} from "../../utils/pagination";

// Mock dependencies
jest.mock("../../services/reservationService");
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

const MockReservationService = reservationService as jest.Mocked<
  typeof reservationService
>;
const MockGetPaginationParams = getPaginationParams as jest.MockedFunction<
  typeof getPaginationParams
>;

describe("ReservationController", () => {
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

  describe("getAllReservations", () => {
    it("Kiểm tra lấy tất cả đặt bàn thành công", async () => {
      const mockReservations = {
        rows: [
          {
            id: "reservation-1",
            user_id: "user-123",
            status: "confirmed",
          },
        ],
        count: 1,
      };

      (
        MockReservationService.getAllReservations as jest.Mock
      ).mockResolvedValue(mockReservations);

      await reservationController.getAllReservations(
        mockReq,
        mockRes,
        mockNext
      );

      expect(MockReservationService.getAllReservations).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: expect.objectContaining({
          data: mockReservations.rows,
          pagination: expect.any(Object),
        }),
      });
    });
  });

  describe("getMyReservations", () => {
    it("Kiểm tra lấy đặt bàn của user thành công", async () => {
      const mockReservations = {
        rows: [
          {
            id: "reservation-1",
            user_id: "user-123",
            status: "confirmed",
          },
        ],
        count: 1,
      };

      (
        MockReservationService.getAllReservations as jest.Mock
      ).mockResolvedValue(mockReservations);

      await reservationController.getMyReservations(mockReq, mockRes, mockNext);

      expect(MockReservationService.getAllReservations).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-123",
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: expect.objectContaining({
          data: mockReservations.rows,
          pagination: expect.any(Object),
        }),
      });
    });

    it("Kiểm tra trả về 401 khi không có user", async () => {
      mockReq.user = null;

      await reservationController.getMyReservations(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Unauthorized",
      });
    });
  });

  describe("getReservationById", () => {
    it("Kiểm tra lấy đặt bàn theo ID thành công", async () => {
      mockReq.params.id = "reservation-123";

      const mockReservation = {
        id: "reservation-123",
        user_id: "user-123",
        status: "confirmed",
        reservation_time: new Date("2024-01-01T18:00:00Z"),
      };

      MockReservationService.getReservationById = jest
        .fn()
        .mockResolvedValue(mockReservation);

      await reservationController.getReservationById(
        mockReq,
        mockRes,
        mockNext
      );

      expect(MockReservationService.getReservationById).toHaveBeenCalledWith(
        "reservation-123"
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockReservation,
      });
    });
  });

  describe("createReservation", () => {
    it("Kiểm tra tạo đặt bàn thành công", async () => {
      mockReq.body = {
        table_id: "table-456",
        reservation_time: "2024-01-01T18:00:00Z",
        num_people: 4,
      };

      const mockReservation = {
        id: "reservation-123",
        user_id: "user-123",
        table_id: "table-456",
        reservation_time: new Date("2024-01-01T18:00:00Z"),
        num_people: 4,
        status: "pending",
      };

      MockReservationService.createReservation = jest
        .fn()
        .mockResolvedValue(mockReservation);

      await reservationController.createReservation(mockReq, mockRes, mockNext);

      expect(MockReservationService.createReservation).toHaveBeenCalledWith(
        expect.objectContaining({
          table_id: "table-456",
          user_id: "user-123",
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockReservation,
      });
    });
  });

  describe("updateReservation", () => {
    it("Kiểm tra cập nhật đặt bàn thành công", async () => {
      mockReq.params.id = "reservation-123";
      mockReq.body = {
        num_people: 6,
      };

      const updatedReservation = {
        id: "reservation-123",
        user_id: "user-123",
        num_people: 6,
        status: "confirmed",
      };

      MockReservationService.updateReservation = jest
        .fn()
        .mockResolvedValue(updatedReservation);

      await reservationController.updateReservation(mockReq, mockRes, mockNext);

      expect(MockReservationService.updateReservation).toHaveBeenCalledWith(
        "reservation-123",
        mockReq.body
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: updatedReservation,
      });
    });
  });

  describe("cancelReservation", () => {
    it("Kiểm tra hủy đặt bàn thành công (owner)", async () => {
      mockReq.params.id = "reservation-123";
      mockReq.body = {
        reason: "Change of plans",
      };

      const existingReservation = {
        id: "reservation-123",
        user_id: "user-123",
        status: "confirmed",
      };

      const cancelledReservation = {
        ...existingReservation,
        status: "cancelled",
      };

      MockReservationService.getReservationById = jest
        .fn()
        .mockResolvedValue(existingReservation);
      MockReservationService.cancelReservation = jest
        .fn()
        .mockResolvedValue(cancelledReservation);

      await reservationController.cancelReservation(mockReq, mockRes, mockNext);

      expect(MockReservationService.cancelReservation).toHaveBeenCalledWith(
        "reservation-123",
        "Change of plans"
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: cancelledReservation,
      });
    });

    it("Kiểm tra hủy đặt bàn thành công (admin)", async () => {
      mockReq.params.id = "reservation-123";
      mockReq.user.role = "admin";

      const existingReservation = {
        id: "reservation-123",
        user_id: "user-456",
        status: "confirmed",
      };

      MockReservationService.getReservationById = jest
        .fn()
        .mockResolvedValue(existingReservation);
      MockReservationService.cancelReservation = jest.fn().mockResolvedValue({
        ...existingReservation,
        status: "cancelled",
      });

      await reservationController.cancelReservation(mockReq, mockRes, mockNext);

      expect(MockReservationService.cancelReservation).toHaveBeenCalled();
    });

    it("Kiểm tra trả về 403 khi không phải owner và không phải admin", async () => {
      mockReq.params.id = "reservation-123";
      mockReq.user.role = "customer";

      const existingReservation = {
        id: "reservation-123",
        user_id: "user-456", // Different user
        status: "confirmed",
      };

      MockReservationService.getReservationById = jest
        .fn()
        .mockResolvedValue(existingReservation);

      await reservationController.cancelReservation(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "You can only cancel your own reservations",
      });
    });
  });

  describe("checkInReservation", () => {
    it("Kiểm tra check-in đặt bàn thành công", async () => {
      mockReq.params.id = "reservation-123";

      const checkInResult = {
        id: "reservation-123",
        status: "confirmed",
        checked_in: true,
      };

      MockReservationService.checkInReservation = jest
        .fn()
        .mockResolvedValue(checkInResult);

      await reservationController.checkInReservation(
        mockReq,
        mockRes,
        mockNext
      );

      expect(MockReservationService.checkInReservation).toHaveBeenCalledWith(
        "reservation-123"
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: checkInResult,
      });
    });
  });

  describe("addDishToReservation", () => {
    it("Kiểm tra thêm món vào đặt bàn thành công", async () => {
      mockReq.params.id = "reservation-123";
      mockReq.body = {
        dish_id: "dish-456",
        quantity: 2,
      };

      const updatedReservation = {
        id: "reservation-123",
        dishes: [{ dish_id: "dish-456", quantity: 2 }],
      };

      MockReservationService.addDishToReservation = jest
        .fn()
        .mockResolvedValue(updatedReservation);

      await reservationController.addDishToReservation(
        mockReq,
        mockRes,
        mockNext
      );

      expect(MockReservationService.addDishToReservation).toHaveBeenCalledWith(
        "reservation-123",
        "dish-456",
        2
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: updatedReservation,
      });
    });
  });

  describe("checkInReservation", () => {
    it("Kiểm tra check-in đặt bàn thành công", async () => {
      const mockReservation = {
        id: "reservation-123",
        user_id: "user-123",
        status: "confirmed",
        reservation_time: new Date(),
      };

      const mockOrder = {
        id: "order-123",
        reservation_id: "reservation-123",
        status: "dining",
      };

      const checkInResult = {
        reservation: mockReservation,
        order: mockOrder,
      };

      mockReq.params.id = "reservation-123";
      (
        MockReservationService.checkInReservation as jest.Mock
      ).mockResolvedValue(checkInResult);

      await reservationController.checkInReservation(
        mockReq,
        mockRes,
        mockNext
      );

      expect(MockReservationService.checkInReservation).toHaveBeenCalledWith(
        "reservation-123"
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: checkInResult,
      });
    });

    it("Kiểm tra lỗi khi check-in ngoài thời gian cho phép", async () => {
      mockReq.params.id = "reservation-123";

      const error = new AppError(
        "Chỉ có thể check-in trong khoảng thời gian từ 5 phút trước đến 10 phút sau giờ đặt bàn",
        400
      );

      (
        MockReservationService.checkInReservation as jest.Mock
      ).mockRejectedValue(error);

      await reservationController.checkInReservation(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
