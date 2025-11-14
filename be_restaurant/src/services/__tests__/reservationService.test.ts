// Mock models/index.ts TRƯỚC KHI import bất kỳ thứ gì
jest.mock("../../models/index", () => {
  // Return empty object to prevent associations from being set up
  return {};
});

import reservationService from "../reservationService";
import reservationRepository from "../../repositories/reservationRepository";
import Reservation from "../../models/Reservation";
import Table from "../../models/Table";
import { AppError } from "../../middlewares/errorHandler";

// Mock dependencies
jest.mock("../../repositories/reservationRepository");
jest.mock("../../models/Reservation");
jest.mock("../../models/Table");
jest.mock("../../services/notificationService");
// Mock socket helpers - phải mock trước khi import reservationService
jest.mock("../../sockets/index", () => ({
  forwardToAdmin: jest.fn(),
  forwardToCustomer: jest.fn(),
  broadcastToAdmin: jest.fn(),
}));

// Mock reservationSocket events - để reservationEvents sử dụng mocked helpers
jest.mock("../../sockets/reservationSocket", () => {
  return {
    __esModule: true,
    default: jest.fn(),
    reservationEvents: {
      reservationCreated: jest.fn(),
      reservationUpdated: jest.fn(),
      reservationStatusChanged: jest.fn(),
      reservationCheckedIn: jest.fn(),
      depositPaymentRequested: jest.fn(),
      depositPaymentCompleted: jest.fn(),
      depositPaymentFailed: jest.fn(),
      reservationDishAdded: jest.fn(),
      reservationDishUpdated: jest.fn(),
      reservationDishRemoved: jest.fn(),
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

const MockReservationRepository = reservationRepository as jest.Mocked<
  typeof reservationRepository
>;
const MockReservation = Reservation as jest.Mocked<typeof Reservation>;
const MockTable = Table as jest.Mocked<typeof Table>;

describe("ReservationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      MockReservationRepository.findAll = jest
        .fn()
        .mockResolvedValue(mockReservations);

      const result = await reservationService.getAllReservations({
        page: 1,
        limit: 10,
      });

      expect(MockReservationRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
      expect(result).toEqual(mockReservations);
    });
  });

  describe("getReservationById", () => {
    it("Kiểm tra lấy đặt bàn theo ID thành công", async () => {
      const mockReservation = {
        id: "reservation-123",
        user_id: "user-123",
        status: "confirmed",
        reservation_time: new Date("2024-01-01T18:00:00Z"),
      };

      MockReservationRepository.findById = jest
        .fn()
        .mockResolvedValue(mockReservation);
      MockReservation.findByPk = jest.fn().mockResolvedValue(mockReservation);

      const result = await reservationService.getReservationById(
        "reservation-123"
      );

      expect(MockReservationRepository.findById).toHaveBeenCalledWith(
        "reservation-123"
      );
      expect(result).toBeDefined();
    });

    it("Kiểm tra lấy đặt bàn thất bại khi không tìm thấy", async () => {
      MockReservationRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(
        reservationService.getReservationById("invalid-id")
      ).rejects.toThrow(AppError);
    });
  });

  describe("createReservation", () => {
    it("Kiểm tra tạo đặt bàn thành công", async () => {
      const reservationData = {
        user_id: "user-123",
        table_id: "table-456",
        reservation_time: new Date("2024-01-01T18:00:00Z"),
        num_people: 4,
      };

      const mockTable = {
        id: "table-456",
        capacity: 6,
        status: "available",
      };

      const mockReservation = {
        id: "reservation-123",
        ...reservationData,
        status: "pending",
      };

      MockTable.findByPk = jest.fn().mockResolvedValue(mockTable);
      MockReservationRepository.create = jest
        .fn()
        .mockResolvedValue(mockReservation);

      const result = await reservationService.createReservation(
        reservationData
      );

      expect(MockReservationRepository.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("updateReservationStatus", () => {
    it("Kiểm tra cập nhật trạng thái đặt bàn thành công", async () => {
      const mockReservation = {
        id: "reservation-123",
        status: "pending",
        table_id: "table-123",
        user_id: "user-123",
      };

      const updatedReservation = { ...mockReservation, status: "confirmed" };
      // Mock updateStatus trả về reservation với table_id
      MockReservationRepository.updateStatus = jest
        .fn()
        .mockResolvedValue(updatedReservation);
      // Mock Table.update để tránh lỗi
      MockTable.update = jest.fn().mockResolvedValue([1]);

      const result = await reservationService.updateReservationStatus(
        "reservation-123",
        "confirmed"
      );

      expect(MockReservationRepository.updateStatus).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
