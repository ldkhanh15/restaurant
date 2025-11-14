import reservationRepository from "../reservationRepository";
import Reservation from "../../models/Reservation";
import User from "../../models/User";
import Table from "../../models/Table";
import Event from "../../models/Event";
import { AppError } from "../../middlewares/errorHandler";

// Mock models
jest.mock("../../models/Reservation");
jest.mock("../../models/User");
jest.mock("../../models/Table");
jest.mock("../../models/Event");

const MockReservation = Reservation as jest.Mocked<typeof Reservation>;

describe("ReservationRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("Kiểm tra lấy tất cả đặt bàn thành công", async () => {
      const mockReservations = [
        {
          id: "reservation-1",
          user_id: "user-123",
          status: "confirmed",
          reservation_time: new Date("2024-01-01T18:00:00Z"),
        },
      ];

      MockReservation.findAndCountAll = jest.fn().mockResolvedValue({
        rows: mockReservations,
        count: 1,
      });

      const result = await reservationRepository.findAll({
        page: 1,
        limit: 10,
      });

      expect(MockReservation.findAndCountAll).toHaveBeenCalled();
      expect(result.rows).toEqual(mockReservations);
      expect(result.count).toBe(1);
    });

    it("Kiểm tra lấy đặt bàn với filter status", async () => {
      const mockReservations: any[] = [];
      MockReservation.findAndCountAll = jest.fn().mockResolvedValue({
        rows: mockReservations,
        count: 0,
      });

      await reservationRepository.findAll({
        status: "confirmed",
        page: 1,
        limit: 10,
      });

      expect(MockReservation.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "confirmed" }),
        })
      );
    });
  });

  describe("findById", () => {
    it("Kiểm tra lấy đặt bàn theo ID thành công", async () => {
      const mockReservation = {
        id: "reservation-123",
        user_id: "user-123",
        status: "confirmed",
        reservation_time: new Date("2024-01-01T18:00:00Z"),
      };

      MockReservation.findByPk = jest.fn().mockResolvedValue(mockReservation);

      const result = await reservationRepository.findById("reservation-123");

      expect(MockReservation.findByPk).toHaveBeenCalledWith(
        "reservation-123",
        expect.objectContaining({
          include: expect.any(Array),
        })
      );
      expect(result).toEqual(mockReservation);
    });
  });

  describe("create", () => {
    it("Kiểm tra tạo đặt bàn thành công", async () => {
      const reservationData = {
        user_id: "user-123",
        table_id: "table-456",
        reservation_time: new Date("2024-01-01T18:00:00Z"),
        num_people: 4,
        status: "pending",
      };

      const mockReservation = { id: "reservation-123", ...reservationData };
      MockReservation.create = jest.fn().mockResolvedValue(mockReservation);

      const result = await reservationRepository.create(reservationData);

      expect(MockReservation.create).toHaveBeenCalledWith(reservationData);
      expect(result).toEqual(mockReservation);
    });
  });

  describe("update", () => {
    it("Kiểm tra cập nhật đặt bàn thành công", async () => {
      const mockReservation = {
        id: "reservation-123",
        status: "pending",
        update: jest.fn().mockResolvedValue(undefined),
      };

      MockReservation.findByPk = jest.fn().mockResolvedValue(mockReservation);

      const updateData = { status: "confirmed" };
      const result = await reservationRepository.update(
        "reservation-123",
        updateData
      );

      expect(MockReservation.findByPk).toHaveBeenCalledWith("reservation-123");
      expect(mockReservation.update).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(mockReservation);
    });

    it("Kiểm tra cập nhật đặt bàn thất bại khi không tìm thấy", async () => {
      MockReservation.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        reservationRepository.update("invalid-id", { status: "confirmed" })
      ).rejects.toThrow(AppError);
    });
  });
});
