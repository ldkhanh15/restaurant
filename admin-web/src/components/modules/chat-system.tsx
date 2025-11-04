"use client";

import type React from "react";

import { useEffect, useState, useRef } from "react";
import {
  chatService,
  type ChatSession,
  type ChatMessage,
} from "@/services/chatService";
import { useAuthStore } from "@/store/authStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatSessionDetails } from "./chat-session-details";
import { ChatStats } from "./chat-stats";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { MessageSquare, Send, Loader2 } from "lucide-react";

interface ExtendedChatSession extends ChatSession {
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  last_message: string;
  unread_count: number;
  assigned_agent?: string;
  customer_history?: {
    total_orders: number;
    last_order_date?: string;
    favorite_dishes?: string[];
    avg_rating: number;
  };
  tags?: string[];
  priority: "low" | "normal" | "high" | "urgent";
}

interface ExtendedChatMessage extends ChatMessage {
  sender_name: string;
  sent_at: string;
  read_at?: string;
  message_type: "text" | "image" | "file" | "quick_reply" | "template";
  attachments?: string[];
  metadata?: {
    template_id?: string;
    quick_reply_options?: string[];
    file_name?: string;
    file_size?: number;
  };
}

const quickResponses = [
  "Xin chào! Tôi có thể giúp gì cho bạn?",
  "Cảm ơn bạn đã liên hệ. Tôi sẽ hỗ trợ ngay.",
  "Vui lòng chờ trong giây lát, tôi đang kiểm tra thông tin.",
  "Bạn có thể cung cấp thêm thông tin chi tiết không?",
  "Cảm ơn bạn đã phản hồi. Chúng tôi sẽ xử lý ngay.",
  "Bạn còn cần hỗ trợ gì khác không?",
  "Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!",
];

const messageTemplates = [
  {
    id: "greeting",
    name: "Chào hỏi",
    content:
      "Xin chào {customer_name}! Cảm ơn bạn đã liên hệ với nhà hàng. Tôi có thể giúp gì cho bạn?",
  },
  {
    id: "reservation_confirm",
    name: "Xác nhận đặt bàn",
    content:
      "Đặt bàn thành công cho {guest_count} người vào {date} lúc {time}. Mã đặt bàn: {booking_id}",
  },
  {
    id: "menu_info",
    name: "Thông tin thực đơn",
    content:
      "Thực đơn của chúng tôi có nhiều món đặc sản Việt Nam. Bạn có thể xem chi tiết tại website hoặc tôi có thể gợi ý một số món phổ biến.",
  },
  {
    id: "order_status",
    name: "Trạng thái đơn hàng",
    content:
      "Đơn hàng #{order_id} của bạn đang được chuẩn bị. Thời gian dự kiến: {estimated_time} phút.",
  },
];

