import request from "supertest";
import express, { Express } from "express";
import reservationRoutes from "../reservationRoutes";
import * as reservationController from "../../controllers/reservationController";
import { authenticate, authorize } from "../../middlewares/auth";
import { AppError } from "../../middlewares/errorHandler";

// Mock dependencies
jest.mock("../../controllers/reservationController");
jest.mock("../../services/reservationService");

// Mock auth middleware before importing routes
jest.mock("../../middlewares/auth", () => {
  const mockAuth = {
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
        const user = req.user;
        if (!user) {
          return res
            .status(401)
            .json({ status: "error", message: "Authentication required" });
        }
        if (!roles.includes(user.role)) {
          return res
            .status(403)
            .json({ status: "error", message: "Insufficient permissions" });
        }
        next();
      };
    }),
  };
  return mockAuth;
});

const mockAuthenticate = authenticate as jest.MockedFunction<
  typeof authenticate
>;
const mockAuthorize = authorize as jest.MockedFunction<typeof authorize>;

describe("Reservation Routes", () => {
  let app: Express;
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    role: "customer" as const,
  };
  const mockAdmin = {
    id: "admin-123",
    email: "admin@example.com",
    role: "admin" as const,
  };

  beforeEach(() => {
    app = express();
    app.use(express.json());
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

    // Default mock for authenticate middleware
    mockAuthenticate.mockImplementation(
      async (req: any, res: any, next: any) => {
        req.user = mockUser;
        next();
      }
    );

    // Default mock for authorize middleware
    mockAuthorize.mockImplementation((...roles: string[]) => {
      return (req: any, res: any, next: any) => {
        const user = req.user;
        if (!user) {
          return res
            .status(401)
            .json({ status: "error", message: "Authentication required" });
        }
        if (!roles.includes(user.role)) {
          return res
            .status(403)
            .json({ status: "error", message: "Insufficient permissions" });
        }
        next();
      };
    });
  });

  describe("GET /api/reservations/my-reservations", () => {
    it("Kiểm tra lấy danh sách đặt bàn của user thành công", async () => {
      const mockReservations = {
        rows: [
          {
            id: "reservation-1",
            user_id: "user-123",
            status: "confirmed",
            reservation_time: "2024-01-01T18:00:00Z",
          },
          {
            id: "reservation-2",
            user_id: "user-123",
            status: "pending",
            reservation_time: "2024-01-02T19:00:00Z",
          },
        ],
        count: 2,
      };

      (reservationController.getMyReservations as jest.Mock).mockImplementation(
        async (req: any, res: any) => {
          res.json({
            status: "success",
            data: {
              data: mockReservations.rows,
              pagination: {
                page: 1,
                limit: 10,
                total: 2,
                totalPages: 1,
              },
            },
          });
        }
      );

      const response = await request(app)
        .get("/api/reservations/my-reservations")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.data).toHaveLength(2);
    });

    it("Kiểm tra lấy danh sách đặt bàn với filter date", async () => {
      (reservationController.getMyReservations as jest.Mock).mockImplementation(
        async (req: any, res: any) => {
          res.json({
            status: "success",
            data: {
              data: [],
              pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
            },
          });
        }
      );

      const response = await request(app)
        .get("/api/reservations/my-reservations")
        .query({ date: "2024-01-01" })
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
    });

    it("Kiểm tra lấy danh sách đặt bàn với filter status", async () => {
      (reservationController.getMyReservations as jest.Mock).mockImplementation(
        async (req: any, res: any) => {
          res.json({
            status: "success",
            data: {
              data: [],
              pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
            },
          });
        }
      );

      const response = await request(app)
        .get("/api/reservations/my-reservations")
        .query({ status: "confirmed" })
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
    });

    it("Kiểm tra lấy danh sách đặt bàn thất bại khi không có token", async () => {
      mockAuthenticate.mockImplementation(
        async (req: any, res: any, next: any) => {
          const error = new AppError("Unauthorized", 401);
          next(error);
        }
      );

      const response = await request(app).get(
        "/api/reservations/my-reservations"
      );

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/reservations/", () => {
    it("Kiểm tra lấy tất cả đặt bàn thành công (admin)", async () => {
      mockAuthenticate.mockImplementation(
        async (req: any, res: any, next: any) => {
          req.user = mockAdmin;
          next();
        }
      );

      const mockReservations = {
        rows: [
          {
            id: "reservation-1",
            user_id: "user-123",
            status: "confirmed",
          },
          {
            id: "reservation-2",
            user_id: "user-456",
            status: "pending",
          },
        ],
        count: 2,
      };

      (
        reservationController.getAllReservations as jest.Mock
      ).mockImplementation(async (req: any, res: any) => {
        res.json({
          status: "success",
          data: {
            data: mockReservations.rows,
            pagination: {
              page: 1,
              limit: 10,
              total: 2,
              totalPages: 1,
            },
          },
        });
      });

      const response = await request(app)
        .get("/api/reservations/")
        .set("Authorization", "Bearer admin-token");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });

    it("Kiểm tra lấy tất cả đặt bàn thất bại khi không có quyền", async () => {
      mockAuthorize.mockImplementation(() => {
        return (req: any, res: any, next: any) => {
          const error = new AppError("Insufficient permissions", 403);
          next(error);
        };
      });

      const response = await request(app)
        .get("/api/reservations/")
        .set("Authorization", "Bearer user-token");

      expect(response.status).toBe(403);
    });
  });

  describe("GET /api/reservations/:id", () => {
    it("Kiểm tra lấy đặt bàn theo ID thành công", async () => {
      const mockReservation = {
        id: "reservation-123",
        user_id: "user-123",
        table_id: "table-456",
        status: "confirmed",
        reservation_time: "2024-01-01T18:00:00Z",
        num_people: 4,
      };

      (
        reservationController.getReservationById as jest.Mock
      ).mockImplementation(async (req: any, res: any) => {
        res.json({
          status: "success",
          data: mockReservation,
        });
      });

      const response = await request(app)
        .get("/api/reservations/550e8400-e29b-41d4-a716-446655440000")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.id).toBe("reservation-123");
    });

    it("Kiểm tra lấy đặt bàn thất bại khi ID không hợp lệ", async () => {
      const response = await request(app)
        .get("/api/reservations/invalid-uuid")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/reservations/", () => {
    it("Kiểm tra tạo đặt bàn thành công", async () => {
      const mockReservation = {
        id: "reservation-123",
        user_id: "user-123",
        table_id: "table-456",
        reservation_time: "2024-01-01T18:00:00Z",
        num_people: 4,
        status: "pending",
      };

      (reservationController.createReservation as jest.Mock).mockImplementation(
        async (req: any, res: any) => {
          res.status(201).json({
            status: "success",
            data: mockReservation,
          });
        }
      );

      const response = await request(app)
        .post("/api/reservations/")
        .send({
          table_id: "770e8400-e29b-41d4-a716-446655440000",
          reservation_time: "2024-01-01T18:00:00Z",
          num_people: 4,
        })
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data.table_id).toBe("table-456");
    });

    it("Kiểm tra tạo đặt bàn thất bại khi thiếu table_id", async () => {
      const response = await request(app)
        .post("/api/reservations/")
        .send({
          reservation_time: "2024-01-01T18:00:00Z",
          num_people: 4,
        })
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(400);
    });

    it("Kiểm tra tạo đặt bàn thất bại khi thiếu reservation_time", async () => {
      const response = await request(app)
        .post("/api/reservations/")
        .send({
          table_id: "770e8400-e29b-41d4-a716-446655440000",
          num_people: 4,
        })
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(400);
    });

    it("Kiểm tra tạo đặt bàn thất bại khi num_people < 1", async () => {
      const response = await request(app)
        .post("/api/reservations/")
        .send({
          table_id: "770e8400-e29b-41d4-a716-446655440000",
          reservation_time: "2024-01-01T18:00:00Z",
          num_people: 0,
        })
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(400);
    });

    it("Kiểm tra tạo đặt bàn thất bại khi num_people > 50", async () => {
      const response = await request(app)
        .post("/api/reservations/")
        .send({
          table_id: "770e8400-e29b-41d4-a716-446655440000",
          reservation_time: "2024-01-01T18:00:00Z",
          num_people: 51,
        })
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(400);
    });

    it("Kiểm tra tạo đặt bàn với pre_order_items thành công", async () => {
      const mockReservation = {
        id: "reservation-123",
        pre_order_items: [
          { dish_id: "880e8400-e29b-41d4-a716-446655440000", quantity: 2 },
          { dish_id: "990e8400-e29b-41d4-a716-446655440000", quantity: 1 },
        ],
      };

      (reservationController.createReservation as jest.Mock).mockImplementation(
        async (req: any, res: any) => {
          res.status(201).json({
            status: "success",
            data: mockReservation,
          });
        }
      );

      const response = await request(app)
        .post("/api/reservations/")
        .send({
          table_id: "770e8400-e29b-41d4-a716-446655440000",
          reservation_time: "2024-01-01T18:00:00Z",
          num_people: 4,
          pre_order_items: [
            { dish_id: "880e8400-e29b-41d4-a716-446655440000", quantity: 2 },
            { dish_id: "990e8400-e29b-41d4-a716-446655440000", quantity: 1 },
          ],
        })
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
    });
  });

  describe("PATCH /api/reservations/:id", () => {
    it("Kiểm tra cập nhật đặt bàn thành công", async () => {
      const mockReservation = {
        id: "reservation-123",
        table_id: "table-789",
        num_people: 6,
      };

      (reservationController.updateReservation as jest.Mock).mockImplementation(
        async (req: any, res: any) => {
          res.json({
            status: "success",
            data: mockReservation,
          });
        }
      );

      const response = await request(app)
        .patch("/api/reservations/550e8400-e29b-41d4-a716-446655440000")
        .send({ num_people: 6 })
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });

    it("Kiểm tra cập nhật đặt bàn thất bại khi ID không hợp lệ", async () => {
      const response = await request(app)
        .patch("/api/reservations/invalid-uuid")
        .send({ num_people: 6 })
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/reservations/:id/status", () => {
    it("Kiểm tra cập nhật trạng thái đặt bàn thành công (admin)", async () => {
      mockAuthenticate.mockImplementation(
        async (req: any, res: any, next: any) => {
          req.user = mockAdmin;
          next();
        }
      );

      const mockReservation = {
        id: "reservation-123",
        status: "confirmed",
      };

      (
        reservationController.updateReservationStatus as jest.Mock
      ).mockImplementation(async (req: any, res: any) => {
        res.json({
          status: "success",
          data: mockReservation,
        });
      });

      const response = await request(app)
        .patch("/api/reservations/550e8400-e29b-41d4-a716-446655440000/status")
        .send({ status: "confirmed" })
        .set("Authorization", "Bearer admin-token");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });

    it("Kiểm tra cập nhật trạng thái thất bại khi status không hợp lệ", async () => {
      mockAuthenticate.mockImplementation(
        async (req: any, res: any, next: any) => {
          req.user = mockAdmin;
          next();
        }
      );

      const response = await request(app)
        .patch("/api/reservations/550e8400-e29b-41d4-a716-446655440000/status")
        .send({ status: "invalid-status" })
        .set("Authorization", "Bearer admin-token");

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/reservations/:id/checkin", () => {
    it("Kiểm tra check-in đặt bàn thành công", async () => {
      const mockResult = {
        id: "reservation-123",
        status: "confirmed",
        checked_in: true,
      };

      (
        reservationController.checkInReservation as jest.Mock
      ).mockImplementation(async (req: any, res: any) => {
        res.json({
          status: "success",
          data: mockResult,
        });
      });

      const response = await request(app)
        .post("/api/reservations/550e8400-e29b-41d4-a716-446655440000/checkin")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });

    it("Kiểm tra check-in thất bại khi ID không hợp lệ", async () => {
      const response = await request(app)
        .post("/api/reservations/invalid-uuid/checkin")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/reservations/:id/cancel", () => {
    it("Kiểm tra hủy đặt bàn thành công (owner)", async () => {
      const mockReservation = {
        id: "reservation-123",
        user_id: "user-123",
        status: "cancelled",
      };

      (reservationController.cancelReservation as jest.Mock).mockImplementation(
        async (req: any, res: any) => {
          res.json({
            status: "success",
            data: mockReservation,
          });
        }
      );

      const response = await request(app)
        .post("/api/reservations/550e8400-e29b-41d4-a716-446655440000/cancel")
        .send({ reason: "Change of plans" })
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });

    it("Kiểm tra hủy đặt bàn thành công (admin)", async () => {
      mockAuthenticate.mockImplementation(
        async (req: any, res: any, next: any) => {
          req.user = mockAdmin;
          next();
        }
      );

      const mockReservation = {
        id: "reservation-123",
        status: "cancelled",
      };

      (reservationController.cancelReservation as jest.Mock).mockImplementation(
        async (req: any, res: any) => {
          res.json({
            status: "success",
            data: mockReservation,
          });
        }
      );

      const response = await request(app)
        .post("/api/reservations/550e8400-e29b-41d4-a716-446655440000/cancel")
        .send({ reason: "Table unavailable" })
        .set("Authorization", "Bearer admin-token");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });

    it("Kiểm tra hủy đặt bàn thất bại khi không phải owner", async () => {
      const mockReservation = {
        id: "reservation-123",
        user_id: "user-456", // Different user
        status: "confirmed",
      };

      (reservationController.getReservationById as jest.Mock).mockResolvedValue(
        mockReservation
      );

      (reservationController.cancelReservation as jest.Mock).mockImplementation(
        async (req: any, res: any, next: any) => {
          const error = new AppError(
            "You can only cancel your own reservations",
            403
          );
          next(error);
        }
      );

      const response = await request(app)
        .post("/api/reservations/550e8400-e29b-41d4-a716-446655440000/cancel")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(403);
    });

    it("Kiểm tra hủy đặt bàn thất bại khi ID không hợp lệ", async () => {
      const response = await request(app)
        .post("/api/reservations/invalid-uuid/cancel")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /api/reservations/:id", () => {
    it("Kiểm tra xóa đặt bàn thành công", async () => {
      (reservationController.deleteReservation as jest.Mock).mockImplementation(
        async (req: any, res: any) => {
          res.json({
            status: "success",
            message: "Reservation deleted successfully",
          });
        }
      );

      const response = await request(app)
        .delete("/api/reservations/550e8400-e29b-41d4-a716-446655440000")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });

    it("Kiểm tra xóa đặt bàn thất bại khi ID không hợp lệ", async () => {
      const response = await request(app)
        .delete("/api/reservations/invalid-uuid")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/reservations/:id/dishes", () => {
    it("Kiểm tra thêm món vào đặt bàn thành công", async () => {
      const mockReservation = {
        id: "reservation-123",
        dishes: [{ dish_id: "dish-456", quantity: 2 }],
      };

      (
        reservationController.addDishToReservation as jest.Mock
      ).mockImplementation(async (req: any, res: any) => {
        res.json({
          status: "success",
          data: mockReservation,
        });
      });

      const response = await request(app)
        .post("/api/reservations/550e8400-e29b-41d4-a716-446655440000/dishes")
        .send({ dish_id: "660e8400-e29b-41d4-a716-446655440000", quantity: 2 })
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });

    it("Kiểm tra thêm món thất bại khi thiếu dish_id", async () => {
      const response = await request(app)
        .post("/api/reservations/550e8400-e29b-41d4-a716-446655440000/dishes")
        .send({ quantity: 2 })
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(400);
    });

    it("Kiểm tra thêm món thất bại khi quantity < 1", async () => {
      const response = await request(app)
        .post("/api/reservations/550e8400-e29b-41d4-a716-446655440000/dishes")
        .send({ dish_id: "660e8400-e29b-41d4-a716-446655440000", quantity: 0 })
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/reservations/:id/dishes/:dishId", () => {
    it("Kiểm tra cập nhật số lượng món thành công", async () => {
      const mockReservation = {
        id: "reservation-123",
        dishes: [{ dish_id: "dish-456", quantity: 3 }],
      };

      (
        reservationController.updateDishQuantity as jest.Mock
      ).mockImplementation(async (req: any, res: any) => {
        res.json({
          status: "success",
          data: mockReservation,
        });
      });

      const response = await request(app)
        .patch(
          "/api/reservations/550e8400-e29b-41d4-a716-446655440000/dishes/660e8400-e29b-41d4-a716-446655440000"
        )
        .send({ quantity: 3 })
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });

    it("Kiểm tra cập nhật số lượng thất bại khi quantity < 1", async () => {
      const response = await request(app)
        .patch(
          "/api/reservations/550e8400-e29b-41d4-a716-446655440000/dishes/660e8400-e29b-41d4-a716-446655440000"
        )
        .send({ quantity: 0 })
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /api/reservations/:id/dishes/:dishId", () => {
    it("Kiểm tra xóa món khỏi đặt bàn thành công", async () => {
      const mockReservation = {
        id: "reservation-123",
        dishes: [],
      };

      (
        reservationController.removeDishFromReservation as jest.Mock
      ).mockImplementation(async (req: any, res: any) => {
        res.json({
          status: "success",
          data: mockReservation,
        });
      });

      const response = await request(app)
        .delete(
          "/api/reservations/550e8400-e29b-41d4-a716-446655440000/dishes/660e8400-e29b-41d4-a716-446655440000"
        )
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });

    it("Kiểm tra xóa món thất bại khi ID không hợp lệ", async () => {
      const response = await request(app)
        .delete(
          "/api/reservations/invalid-uuid/dishes/660e8400-e29b-41d4-a716-446655440000"
        )
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(400);
    });
  });
});
