import {
  createChatSession,
  listUserSessions,
  listMessages,
  sendMessage,
  enableBot,
  disableBot,
} from "../chatService";
import * as chatRepository from "../../repositories/chatRepository";
import { getIO } from "../../sockets";

// Mock dependencies
jest.mock("../../repositories/chatRepository", () => ({
  createSession: jest.fn(),
  getSessionsByUser: jest.fn(),
  getMessagesBySession: jest.fn(),
  addMessage: jest.fn(),
  setBotEnabled: jest.fn(),
  getSessionById: jest.fn(),
}));
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

const MockChatRepository = chatRepository as jest.Mocked<typeof chatRepository>;

describe("ChatService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createChatSession", () => {
    it("Kiểm tra tạo session chat thành công", async () => {
      const mockSession = {
        id: "session-123",
        user_id: "user-123",
        channel: "web",
        bot_enabled: true,
        status: "active",
      };

      (MockChatRepository.createSession as jest.Mock).mockResolvedValue(
        mockSession
      );

      const result = await createChatSession("user-123", "web", {}, true);

      expect(MockChatRepository.createSession).toHaveBeenCalledWith({
        userId: "user-123",
        channel: "web",
        context: {},
        botEnabled: true,
      });
      expect(result).toEqual(mockSession);
    });
  });

  describe("listUserSessions", () => {
    it("Kiểm tra lấy danh sách session của user thành công", async () => {
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

      (MockChatRepository.getSessionsByUser as jest.Mock).mockResolvedValue(
        mockSessions
      );

      const result = await listUserSessions("user-123", 1, 10);

      expect(MockChatRepository.getSessionsByUser).toHaveBeenCalledWith(
        "user-123",
        1,
        10
      );
      expect(result).toEqual(mockSessions);
    });
  });

  describe("listMessages", () => {
    it("Kiểm tra lấy danh sách tin nhắn thành công", async () => {
      const mockMessages = {
        rows: [
          {
            id: "message-1",
            session_id: "session-123",
            message_text: "Hello",
            sender_type: "user",
          },
        ],
        count: 1,
      };

      (MockChatRepository.getMessagesBySession as jest.Mock).mockResolvedValue(
        mockMessages
      );

      const result = await listMessages("session-123", 1, 50);

      expect(MockChatRepository.getMessagesBySession).toHaveBeenCalledWith(
        "session-123",
        1,
        50
      );
      expect(result).toEqual(mockMessages);
    });
  });

  describe("sendMessage", () => {
    it("Kiểm tra gửi tin nhắn thành công", async () => {
      const mockMessage = {
        id: "message-123",
        session_id: "session-123",
        message_text: "Hello",
        sender_type: "user",
      };

      const mockSession = {
        id: "session-123",
        user_id: "user-123",
        get: jest.fn().mockReturnValue("user-123"),
      };

      const mockIO = getIO();

      (MockChatRepository.addMessage as jest.Mock).mockResolvedValue(
        mockMessage
      );
      (MockChatRepository.getSessionById as jest.Mock).mockResolvedValue(
        mockSession
      );

      const result = await sendMessage(
        mockIO as any,
        "session-123",
        "user",
        "Hello",
        "user-123"
      );

      expect(MockChatRepository.addMessage).toHaveBeenCalled();
      expect(result).toEqual(mockMessage);
    });
  });

  describe("enableBot", () => {
    it("Kiểm tra bật bot mode thành công", async () => {
      const mockSession = {
        id: "session-123",
        bot_enabled: true,
      };

      (MockChatRepository.setBotEnabled as jest.Mock).mockResolvedValue(
        mockSession
      );

      const result = await enableBot("session-123");

      expect(MockChatRepository.setBotEnabled).toHaveBeenCalledWith(
        "session-123",
        true
      );
      expect(result).toEqual(mockSession);
    });
  });

  describe("disableBot", () => {
    it("Kiểm tra tắt bot mode thành công", async () => {
      const mockSession = {
        id: "session-123",
        bot_enabled: false,
      };

      (MockChatRepository.setBotEnabled as jest.Mock).mockResolvedValue(
        mockSession
      );

      const result = await disableBot("session-123");

      expect(MockChatRepository.setBotEnabled).toHaveBeenCalledWith(
        "session-123",
        false
      );
      expect(result).toEqual(mockSession);
    });
  });
});