export function ChatSystem() {
  const { user } = useAuthStore();

  const {
    isConnected,
    sessions,
    setSessions,
    messages,
    setMessages,
    sendMessage: sendWebSocketMessage,
    onMessageReceived,
    onTypingStart,
    onTypingEnd,
    onMessagesRead,
    onSessionNew,
    onSessionStatusChanged,
    onAgentAssigned,
    onMessageEdit,
    onMessageDelete,
    joinSession,
    leaveSession,
    startTyping: emitStartTyping,
    stopTyping: emitStopTyping,
    markMessagesAsRead,
  } = useChatWebSocket();

  // Get socket for ACK handling
  const { adminSocket, customerSocket } = useWebSocket();
  const socket =
    user?.role === "admin" || user?.role === "staff"
      ? adminSocket
      : customerSocket;

  const [selectedSession, setSelectedSession] =
    useState<ExtendedChatSession | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{
    [userId: string]: {
      isTyping: boolean;
      isAdmin?: boolean;
      isCustomer?: boolean;
    };
  }>({});
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [sessionsPageSize] = useState(20);
  const [sessionsTotalPages, setSessionsTotalPages] = useState(1);
  const [sessionsTotalItems, setSessionsTotalItems] = useState(0);

  // Load sessions on mount and when filters change
  useEffect(() => {
    loadSessions();
  }, [sessionsPage, statusFilter, searchTerm]);

  // Load messages when session is selected
  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession.id);
      joinSession(selectedSession.id);
    }
    return () => {
      if (selectedSession) {
        leaveSession(selectedSession.id);
      }
    };
  }, [selectedSession?.id]);

  const sessionMessages = messages.filter(
    (msg) =>
      (msg as any).session_id === selectedSession?.id ||
      (msg as any).sessionId === selectedSession?.id
  );

  // Auto-scroll to bottom when new messages arrive (only if user is near bottom)
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  useEffect(() => {
    const scrollArea = document.getElementById("chat-messages-scroll");
    if (!scrollArea) return;

    const scrollElement = scrollArea.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } =
        scrollElement as HTMLElement;
      // Consider "near bottom" if within 100px of bottom
      setIsNearBottom(scrollHeight - scrollTop - clientHeight < 100);
    };

    scrollElement.addEventListener("scroll", handleScroll);

    // Auto-scroll only if user is near bottom
    if (isNearBottom && sessionMessages.length > 0) {
      setTimeout(() => {
        const viewport = scrollArea.querySelector(
          "[data-radix-scroll-area-viewport]"
        ) as HTMLElement;
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
        // Also scroll to messagesEndRef
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
    };
  }, [sessionMessages.length, selectedSession?.id, isNearBottom]);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const response = await chatService.getAllSessions({
        page: sessionsPage,
        limit: sessionsPageSize,
        status: statusFilter !== "all" ? statusFilter : undefined,
        customer_name: searchTerm || undefined,
        sort_by: "last_message",
        sort_order: "DESC",
      });
      if (response?.data) {
        const sessionsData = Array.isArray(response.data)
          ? response.data
          : response.data.data || response.data.items || [];

        const extendedSessions: ExtendedChatSession[] = sessionsData.map(
          (session: ChatSession) => ({
            ...session,
            customer_name:
              session.user?.full_name || session.user?.username || "Khách hàng",
            customer_phone: session.user?.phone,
            customer_email: session.user?.email,
            last_message: "",
            unread_count: 0,
            priority: "normal" as const,
          })
        );
        setSessions(extendedSessions as any);

        // Handle pagination if available
        const responseData = response as any;
        if (responseData.pagination) {
          setSessionsTotalPages(responseData.pagination.totalPages || 1);
          setSessionsTotalItems(
            responseData.pagination.total || sessionsData.length
          );
        } else if (responseData.data?.pagination) {
          setSessionsTotalPages(responseData.data.pagination.totalPages || 1);
          setSessionsTotalItems(
            responseData.data.pagination.total || sessionsData.length
          );
        }
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await chatService.getMessages(sessionId, {
        page: 1,
        limit: 100,
      });
      if (response?.data) {
        const messagesData = Array.isArray(response.data)
          ? response.data
          : response.data.data || [];
        const sessionMessages = messages.filter(
          (m) =>
            (m as any).session_id !== sessionId &&
            (m as any).sessionId !== sessionId
        );
        setMessages([...sessionMessages, ...messagesData] as any);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendMessage = async (
    messageText?: string,
    messageType: "text" | "template" = "text"
  ) => {
    const textToSend = messageText || newMessage;
    if (!textToSend.trim() || !selectedSession) return;

    try {
      // Optimistic update - add message immediately
      const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticMessage: ExtendedChatMessage = {
        id: tempMessageId,
        session_id: selectedSession.id,
        sender_type: "human",
        sender_id: user?.id || "",
        message_text: textToSend,
        timestamp: new Date().toISOString(),
        sender_name: user?.username || "Bạn",
        sent_at: new Date().toISOString(),
        message_type: messageType,
        read_at: undefined,
      };

      // Add optimistic message to UI
      setMessages((prev) => [...prev, optimisticMessage] as any);

      // Update session last message
      setSessions((prev) =>
        prev.map((session) =>
          session.id === selectedSession.id
            ? { ...session, last_message: textToSend }
            : session
        )
      );

      // Clear input
      setNewMessage("");
      setShowQuickResponses(false);
      setShowTemplates(false);

      // Clear typing timeout and stop typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      if (isConnected && socket) {
        emitStopTyping(selectedSession.id);

        // Send via WebSocket
        const clientMessageId = sendWebSocketMessage(
          selectedSession.id,
          textToSend,
          messageType as any
        );

        console.log("📤 Sent message via WebSocket:", {
          clientMessageId,
          sessionId: selectedSession.id,
          text: textToSend.substring(0, 50),
          tempMessageId,
        });

        // Listen for ACK to update message ID
        if (socket) {
          const ackHandler = (ack: any) => {
            console.log("📥 Received ACK:", ack);
            if (
              ack.clientMessageId === clientMessageId ||
              ack.clientMessageId === tempMessageId
            ) {
              if (ack.status === "saved" && ack.serverMessageId) {
                console.log("✅ Message saved:", ack.serverMessageId);
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === tempMessageId
                      ? { ...msg, id: ack.serverMessageId }
                      : msg
                  )
                );
                socket.off("chat:message_ack", ackHandler);
              } else if (ack.status === "failed") {
                // Remove failed message
                console.error("❌ Failed to send message:", ack.error);
                setMessages((prev) =>
                  prev.filter((msg) => msg.id !== tempMessageId)
                );
                socket.off("chat:message_ack", ackHandler);
              }
            }
          };
          socket.on("chat:message_ack", ackHandler);

          // Cleanup ack handler after 10 seconds to prevent memory leaks
          setTimeout(() => {
            socket.off("chat:message_ack", ackHandler);
          }, 10000);
        }
      } else {
        // Fallback to API if WebSocket is not connected
        try {
          await chatService.sendMessage(selectedSession.id, {
            message_text: textToSend,
            sender_type: "human",
          });
          // Replace temp message with real data
          await loadMessages(selectedSession.id);
        } catch (apiError) {
          // Remove failed optimistic message
          setMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId));
          console.error("Failed to send message via API:", apiError);
          throw apiError;
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  useEffect(() => {
    onMessageReceived((message) => {
      // Convert ChatMessage from hook to ExtendedChatMessage
      const extendedMessage: ExtendedChatMessage = {
        id: message.id,
        session_id: message.sessionId,
        sender_type:
          message.senderId === user?.id
            ? "human"
            : message.senderId
            ? "user"
            : "bot",
        sender_id: message.senderId,
        message_text: message.content,
        timestamp: message.timestamp.toISOString(),
        sender_name:
          message.senderId === user?.id
            ? "Bạn"
            : message.senderId
            ? "Khách hàng"
            : "Bot",
        sent_at: message.timestamp.toISOString(),
        message_type: message.type || "text",
        read_at:
          message.status === "read" ? new Date().toISOString() : undefined,
      };

      // Check if message already exists (avoid duplicates)
      setMessages((prev) => {
        const exists = prev.find((msg) => msg.id === message.id);
        if (exists) return prev;
        return [...prev, extendedMessage] as any;
      });

      setSessions((prev) =>
        prev.map((session) =>
          session.id === message.sessionId ||
          session.id === extendedMessage.session_id
            ? { ...session, last_message: message.content }
            : session
        )
      );
    });

    onTypingStart(({ userId, sessionId, isAdmin, isCustomer }) => {
      if (selectedSession?.id === sessionId) {
        setTypingUsers((prev) => ({
          ...prev,
          [userId]: {
            isTyping: true,
            isAdmin: isAdmin || false,
            isCustomer: isCustomer || false,
          },
        }));
      }
    });

    onTypingEnd(({ userId, sessionId }) => {
      if (selectedSession?.id === sessionId) {
        setTypingUsers((prev) => {
          const newState = { ...prev };
          delete newState[userId];
          return newState;
        });
      }
    });

    onMessagesRead(({ userId, sessionId, messageIds }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg.id)
            ? { ...msg, read_at: new Date().toISOString() }
            : msg
        )
      );
    });

    // Session events
    onSessionNew((session) => {
      setSessions((prev) => {
        // Check if session already exists
        const exists = prev.find((s) => s.id === session.id);
        if (exists) return prev;
        return [session, ...prev];
      });
    });

    onSessionStatusChanged(({ sessionId, status }) => {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? { ...session, status: status as any }
            : session
        )
      );
      // If current session status changed, update selected session
      if (selectedSession?.id === sessionId) {
        setSelectedSession((prev) =>
          prev ? { ...prev, status: status as any } : prev
        );
      }
    });

    onAgentAssigned(({ sessionId, agentId }) => {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? { ...session, assigned_agent: agentId }
            : session
        )
      );
    });

    // Message edit/delete
    onMessageEdit(({ sessionId, messageId, text }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId && msg.sessionId === sessionId
            ? { ...msg, message_text: text, content: text }
            : msg
        )
      );
    });

    onMessageDelete(({ sessionId, messageId }) => {
      setMessages((prev) =>
        prev.filter(
          (msg) => !(msg.id === messageId && msg.sessionId === sessionId)
        )
      );
    });
  }, [
    selectedSession?.id,
    onMessageReceived,
    onTypingStart,
    onTypingEnd,
    onMessagesRead,
    onSessionNew,
    onSessionStatusChanged,
    onAgentAssigned,
    onMessageEdit,
    onMessageDelete,
  ]);

  // Debounce typing indicator to avoid spam
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (selectedSession && isConnected) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (e.target.value.trim()) {
        emitStartTyping(selectedSession.id);
        // Auto stop typing after 3 seconds of no input
        typingTimeoutRef.current = setTimeout(() => {
          emitStopTyping(selectedSession.id);
        }, 3000);
      } else {
        emitStopTyping(selectedSession.id);
      }
    }
  };

  useEffect(() => {
    if (selectedSession && messages.length > 0) {
      const unreadMessages = messages
        .filter(
          (msg) => !(msg as any).read_at && (msg as any).senderId !== user?.id
        )
        .map((msg) => msg.id);

      if (unreadMessages.length > 0) {
        markMessagesAsRead(selectedSession.id, unreadMessages);
      }
    }
  }, [selectedSession, messages, markMessagesAsRead, user?.id]);

  // Remove client-side filtering since it's handled by backend
  // But keep for backward compatibility with local state
  const filteredSessions = sessions;

  // Sessions are already sorted by backend (last_message DESC)
  // Only sort by priority and unread if needed
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    const priorityOrder: Record<string, number> = {
      urgent: 4,
      high: 3,
      normal: 2,
      low: 1,
    };
    const aPriority = (a as any).priority || "normal";
    const bPriority = (b as any).priority || "normal";
    if (aPriority !== bPriority) {
      return (priorityOrder[bPriority] || 2) - (priorityOrder[aPriority] || 2);
    }
    const aUnread = (a as any).unread_count || 0;
    const bUnread = (b as any).unread_count || 0;
    return bUnread - aUnread;
  });

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case "web":
        return <Badge className="bg-blue-100 text-blue-800">Website</Badge>;
      case "app":
        return <Badge className="bg-green-100 text-green-800">App</Badge>;
      case "zalo":
        return <Badge className="bg-purple-100 text-purple-800">Zalo</Badge>;
      case "facebook":
        return (
          <Badge className="bg-indigo-100 text-indigo-800">Facebook</Badge>
        );
      default:
        return <Badge variant="outline">{channel}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Đang chat</Badge>;
      case "closed":
        return <Badge className="bg-gray-100 text-gray-800">Đã đóng</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge className="bg-red-100 text-red-800">Khẩn cấp</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800">Cao</Badge>;
      case "normal":
        return <Badge className="bg-blue-100 text-blue-800">Bình thường</Badge>;
      case "low":
        return <Badge className="bg-gray-100 text-gray-800">Thấp</Badge>;
      default:
        return null;
    }
  };

  const closeSession = async (sessionId: string) => {
    try {
      await chatService.closeSession(sessionId);
      setSessions(
        sessions.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                status: "closed" as any,
                updated_at: new Date().toISOString(),
              }
            : session
        )
      );
    } catch (error) {
      console.error("Failed to close session:", error);
    }
  };

  const activeSessions = sessions.filter((s) => s.status === "active").length;
  const closedSessions = sessions.filter((s) => s.status === "closed").length;
  const totalUnread = sessions.reduce(
    (sum, s) => sum + ((s as any).unread_count || 0),
    0
  );

  return (
    <div className="space-y-6">
      <ChatStats sessions={sessions as any} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-280px)] min-h-[700px]">
        <Card className="lg:col-span-1 flex flex-col shadow-lg border-amber-100 bg-gradient-to-b from-white to-amber-50/30">
          <CardHeader className="pb-3 border-b border-amber-200 bg-white">
            <div className="flex justify-between items-center mb-3">
              <CardTitle className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-amber-600" />
                Danh sách hội thoại
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200">
                  <div
                    className={`w-2 h-2 rounded-full transition-all ${
                      isConnected
                        ? "bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500"
                        : "bg-red-500"
                    }`}
                    title={
                      isConnected
                        ? "WebSocket đã kết nối"
                        : "WebSocket mất kết nối"
                    }
                  ></div>
                  <span
                    className={`text-xs font-medium transition-colors ${
                      isConnected ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {isConnected ? "Trực tuyến" : "Ngoại tuyến"}
                  </span>
                </div>
                {isConnected && (
                  <div className="text-xs text-muted-foreground">
                    {sessions.length} phiên
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 text-sm">
                  🔍
                </span>
                <Input
                  placeholder="Tìm kiếm khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 border-amber-200 focus-visible:ring-amber-500 bg-white"
                />
              </div>
            </div>
            <Tabs
              value={statusFilter}
              onValueChange={setStatusFilter}
              className="w-full mt-3"
            >
              <TabsList className="grid w-full grid-cols-3 bg-amber-50 border border-amber-200">
                <TabsTrigger
                  value="all"
                  className="text-xs data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-sm"
                >
                  <span className="flex items-center gap-1">
                    Tất cả
                    {sortedSessions.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 h-4 px-1 text-xs bg-amber-200"
                      >
                        {sortedSessions.length}
                      </Badge>
                    )}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className="text-xs data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-sm"
                >
                  <span className="flex items-center gap-1">
                    Đang chat
                    {activeSessions > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 h-4 px-1 text-xs bg-emerald-500 text-white"
                      >
                        {activeSessions}
                      </Badge>
                    )}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="closed"
                  className="text-xs data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-sm"
                >
                  Đã đóng
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-2 p-3">
                {sortedSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                      selectedSession?.id === session.id
                        ? "bg-amber-50 border-amber-300 shadow-md transform scale-[1.02]"
                        : "bg-white border-amber-100 hover:bg-amber-50/50 hover:border-amber-200 hover:shadow-sm"
                    }`}
                    onClick={() => {
                      setSelectedSession(session as any);
                      joinSession(session.id);
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="relative">
                          <Avatar className="h-10 w-10 border-2 border-amber-200 shadow-sm">
                            <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-amber-100 to-amber-200 text-amber-900">
                              {((session as any).customer_name || "U")
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {session.status === "active" && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {(session as any).customer_name || "Unknown"}
                          </p>
                          <div className="flex gap-1 flex-wrap mt-1">
                            {getChannelBadge((session as any).channel || "web")}
                            {getStatusBadge(session.status)}
                            {getPriorityBadge(
                              (session as any).priority || "normal"
                            )}
                            {(session as any).bot_enabled && (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                🤖 Bot
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {(session as any).unread_count > 0 && (
                        <Badge className="bg-red-500 text-white text-xs font-bold px-2 shadow-sm">
                          {(session as any).unread_count}
                        </Badge>
                      )}
                    </div>

                    {(session as any).tags &&
                      (session as any).tags.length > 0 && (
                        <div className="flex gap-1 mb-2">
                          {(session as any).tags.map(
                            (tag: string, index: number) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            )
                          )}
                        </div>
                      )}

                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                      {(session as any).last_message || ""}
                    </p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>
                        {new Date(
                          (session as any).start_time ||
                            (session as any).created_at ||
                            new Date()
                        ).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {(session as any).assigned_agent && (
                        <span>{(session as any).assigned_agent}</span>
                      )}
                    </div>
                  </div>
                ))}
                {isLoadingSessions && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mb-2 text-amber-600" />
                    <p className="text-sm">Đang tải danh sách...</p>
                  </div>
                )}
                {!isLoadingSessions && sortedSessions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mb-3 text-gray-300" />
                    <p className="text-sm">Chưa có hội thoại nào</p>
                    {!isConnected && (
                      <p className="text-xs mt-2 text-red-500">
                        ⚠️ WebSocket chưa kết nối
                      </p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
            {sessionsTotalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-xs text-muted-foreground">
                  {sessionsTotalItems > 0
                    ? `Tổng ${sessionsTotalItems} phiên`
                    : ""}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSessionsPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={sessionsPage === 1 || isLoadingSessions}
                    className="h-7 text-xs"
                  >
                    ← Trước
                  </Button>
                  <div className="flex items-center gap-1 text-xs">
                    <span>Trang</span>
                    <span className="font-medium">{sessionsPage}</span>
                    <span>/{sessionsTotalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSessionsPage((prev) =>
                        Math.min(prev + 1, sessionsTotalPages)
                      )
                    }
                    disabled={
                      sessionsPage === sessionsTotalPages || isLoadingSessions
                    }
                    className="h-7 text-xs"
                  >
                    Sau →
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-lg border-amber-100 flex flex-col">
          {selectedSession ? (
            <>
              <CardHeader className="pb-4 border-b border-amber-200 bg-gradient-to-r from-amber-50/50 to-white">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-amber-300 shadow">
                      <AvatarFallback className="text-base font-bold bg-gradient-to-br from-amber-100 to-amber-200 text-amber-900">
                        {((selectedSession as any).customer_name || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">
                        {(selectedSession as any).customer_name || "Unknown"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 flex-wrap mt-1">
                        {getChannelBadge(
                          (selectedSession as any).channel || "web"
                        )}
                        {getStatusBadge(selectedSession.status)}
                        {getPriorityBadge(
                          (selectedSession as any).priority || "normal"
                        )}
                        {(selectedSession as any).customer_phone && (
                          <span className="text-amber-700 font-medium">
                            • {(selectedSession as any).customer_phone}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCustomerInfo(!showCustomerInfo)}
                    >
                      Thông tin KH
                    </Button>
                    {(selectedSession as any).bot_enabled ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await chatService.disableBot(selectedSession.id);
                            setSessions(
                              sessions.map((s) =>
                                s.id === selectedSession.id
                                  ? ({ ...s, bot_enabled: false } as any)
                                  : s
                              )
                            );
                          } catch (err) {
                            console.error("Failed to disable bot:", err);
                          }
                        }}
                        className="border-red-300 hover:bg-red-50"
                      >
                        ❌ Tắt Bot
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await chatService.enableBot(selectedSession.id);
                            setSessions(
                              sessions.map((s) =>
                                s.id === selectedSession.id
                                  ? ({ ...s, bot_enabled: true } as any)
                                  : s
                              )
                            );
                          } catch (err) {
                            console.error("Failed to enable bot:", err);
                          }
                        }}
                        className="border-green-300 hover:bg-green-50"
                      >
                        ✅ Bật Bot
                      </Button>
                    )}
                    {selectedSession.status === "active" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => closeSession(selectedSession.id)}
                        className="border-orange-300 hover:bg-orange-50"
                      >
                        🔒 Đóng chat
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await chatService.reopenSession(selectedSession.id);
                            setSessions(
                              sessions.map((s) =>
                                s.id === selectedSession.id
                                  ? { ...s, status: "active" as any }
                                  : s
                              )
                            );
                          } catch (err) {
                            console.error("Failed to reopen session:", err);
                          }
                        }}
                        className="border-green-300 hover:bg-green-50"
                      >
                        🔓 Mở lại
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col h-[550px]">
                <ScrollArea
                  className="flex-1 p-4 overflow-y-auto"
                  id="chat-messages-scroll"
                >
                  <div className="space-y-4 pb-2">
                    {isLoadingMessages ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin mb-3 text-amber-600" />
                        <p className="text-sm">Đang tải tin nhắn...</p>
                      </div>
                    ) : sessionMessages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">Chưa có tin nhắn nào</p>
                          <p className="text-xs mt-2 text-gray-400">
                            Bắt đầu trò chuyện với khách hàng
                          </p>
                        </div>
                      </div>
                    ) : (
                      sessionMessages.map((message) => {
                        const isOwnMessage =
                          (message as any).sender_type === "human";
                        const messageDate = new Date(
                          (message as any).sent_at || (message as any).timestamp
                        );
                        const isRecent =
                          Date.now() - messageDate.getTime() < 60000; // Less than 1 minute

                        return (
                          <div
                            key={message.id}
                            className={`flex gap-3 items-end group ${
                              isOwnMessage ? "justify-end" : "justify-start"
                            }`}
                          >
                            {!isOwnMessage && (
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarFallback className="text-xs bg-muted">
                                  {(message as any).sender_type === "bot"
                                    ? "🤖"
                                    : (
                                        selectedSession as any
                                      )?.customer_name?.charAt(0) || "👤"}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={`max-w-[70%] min-w-0 rounded-2xl px-4 py-2.5 ${
                                isOwnMessage
                                  ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-br-sm shadow-md"
                                  : (message as any).sender_type === "bot"
                                  ? "bg-blue-50 border border-blue-200 text-gray-800"
                                  : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed overflow-wrap-anywhere word-break-break-word">
                                {(message as any).message_text ||
                                  (message as any).content}
                              </p>
                              <div
                                className={`flex items-center gap-1.5 mt-1.5 ${
                                  isOwnMessage ? "justify-end" : "justify-start"
                                }`}
                              >
                                <span
                                  className={`text-xs font-medium ${
                                    isOwnMessage
                                      ? "text-amber-100"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {isRecent
                                    ? `${Math.floor(
                                        (Date.now() - messageDate.getTime()) /
                                          1000
                                      )}s trước`
                                    : messageDate.toLocaleTimeString("vi-VN", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                </span>
                                {(message as any).read_at && isOwnMessage && (
                                  <span className="text-xs text-amber-100">
                                    ✓✓
                                  </span>
                                )}
                              </div>
                            </div>
                            {isOwnMessage && (
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarFallback className="text-xs bg-primary/20">
                                  {user?.username?.charAt(0) || "A"}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} className="h-1" />

                    {Object.keys(typingUsers).length > 0 && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3 max-w-[70%]">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {(() => {
                                const typingEntries =
                                  Object.entries(typingUsers);
                                const adminTyping = typingEntries.some(
                                  ([_, info]) => (info as any).isAdmin
                                );
                                const customerTyping = typingEntries.some(
                                  ([_, info]) => (info as any).isCustomer
                                );

                                if (typingEntries.length === 1) {
                                  if (adminTyping)
                                    return "Quản trị viên đang nhập...";
                                  if (customerTyping)
                                    return "Khách hàng đang nhập...";
                                  return "Đang nhập...";
                                }
                                return `${typingEntries.length} người đang nhập...`;
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                {selectedSession.status === "active" && (
                  <div className="p-4 border-t border-amber-200 bg-gradient-to-b from-white to-amber-50/30 space-y-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setShowQuickResponses(!showQuickResponses)
                        }
                        className="border-amber-300 hover:bg-amber-50 hover:text-amber-900"
                      >
                        ⚡ Phản hồi nhanh
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="border-amber-300 hover:bg-amber-50 hover:text-amber-900"
                      >
                        📝 Mẫu tin nhắn
                      </Button>
                    </div>

                    {showQuickResponses && (
                      <div className="grid grid-cols-2 gap-1 p-2 bg-gray-50 rounded">
                        {quickResponses.map((response, index) => (
                          <button
                            key={index}
                            className="text-left p-2 text-xs hover:bg-white rounded"
                            onClick={() => sendMessage(response)}
                          >
                            {response}
                          </button>
                        ))}
                      </div>
                    )}

                    {showTemplates && (
                      <div className="space-y-1 p-2 bg-gray-50 rounded max-h-32 overflow-y-auto">
                        {messageTemplates.map((template) => (
                          <button
                            key={template.id}
                            className="w-full text-left p-2 text-xs hover:bg-white rounded"
                            onClick={() =>
                              sendMessage(template.content, "template")
                            }
                          >
                            <div className="font-medium">{template.name}</div>
                            <div className="text-gray-600 truncate">
                              {template.content}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-3 items-end">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter để xuống dòng)"
                          value={newMessage}
                          onChange={handleInputChange}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              if (newMessage.trim()) {
                                sendMessage();
                              }
                            }
                          }}
                          className="pr-12 h-11 border-amber-300 focus-visible:ring-amber-500 bg-white shadow-sm"
                        />
                        {newMessage.trim() && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-amber-100"
                            onClick={() => setNewMessage("")}
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                      <Button
                        onClick={() => sendMessage()}
                        disabled={!newMessage.trim() || isLoadingMessages}
                        size="lg"
                        className="px-5 h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md"
                      >
                        {isLoadingMessages ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <span className="mr-2 font-medium">Gửi</span>
                            <Send className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <span className="text-4xl mb-4 block">💬</span>
                <p className="text-muted-foreground">
                  Chọn một cuộc trò chuyện để bắt đầu
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {selectedSession && showCustomerInfo && (
          <ChatSessionDetails
            session={selectedSession}
            onCloseSession={() => closeSession(selectedSession.id)}
            onReopenSession={() => {
              setSessions(
                sessions.map((session) =>
                  session.id === selectedSession.id
                    ? {
                        ...session,
                        status: "active" as any,
                        updated_at: new Date().toISOString(),
                      }
                    : session
                )
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
