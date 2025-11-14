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
import chatRoutes from "../../routes/chatRoutes";
import ChatSession from "../../models/ChatSession";
import ChatMessage from "../../models/ChatMessage";
import User from "../../models/User";
import { authenticate } from "../../middlewares/auth";
import { AppError } from "../../middlewares/errorHandler";

// Mock chỉ ở tầng thấp nhất (models)
jest.mock("../../models/ChatSession");
jest.mock("../../models/ChatMessage");
jest.mock("../../models/User");
jest.mock("../../models/Employee");
jest.mock("../../models/EmployeeShift");
jest.mock("../../models/AttendanceLog");
jest.mock("../../models/Payroll");
jest.mock("../../sockets", () => ({
  getIO: jest.fn(() => ({
    emit: jest.fn(),
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
    of: jest.fn(() => ({
      to: jest.fn(() => ({
        emit: jest.fn(),
      })),
      emit: jest.fn(),
    })),
  })),
}));
jest.mock("axios", () => ({
  post: jest.fn().mockResolvedValue({
    data: {
      response: "Bot response",
    },
  }),
}));

const MockChatSession = ChatSession as jest.Mocked<typeof ChatSession>;
const MockChatMessage = ChatMessage as jest.Mocked<typeof ChatMessage>;

describe("Chat Flow Integration Test", () => {
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

    app.use("/api/chat", chatRoutes);
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

  describe("Flow: POST /api/chat/session -> createSession -> chatService.createChatSession -> chatRepository.createSession -> ChatSession.create", () => {
    it("Kiểm tra flow tạo session chat đầy đủ từ route đến database", async () => {
      const sessionData = {
        channel: "web",
        botEnabled: true,
      };

      // Mock ChatSession.findOne (check existing)
      MockChatSession.findOne = jest.fn().mockResolvedValue(null);

      // Mock ChatSession.create
      const mockSession = {
        id: "session-123",
        user_id: mockUser.id,
        channel: "web",
        status: "active",
        bot_enabled: true,
        get: jest.fn((key: string) => {
          const data: any = {
            id: "session-123",
            user_id: mockUser.id,
            channel: "web",
            status: "active",
            bot_enabled: true,
          };
          return data[key];
        }),
      };

      MockChatSession.create = jest.fn().mockResolvedValue(mockSession);

      const response = await request(app)
        .post("/api/chat/session")
        .send(sessionData)
        .set("Authorization", "Bearer valid-token");

      // Verify response
      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toBeDefined();

      // Verify flow
      expect(MockChatSession.findOne).toHaveBeenCalled();
      expect(MockChatSession.create).toHaveBeenCalled();
    });
  });

  describe("Flow: POST /api/chat/sessions/:id/messages -> postMessage -> chatService.sendMessage -> chatRepository.addMessage -> ChatMessage.create", () => {
    it("Kiểm tra flow gửi tin nhắn đầy đủ từ route đến database", async () => {
      const sessionId = "session-123";
      const messageText = "Hello, I need help";

      // Mock ChatSession.findByPk
      const mockSession = {
        id: sessionId,
        user_id: mockUser.id,
        get: jest.fn((key: string) => {
          const data: any = {
            id: sessionId,
            user_id: mockUser.id,
          };
          return data[key];
        }),
      };

      MockChatSession.findByPk = jest.fn().mockResolvedValue(mockSession);

      // Mock ChatMessage.create - được gọi bởi chatRepository.addMessage
      const mockMessage = {
        id: "message-123",
        session_id: sessionId,
        message_text: messageText,
        sender_type: "user",
        timestamp: new Date().toISOString(),
        get: jest.fn((key: string) => {
          const data: any = {
            id: "message-123",
            session_id: sessionId,
            message_text: messageText,
            sender_type: "user",
            timestamp: new Date().toISOString(),
          };
          return data[key];
        }),
      };

      MockChatMessage.create = jest.fn().mockResolvedValue(mockMessage);

      // Mock session.get để trả về bot_enabled
      mockSession.get = jest.fn((key: string) => {
        const data: any = {
          id: sessionId,
          user_id: mockUser.id,
          bot_enabled: true,
        };
        return data[key];
      });

      const response = await request(app)
        .post(`/api/chat/sessions/${sessionId}/messages`)
        .send({
          message_text: messageText,
          sender_type: "user",
        })
        .set("Authorization", "Bearer valid-token");

      // Verify response
      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toBeDefined();

      // Verify flow
      expect(MockChatMessage.create).toHaveBeenCalled();
    });
  });

  describe("Flow: GET /api/chat/sessions -> getSessions -> chatService.listUserSessions -> chatRepository.getSessionsByUser -> ChatSession.findAndCountAll", () => {
    it("Kiểm tra flow lấy danh sách session đầy đủ từ route đến database", async () => {
      const mockSessions = [
        {
          id: "session-1",
          user_id: mockUser.id,
          status: "active",
        },
        {
          id: "session-2",
          user_id: mockUser.id,
          status: "closed",
        },
      ];

      MockChatSession.findAndCountAll = jest.fn().mockResolvedValue({
        rows: mockSessions,
        count: 2,
      });

      const response = await request(app)
        .get("/api/chat/sessions")
        .set("Authorization", "Bearer valid-token");

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.data).toHaveLength(2);

      // Verify flow
      expect(MockChatSession.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: mockUser.id },
        })
      );
    });
  });
});
