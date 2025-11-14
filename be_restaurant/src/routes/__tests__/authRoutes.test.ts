import request from "supertest";
import express, { Express } from "express";
import authRoutes from "../authRoutes";
import * as authController from "../../controllers/authController";
import { authenticate } from "../../middlewares/auth";
import { AppError } from "../../middlewares/errorHandler";

// Mock dependencies
jest.mock("../../controllers/authController");
jest.mock("../../middlewares/auth");
jest.mock("../../models/User");
jest.mock("../../utils/password");
jest.mock("../../utils/jwt");

const mockAuthenticate = authenticate as jest.MockedFunction<
  typeof authenticate
>;

describe("Auth Routes", () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/auth", authRoutes);
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

  describe("POST /api/auth/signup", () => {
    it("Kiểm tra đăng ký thành công với dữ liệu hợp lệ", async () => {
      const mockUser = {
        id: "user-123",
        username: "testuser",
        email: "test@example.com",
        role: "customer",
      };
      const mockToken = "mock-jwt-token";

      (authController.signup as jest.Mock).mockImplementation(
        async (req: any, res: any) => {
          res.status(201).json({
            status: "success",
            data: {
              user: mockUser,
              token: mockToken,
            },
          });
        }
      );

      const response = await request(app).post("/api/auth/signup").send({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data.user).toEqual(mockUser);
      expect(response.body.data.token).toBe(mockToken);
    });

    it("Kiểm tra đăng ký thất bại khi thiếu username", async () => {
      const response = await request(app).post("/api/auth/signup").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
    });

    it("Kiểm tra đăng ký thất bại khi email không hợp lệ", async () => {
      const response = await request(app).post("/api/auth/signup").send({
        username: "testuser",
        email: "invalid-email",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
    });

    it("Kiểm tra đăng ký thất bại khi mật khẩu quá ngắn", async () => {
      const response = await request(app).post("/api/auth/signup").send({
        username: "testuser",
        email: "test@example.com",
        password: "12345",
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
    });

    it("Kiểm tra đăng ký thất bại khi email đã tồn tại", async () => {
      (authController.signup as jest.Mock).mockImplementation(
        async (req: any, res: any, next: any) => {
          const error = new AppError("Email already registered", 400);
          next(error);
        }
      );

      const response = await request(app).post("/api/auth/signup").send({
        username: "testuser",
        email: "existing@example.com",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Email already registered");
    });
  });

  describe("POST /api/auth/login", () => {
    it("Kiểm tra đăng nhập thành công với thông tin hợp lệ", async () => {
      const mockUser = {
        id: "user-123",
        username: "testuser",
        email: "test@example.com",
        role: "customer",
      };
      const mockToken = "mock-jwt-token";

      (authController.login as jest.Mock).mockImplementation(
        async (req: any, res: any) => {
          res.json({
            status: "success",
            data: {
              user: mockUser,
              token: mockToken,
            },
          });
        }
      );

      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.user).toEqual(mockUser);
      expect(response.body.data.token).toBe(mockToken);
    });

    it("Kiểm tra đăng nhập thất bại khi thiếu email", async () => {
      const response = await request(app).post("/api/auth/login").send({
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
    });

    it("Kiểm tra đăng nhập thất bại khi thiếu password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
    });

    it("Kiểm tra đăng nhập thất bại khi email không hợp lệ", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "invalid-email",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
    });

    it("Kiểm tra đăng nhập thất bại khi thông tin không đúng", async () => {
      (authController.login as jest.Mock).mockImplementation(
        async (req: any, res: any, next: any) => {
          const error = new AppError("Invalid credentials", 401);
          next(error);
        }
      );

      const response = await request(app).post("/api/auth/login").send({
        email: "wrong@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Invalid credentials");
    });
  });

  describe("GET /api/auth/validate", () => {
    it("Kiểm tra validate token thành công", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        role: "customer",
      };

      mockAuthenticate.mockImplementation((req: any, res: any, next: any) => {
        req.user = mockUser;
        next();
      });

      (authController.validateToken as jest.Mock).mockImplementation(
        async (req: any, res: any) => {
          res.json({
            status: "success",
            data: {
              user: req.user,
            },
          });
        }
      );

      const response = await request(app)
        .get("/api/auth/validate")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.user).toEqual(mockUser);
    });

    it("Kiểm tra validate token thất bại khi không có token", async () => {
      mockAuthenticate.mockImplementation((req: any, res: any, next: any) => {
        const error = new AppError("No token provided", 401);
        next(error);
      });

      const response = await request(app).get("/api/auth/validate");

      expect(response.status).toBe(401);
      expect(response.body.status).toBe("error");
    });
  });

  describe("GET /api/auth/me", () => {
    it("Kiểm tra lấy thông tin user hiện tại thành công", async () => {
      const mockUser = {
        id: "user-123",
        username: "testuser",
        email: "test@example.com",
        phone: "0123456789",
        role: "customer",
        full_name: "Test User",
        ranking: "bronze",
        points: 100,
      };

      mockAuthenticate.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          id: "user-123",
          email: "test@example.com",
          role: "customer",
        };
        next();
      });

      (authController.getCurrentUser as jest.Mock).mockImplementation(
        async (req: any, res: any) => {
          res.json({
            status: "success",
            data: mockUser,
          });
        }
      );

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toEqual(mockUser);
    });

    it("Kiểm tra lấy thông tin user thất bại khi không có token", async () => {
      mockAuthenticate.mockImplementation((req: any, res: any, next: any) => {
        const error = new AppError("Unauthorized", 401);
        next(error);
      });

      const response = await request(app).get("/api/auth/me");

      expect(response.status).toBe(401);
      expect(response.body.status).toBe("error");
    });
  });
});
