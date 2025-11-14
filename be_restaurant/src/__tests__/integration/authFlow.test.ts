import request from "supertest";
import express, { Express } from "express";
import authRoutes from "../../routes/authRoutes";
import User from "../../models/User";
import { hashPassword, comparePassword } from "../../utils/password";
import { generateToken } from "../../utils/jwt";
import { AppError } from "../../middlewares/errorHandler";

// Mock chỉ ở tầng thấp nhất (models và utils)
jest.mock("../../models/User");
jest.mock("../../utils/password");
jest.mock("../../utils/jwt");

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
}));

const MockUser = User as jest.Mocked<typeof User>;
const MockHashPassword = hashPassword as jest.MockedFunction<
  typeof hashPassword
>;
const MockComparePassword = comparePassword as jest.MockedFunction<
  typeof comparePassword
>;
const MockGenerateToken = generateToken as jest.MockedFunction<
  typeof generateToken
>;

describe("Auth Flow Integration Test", () => {
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

  describe("Flow: POST /api/auth/signup -> signup -> User.create -> hashPassword -> generateToken", () => {
    it("Kiểm tra flow đăng ký đầy đủ từ route đến database", async () => {
      const signupData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      // Mock User.findOne (check existing)
      MockUser.findOne = jest.fn().mockResolvedValue(null);

      // Mock hashPassword
      MockHashPassword.mockResolvedValue("hashed_password_123");

      // Mock User.create
      const mockUser = {
        id: "user-123",
        username: "testuser",
        email: "test@example.com",
        role: "customer",
      };

      MockUser.create = jest.fn().mockResolvedValue(mockUser);

      // Mock generateToken
      MockGenerateToken.mockReturnValue("mock-jwt-token");

      const response = await request(app)
        .post("/api/auth/signup")
        .send(signupData);

      // Verify response
      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data.user).toEqual(mockUser);
      expect(response.body.data.token).toBe("mock-jwt-token");

      // Verify flow: Route -> Controller -> Model
      // 1. Route nhận request
      // 2. Controller gọi User.findOne (check existing)
      expect(MockUser.findOne).toHaveBeenCalledWith({
        where: { email: signupData.email },
      });
      expect(MockUser.findOne).toHaveBeenCalledWith({
        where: { username: signupData.username },
      });

      // 3. Controller gọi hashPassword
      expect(MockHashPassword).toHaveBeenCalledWith(signupData.password);

      // 4. Controller gọi User.create
      expect(MockUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: signupData.username,
          email: signupData.email,
          password_hash: "hashed_password_123",
        })
      );

      // 5. Controller gọi generateToken
      expect(MockGenerateToken).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });
  });

  describe("Flow: POST /api/auth/login -> login -> User.findOne -> comparePassword -> generateToken", () => {
    it("Kiểm tra flow đăng nhập đầy đủ từ route đến database", async () => {
      const loginData = {
        email: "test@example.com",
        password: "password123",
      };

      const mockUser = {
        id: "user-123",
        username: "testuser",
        email: "test@example.com",
        role: "customer",
        password_hash: "hashed_password_123",
      };

      // Mock User.findOne
      MockUser.findOne = jest.fn().mockResolvedValue(mockUser);

      // Mock comparePassword
      MockComparePassword.mockResolvedValue(true);

      // Mock generateToken
      MockGenerateToken.mockReturnValue("mock-jwt-token");

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData);

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.user).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(response.body.data.token).toBe("mock-jwt-token");

      // Verify flow
      // 1. Route nhận request
      // 2. Controller gọi User.findOne
      expect(MockUser.findOne).toHaveBeenCalledWith({
        where: { email: loginData.email },
      });

      // 3. Controller gọi comparePassword
      expect(MockComparePassword).toHaveBeenCalledWith(
        loginData.password,
        mockUser.password_hash
      );

      // 4. Controller gọi generateToken
      expect(MockGenerateToken).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it("Kiểm tra flow đăng nhập thất bại khi không tìm thấy user", async () => {
      const loginData = {
        email: "wrong@example.com",
        password: "password123",
      };

      // Mock User.findOne returns null
      MockUser.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData);

      // Verify response
      expect(response.status).toBe(401);
      expect(response.body.status).toBe("error");

      // Verify flow
      expect(MockUser.findOne).toHaveBeenCalled();
      expect(MockComparePassword).not.toHaveBeenCalled();
      expect(MockGenerateToken).not.toHaveBeenCalled();
    });
  });

  describe("Flow: GET /api/auth/me -> getCurrentUser -> authenticate -> User.findByPk", () => {
    it("Kiểm tra flow lấy thông tin user đầy đủ từ route đến database", async () => {
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

      // authenticate middleware đã được mock ở trên

      // Mock User.findByPk
      MockUser.findByPk = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer valid-token");

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toEqual(mockUser);

      // Verify flow
      expect(MockUser.findByPk).toHaveBeenCalledWith("user-123", {
        attributes: { exclude: ["password_hash"] },
      });
    });
  });
});
