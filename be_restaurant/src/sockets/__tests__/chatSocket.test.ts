import { Server } from "socket.io";
import { chatEvents } from "../chatSocket";
import { forwardToAdmin, forwardToCustomer, broadcastToAdmin } from "../index";

// Mock socket.io helpers
jest.mock("../index", () => ({
  forwardToAdmin: jest.fn(),
  forwardToCustomer: jest.fn(),
  broadcastToAdmin: jest.fn(),
}));

describe("Chat Socket Events", () => {
  let mockIO: Partial<Server>;
  let mockCustomerNsp: any;

  beforeEach(() => {
    // Mock customer namespace
    mockCustomerNsp = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };

    // Mock IO server
    mockIO = {
      of: jest.fn((namespace: string) => {
        if (namespace === "/customer") return mockCustomerNsp as any;
        return {} as any;
      }),
    } as any;

    jest.clearAllMocks();
  });

  describe("newChatSession", () => {
    it("Kiểm tra emit newChatSession event đến admin và customer", () => {
      const mockSession = {
        id: "session-123",
        user_id: "user-456",
        bot_enabled: true,
        status: "active",
        created_at: new Date().toISOString(),
      };

      chatEvents.newChatSession(mockIO as Server, mockSession);

      // Verify broadcast to admin
      expect(broadcastToAdmin).toHaveBeenCalledWith(
        mockIO,
        "admin:chat:session_new",
        expect.objectContaining({
          session: mockSession,
          timestamp: expect.any(String),
        })
      );

      // Verify forward to customer
      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        "user-456",
        "chat:session_new",
        expect.objectContaining({
          session: mockSession,
        })
      );
    });

    it("Kiểm tra newChatSession không forward đến customer nếu không có user_id", () => {
      const mockSession = {
        id: "session-123",
        bot_enabled: true,
        status: "active",
      };

      chatEvents.newChatSession(mockIO as Server, mockSession);

      expect(broadcastToAdmin).toHaveBeenCalled();
      expect(forwardToCustomer).not.toHaveBeenCalled();
    });
  });

  describe("sessionStatusChanged", () => {
    it("Kiểm tra emit sessionStatusChanged event khi status session thay đổi", () => {
      const sessionId = "session-123";
      const status = "closed";
      const userId = "user-456";

      chatEvents.sessionStatusChanged(
        mockIO as Server,
        sessionId,
        status,
        userId
      );

      expect(broadcastToAdmin).toHaveBeenCalledWith(
        mockIO,
        "admin:chat:session_status_changed",
        expect.objectContaining({
          sessionId,
          status,
        })
      );

      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        userId,
        "chat:session_status_changed",
        expect.objectContaining({
          sessionId,
          status,
        })
      );
    });

    it("Kiểm tra sessionStatusChanged không forward đến customer nếu không có userId", () => {
      const sessionId = "session-123";
      const status = "closed";

      chatEvents.sessionStatusChanged(mockIO as Server, sessionId, status);

      expect(broadcastToAdmin).toHaveBeenCalled();
      expect(forwardToCustomer).not.toHaveBeenCalled();
    });
  });

  describe("agentAssigned", () => {
    it("Kiểm tra emit agentAssigned event khi admin được assign vào session", () => {
      const sessionId = "session-123";
      const agentId = "admin-789";
      const userId = "user-456";

      chatEvents.agentAssigned(mockIO as Server, sessionId, agentId, userId);

      expect(broadcastToAdmin).toHaveBeenCalledWith(
        mockIO,
        "admin:chat:agent_assigned",
        expect.objectContaining({
          sessionId,
          agentId,
        })
      );

      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        userId,
        "chat:agent_assigned",
        expect.objectContaining({
          sessionId,
          agentId,
        })
      );
    });

    it("Kiểm tra agentAssigned không forward đến customer nếu không có userId", () => {
      const sessionId = "session-123";
      const agentId = "admin-789";

      chatEvents.agentAssigned(mockIO as Server, sessionId, agentId);

      expect(broadcastToAdmin).toHaveBeenCalled();
      expect(forwardToCustomer).not.toHaveBeenCalled();
    });
  });

  describe("botMessage", () => {
    it("Kiểm tra emit botMessage event khi bot gửi tin nhắn", () => {
      const customerId = "user-456";
      const mockMessage = {
        id: "message-123",
        session_id: "session-789",
        sender_type: "bot",
        message_text: "Xin chào! Tôi có thể giúp gì cho bạn?",
        timestamp: new Date().toISOString(),
      };

      chatEvents.botMessage(mockIO as Server, customerId, mockMessage);

      // Verify forward to customer
      expect(forwardToCustomer).toHaveBeenCalledWith(
        mockIO,
        customerId,
        "chat:new_message",
        mockMessage
      );

      // Verify broadcast to admin
      expect(broadcastToAdmin).toHaveBeenCalledWith(
        mockIO,
        "admin:chat:new_message",
        expect.objectContaining({
          sessionId: "session-789",
          message: mockMessage,
        })
      );
    });
  });
});
