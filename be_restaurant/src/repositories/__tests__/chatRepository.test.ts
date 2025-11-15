// Mock models before importing repository (which imports models/index.ts)
// Need to mock all models that might be imported through models/index.ts
jest.mock("../../models/ChatSession");
jest.mock("../../models/ChatMessage");
jest.mock("../../models/User");
jest.mock("../../models/Employee");
jest.mock("../../models/EmployeeShift");
jest.mock("../../models/index", () => {
  const User = require("../../models/User");
  return {
    User,
  };
});

import {
  createSession,
  getSessionsByUser,
  getMessagesBySession,
  addMessage,
  setBotEnabled,
  getSessionById,
} from "../chatRepository";
import ChatSession from "../../models/ChatSession";
import ChatMessage from "../../models/ChatMessage";
import User from "../../models/User";

const MockChatSession = ChatSession as jest.Mocked<typeof ChatSession>;
const MockChatMessage = ChatMessage as jest.Mocked<typeof ChatMessage>;

describe("ChatRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createSession", () => {
    it("Kiểm tra tạo session chat thành công", async () => {
      const mockSession = {
        id: "session-123",
        user_id: "user-123",
        channel: "web",
        status: "active",
        bot_enabled: true,
      };

      MockChatSession.findOne = jest.fn().mockResolvedValue(null);
      MockChatSession.create = jest.fn().mockResolvedValue(mockSession);

      const result = await createSession({
        userId: "user-123",
        channel: "web",
        botEnabled: true,
      });

      expect(MockChatSession.create).toHaveBeenCalled();
      expect(result).toEqual(mockSession);
    });

    it("Kiểm tra trả về session đã tồn tại nếu user đã có session active", async () => {
      const existingSession = {
        id: "session-123",
        user_id: "user-123",
        status: "active",
      };

      MockChatSession.findOne = jest.fn().mockResolvedValue(existingSession);

      const result = await createSession({
        userId: "user-123",
        channel: "web",
      });

      expect(MockChatSession.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingSession);
    });
  });

  describe("getSessionsByUser", () => {
    it("Kiểm tra lấy danh sách session của user thành công", async () => {
      const mockSessions = [
        {
          id: "session-1",
          user_id: "user-123",
          status: "active",
        },
        {
          id: "session-2",
          user_id: "user-123",
          status: "closed",
        },
      ];

      MockChatSession.findAndCountAll = jest.fn().mockResolvedValue({
        rows: mockSessions,
        count: 2,
      });

      const result = await getSessionsByUser("user-123", 1, 10);

      expect(MockChatSession.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: "user-123" },
        })
      );
      expect(result.rows).toEqual(mockSessions);
      expect(result.count).toBe(2);
    });
  });

  describe("getMessagesBySession", () => {
    it("Kiểm tra lấy danh sách tin nhắn thành công", async () => {
      const mockMessages = [
        {
          id: "message-1",
          session_id: "session-123",
          message_text: "Hello",
          sender_type: "user",
        },
        {
          id: "message-2",
          session_id: "session-123",
          message_text: "Hi there!",
          sender_type: "bot",
        },
      ];

      MockChatMessage.findAndCountAll = jest.fn().mockResolvedValue({
        rows: mockMessages,
        count: 2,
      });

      const result = await getMessagesBySession("session-123", 1, 50);

      expect(MockChatMessage.findAndCountAll).toHaveBeenCalled();
      expect(result.rows).toEqual(mockMessages);
      expect(result.count).toBe(2);
    });
  });

  describe("addMessage", () => {
    it("Kiểm tra thêm tin nhắn thành công", async () => {
      const mockMessage = {
        id: "message-123",
        session_id: "session-123",
        message_text: "Hello",
        sender_type: "user",
      };

      MockChatMessage.create = jest.fn().mockResolvedValue(mockMessage);

      const result = await addMessage({
        sessionId: "session-123",
        messageText: "Hello",
        senderType: "user",
      });

      expect(MockChatMessage.create).toHaveBeenCalled();
      expect(result).toEqual(mockMessage);
    });
  });

  describe("setBotEnabled", () => {
    it("Kiểm tra bật/tắt bot mode thành công", async () => {
      const mockSession = {
        id: "session-123",
        bot_enabled: false,
        set: jest.fn().mockReturnThis(),
        save: jest.fn().mockResolvedValue(undefined),
      };

      MockChatSession.findByPk = jest.fn().mockResolvedValue(mockSession);

      const result = await setBotEnabled("session-123", true);

      expect(mockSession.set).toHaveBeenCalledWith("bot_enabled", true);
      expect(mockSession.set).toHaveBeenCalledWith("handled_by", "bot");
      expect(mockSession.save).toHaveBeenCalled();
      expect(result).toEqual(mockSession);
    });
  });

  describe("getSessionById", () => {
    it("Kiểm tra lấy session theo ID thành công", async () => {
      const mockSession = {
        id: "session-123",
        user_id: "user-123",
        status: "active",
      };

      MockChatSession.findByPk = jest.fn().mockResolvedValue(mockSession);

      const result = await getSessionById("session-123");

      expect(MockChatSession.findByPk).toHaveBeenCalledWith("session-123");
      expect(result).toEqual(mockSession);
    });
  });
});
