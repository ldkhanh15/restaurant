import * as chatController from "../chatController";
import * as chatService from "../../services/chatService";
import { getIO } from "../../sockets";
import { AppError } from "../../middlewares/errorHandler";

// Mock dependencies
jest.mock("../../services/chatService", () => ({
  createChatSession: jest.fn(),
  listUserSessions: jest.fn(),
  listMessages: jest.fn(),
  sendMessage: jest.fn(),
  enableBot: jest.fn(),
  disableBot: jest.fn(),
  closeChatSession: jest.fn(),
  reopenChatSession: jest.fn(),
  getActiveSession: jest.fn(),
  getUserSession: jest.fn(),
  listAllSessions: jest.fn(),
  markMessagesAsRead: jest.fn(),
}));
jest.mock("../../sockets", () => ({
  getIO: jest.fn(() => ({
    emit: jest.fn(),
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
  })),
}));

const MockChatService = chatService as jest.Mocked<typeof chatService>;
const MockGetIO = getIO as jest.MockedFunction<typeof getIO>;

describe("ChatController", () => {
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
      headers: {
        authorization: "Bearer valid-token",
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe("createSession", () => {
    it("Kiểm tra tạo session chat thành công", async () => {
      mockReq.body = {
        channel: "web",
        botEnabled: true,
      };

      const mockSession = {
        id: "session-123",
        user_id: "user-123",
        channel: "web",
        bot_enabled: true,
        status: "active",
      };

      (MockChatService.createChatSession as jest.Mock).mockResolvedValue(
        mockSession
      );

      await chatController.createSession(mockReq, mockRes, mockNext);

      expect(MockChatService.createChatSession).toHaveBeenCalledWith(
        "user-123",
        "web",
        {},
        true
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockSession,
      });
    });
  });

  describe("getSessions", () => {
    it("Kiểm tra lấy danh sách session thành công", async () => {
      const mockSessions = {
        rows: [
          {
            id: "session-1",
            user_id: "user-123",
            status: "active",
          },
        ],
        count: 1,
      };

      (MockChatService.listUserSessions as jest.Mock).mockResolvedValue(
        mockSessions
      );

      await chatController.getSessions(mockReq, mockRes, mockNext);

      expect(MockChatService.listUserSessions).toHaveBeenCalledWith(
        "user-123",
        1,
        10
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: expect.objectContaining({
          data: mockSessions.rows,
          pagination: expect.any(Object),
        }),
      });
    });

    it("Kiểm tra trả về 400 khi không có user id", async () => {
      mockReq.user = null;

      await chatController.getSessions(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Missing user id",
      });
    });
  });

  describe("getActiveUserSession", () => {
    it("Kiểm tra lấy session active thành công", async () => {
      const mockSession = {
        id: "session-123",
        user_id: "user-123",
        status: "active",
        bot_enabled: true,
      };

      (MockChatService.getActiveSession as jest.Mock).mockResolvedValue(
        mockSession
      );

      await chatController.getActiveUserSession(mockReq, mockRes, mockNext);

      expect(MockChatService.getActiveSession).toHaveBeenCalledWith("user-123");
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockSession,
      });
    });

    it("Kiểm tra tạo session mới nếu không có session active", async () => {
      (MockChatService.getActiveSession as jest.Mock).mockResolvedValue(null);

      const newSession = {
        id: "session-456",
        user_id: "user-123",
        status: "active",
      };

      (MockChatService.getUserSession as jest.Mock).mockResolvedValue(
        newSession
      );

      await chatController.getActiveUserSession(mockReq, mockRes, mockNext);

      expect(MockChatService.getActiveSession).toHaveBeenCalledWith("user-123");
      expect(MockChatService.getUserSession).toHaveBeenCalledWith("user-123");
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: newSession,
      });
    });
  });

  describe("postMessage", () => {
    it("Kiểm tra gửi tin nhắn thành công", async () => {
      mockReq.params.id = "session-123";
      mockReq.body = {
        message_text: "Hello, I need help",
        sender_type: "user",
      };

      const mockMessage = {
        id: "message-123",
        session_id: "session-123",
        message_text: "Hello, I need help",
        sender_type: "user",
      };

      mockReq.headers = {
        authorization: "Bearer valid-token",
      };

      (MockChatService.sendMessage as jest.Mock).mockResolvedValue(mockMessage);

      await chatController.postMessage(mockReq, mockRes, mockNext);

      expect(MockGetIO).toHaveBeenCalled();
      expect(MockChatService.sendMessage).toHaveBeenCalledWith(
        expect.any(Object),
        "session-123",
        "user",
        "Hello, I need help",
        "user-123",
        "valid-token"
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockMessage,
      });
    });
  });

  describe("markRead", () => {
    it("Kiểm tra đánh dấu tin nhắn đã đọc thành công", async () => {
      mockReq.params.id = "session-123";
      mockReq.body = {
        message_ids: ["msg-1", "msg-2", "msg-3"],
      };

      const mockResult = {
        updated: 3,
        message_ids: ["msg-1", "msg-2", "msg-3"],
      };

      (MockChatService.markMessagesAsRead as jest.Mock).mockResolvedValue(
        mockResult
      );

      await chatController.markRead(mockReq, mockRes, mockNext);

      expect(MockChatService.markMessagesAsRead).toHaveBeenCalledWith(
        "session-123",
        ["msg-1", "msg-2", "msg-3"]
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockResult,
      });
    });
  });

  describe("enableBotMode", () => {
    it("Kiểm tra bật bot mode thành công", async () => {
      mockReq.params.id = "session-123";

      const mockSession = {
        id: "session-123",
        bot_enabled: true,
      };

      (MockChatService.enableBot as jest.Mock).mockResolvedValue(mockSession);

      await chatController.enableBotMode(mockReq, mockRes, mockNext);

      expect(MockChatService.enableBot).toHaveBeenCalledWith("session-123");
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockSession,
      });
    });

    it("Kiểm tra trả về 404 khi không tìm thấy session", async () => {
      mockReq.params.id = "invalid-session";
      (MockChatService.enableBot as jest.Mock).mockResolvedValue(null);

      await chatController.enableBotMode(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Session not found",
      });
    });
  });

  describe("closeSessionById", () => {
    it("Kiểm tra đóng session thành công", async () => {
      mockReq.params.id = "session-123";

      const mockSession = {
        id: "session-123",
        status: "closed",
      };

      (MockChatService.closeChatSession as jest.Mock).mockResolvedValue(
        mockSession
      );

      await chatController.closeSessionById(mockReq, mockRes, mockNext);

      expect(MockChatService.closeChatSession).toHaveBeenCalledWith(
        "session-123"
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockSession,
      });
    });
  });
});
