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
  authorize: jest.fn((...roles: string[]) => {
    return (req: any, res: any, next: any) => {
      next();
    };
  }),
}));

import request from "supertest";
import express, { Express } from "express";
import reservationRoutes from "../../routes/reservationRoutes";
import Reservation from "../../models/Reservation";
import Table from "../../models/Table";
import User from "../../models/User";
import { authenticate } from "../../middlewares/auth";
import { AppError } from "../../middlewares/errorHandler";

// Mock chỉ ở tầng thấp nhất (models)
jest.mock("../../models/Reservation");
jest.mock("../../models/Table");
jest.mock("../../models/User");
jest.mock("../../models/Dish");
jest.mock("../../models/Employee");
jest.mock("../../models/EmployeeShift");
jest.mock("../../models/AttendanceLog");
jest.mock("../../models/Payroll");
jest.mock("../../models/Order");
jest.mock("../../models/OrderItem");
jest.mock("../../models/Payment");
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

const MockReservation = Reservation as jest.Mocked<typeof Reservation>;
const MockTable = Table as jest.Mocked<typeof Table>;

describe("Reservation Flow Integration Test", () => {
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

    app.use("/api/reservations", reservationRoutes);
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

  describe("Flow: POST /api/reservations/ -> createReservation -> reservationService.createReservation -> reservationRepository.create", () => {
    it("Kiểm tra flow tạo đặt bàn đầy đủ từ route đến repository", async () => {
      const tableId = "770e8400-e29b-41d4-a716-446655440000";
      const reservationTime = "2024-01-01T18:00:00Z";
      const numPeople = 4;

      // Mock Table model
      const mockTable = {
        id: tableId,
        table_number: "T1",
        capacity: 6,
        status: "available",
      };

      MockTable.findByPk = jest.fn().mockResolvedValue(mockTable);

      // Mock Reservation model
      const mockReservation = {
        id: "reservation-123",
        user_id: mockUser.id,
        table_id: tableId,
        reservation_time: new Date(reservationTime),
        num_people: numPeople,
        status: "pending",
        get: jest.fn((key: string) => {
          const data: any = {
            id: "reservation-123",
            user_id: mockUser.id,
            table_id: tableId,
            reservation_time: new Date(reservationTime),
            num_people: numPeople,
            status: "pending",
          };
          return data[key];
        }),
      };

      MockReservation.create = jest.fn().mockResolvedValue(mockReservation);

      const response = await request(app)
        .post("/api/reservations/")
        .send({
          table_id: tableId,
          reservation_time: reservationTime,
          num_people: numPeople,
        })
        .set("Authorization", "Bearer valid-token");

      // Verify response
      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toBeDefined();

      // Verify flow
      expect(MockReservation.create).toHaveBeenCalled();
    });
  });

  describe("Flow: GET /api/reservations/:id -> getReservationById -> reservationService.getReservationById -> reservationRepository.findById", () => {
    it("Kiểm tra flow lấy đặt bàn đầy đủ từ route đến repository", async () => {
      const reservationId = "550e8400-e29b-41d4-a716-446655440000";

      const mockReservation = {
        id: reservationId,
        user_id: mockUser.id,
        table_id: "table-456",
        reservation_time: new Date("2024-01-01T18:00:00Z"),
        num_people: 4,
        status: "confirmed",
        get: jest.fn((key: string) => {
          const data: any = {
            id: reservationId,
            user_id: mockUser.id,
            table_id: "table-456",
            status: "confirmed",
          };
          return data[key];
        }),
      };

      MockReservation.findByPk = jest.fn().mockResolvedValue(mockReservation);

      const response = await request(app)
        .get(`/api/reservations/${reservationId}`)
        .set("Authorization", "Bearer valid-token");

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toBeDefined();

      // Verify flow
      expect(MockReservation.findByPk).toHaveBeenCalled();
    });
  });
});
