"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";
import { chatService } from "@/services/chatService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Minimize2,
  Maximize2,
  Settings,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatMessage {
  id: string;
  sender_type: "user" | "bot" | "human";
  message_text: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  status: "active" | "closed";
  bot_enabled?: boolean;
}

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
}

export default function ChatWidget({
  isOpen,
  onClose,
  onMinimize,
  isMinimized,
}: ChatWidgetProps) {
  const { user, token } = useAuth();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Use WebSocket hook
  const {
    isConnected,
    sendMessage: sendWebSocketMessage,
    onMessageReceived,
    onTypingStart,
    onTypingEnd,
    joinSession,
    leaveSession,
    startTyping,
    stopTyping,
  } = useChatWebSocket();

  // Initialize session when widget opens
  useEffect(() => {
    if (!isOpen || !token) return;

    const initSession = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await chatService.getActiveUserSession();
        if (response?.data) {
          const sessionData = response.data as ChatSession;
          setSession(sessionData);
          if (sessionData?.id) {
            await loadMessages(sessionData.id);
          }
        }
      } catch (err: any) {
        console.error("Failed to init session:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Không thể khởi tạo phiên chat"
        );
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, [isOpen, token]);

  // Setup WebSocket message handlers
  useEffect(() => {
    if (!session?.id) return;

    // Join session when connected
    if (isConnected) {
      joinSession(session.id);
    }

    // Listen for new messages
    const handleMessage = (message: any) => {
      const newMsg: ChatMessage = {
        id: message.id,
        sender_type:
          message.senderId === user?.id
            ? "user"
            : message.senderId
            ? "human"
            : "bot",
        message_text: message.content,
        timestamp: message.timestamp?.toISOString() || new Date().toISOString(),
      };
      setMessages((prev) => {
        if (prev.find((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    };

    onMessageReceived(handleMessage);

    // Handle typing indicators
    onTypingStart(({ userId, sessionId }) => {
      if (sessionId === session.id) {
        setIsAdminTyping(true);
      }
    });

    onTypingEnd(({ userId, sessionId }) => {
      if (sessionId === session.id) {
        setIsAdminTyping(false);
      }
    });

    return () => {
      if (session.id) {
        leaveSession(session.id);
      }
    };
  }, [
    session?.id,
    isConnected,
    user?.id,
    joinSession,
    leaveSession,
    onMessageReceived,
    onTypingStart,
    onTypingEnd,
  ]);

  // Smart scroll
  useEffect(() => {
    const scrollContainer = document.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } =
        scrollContainer as HTMLElement;
      setIsNearBottom(scrollHeight - scrollTop - clientHeight < 100);
    };

    scrollContainer.addEventListener("scroll", handleScroll);

    if (isNearBottom && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [messages.length, isNearBottom]);

  const loadMessages = async (sessionId: string) => {
    try {
      const response = await chatService.getMessages(sessionId, {
        page: 1,
        limit: 100,
      });
      if (response?.data) {
        let messagesData: ChatMessage[] = [];
        if (Array.isArray(response.data)) {
          messagesData = response.data;
        } else if (
          response.data &&
          typeof response.data === "object" &&
          "data" in response.data
        ) {
          const nestedData = (response.data as any).data;
          messagesData = Array.isArray(nestedData) ? nestedData : [];
        }
        setMessages(messagesData);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !session || !isConnected) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    // Stop typing indicator
    if (session.id) {
      stopTyping(session.id);
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Optimistic update
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender_type: "user",
      message_text: messageText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const clientMessageId = sendWebSocketMessage(session.id, messageText);
      if (!clientMessageId) {
        throw new Error("Failed to send message via WebSocket");
      }
    } catch (err: any) {
      console.error("Failed to send message:", err);
      setError(err?.message || "Không thể gửi tin nhắn");
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
    }
  };

  const handleEnableBot = async () => {
    if (!session) return;
    try {
      setIsLoading(true);
      const response = await chatService.enableBot(session.id);
      if (response?.data) {
        setSession(response.data as ChatSession);
      }
    } catch (err: any) {
      console.error("Failed to enable bot:", err);
      setError(err?.response?.data?.message || "Không thể bật bot");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableBot = async () => {
    if (!session) return;
    try {
      setIsLoading(true);
      const response = await chatService.disableBot(session.id);
      if (response?.data) {
        setSession(response.data as ChatSession);
      }
    } catch (err: any) {
      console.error("Failed to disable bot:", err);
      setError(err?.response?.data?.message || "Không thể tắt bot");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onMinimize}
          className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-[600px] flex flex-col shadow-2xl rounded-lg overflow-hidden border border-gray-200 bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">Chat với nhà hàng</h3>
          <Badge
            variant="secondary"
            className={
              isConnected ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }
          >
            {isConnected ? "Đã kết nối" : "Mất kết nối"}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {session?.bot_enabled ? (
                <>
                  <DropdownMenuItem
                    onClick={handleDisableBot}
                    disabled={isLoading}
                  >
                    ❌ Tắt Bot
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      // Chat với nhân viên = disable bot
                      await handleDisableBot();
                    }}
                    disabled={isLoading}
                    className="text-blue-600 font-medium"
                  >
                    👤 Chat với nhân viên
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem
                    onClick={handleEnableBot}
                    disabled={isLoading}
                  >
                    ✅ Bật Bot
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="text-gray-400 text-xs">
                    💬 Đang chat với nhân viên
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            onClick={onMinimize}
            className="text-white"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-gray-50 to-white overflow-y-auto">
        {isLoading && !session ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4 text-gray-300" />
            <p>Chưa có tin nhắn nào</p>
            <p className="text-xs mt-2">Hãy bắt đầu trò chuyện!</p>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            {messages.map((message) => {
              const isUser = message.sender_type === "user";
              const isBot = message.sender_type === "bot";
              const messageDate = new Date(message.timestamp);

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 items-end ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm">
                      {isBot ? (
                        <Bot className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] min-w-0 rounded-2xl px-4 py-2.5 ${
                      isUser
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm"
                        : isBot
                        ? "bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 text-gray-800"
                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere word-break-break-word leading-relaxed">
                      {message.message_text}
                    </p>
                    <p
                      className={`text-xs mt-1.5 ${
                        isUser ? "text-blue-100" : "text-gray-500"
                      }`}
                    >
                      {messageDate.toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {isUser && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-semibold">
                      U
                    </div>
                  )}
                </div>
              );
            })}
            {isAdminTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-2 max-w-[70%]">
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
                    <span className="text-xs text-gray-600">
                      Nhân viên đang nhập...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4 bg-white">
        {error && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
            ⚠️ {error}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="Nhập tin nhắn... (Enter để gửi)"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);

              // Emit typing indicator with debounce
              if (session?.id && isConnected) {
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }

                if (e.target.value.trim()) {
                  startTyping(session.id);
                  typingTimeoutRef.current = setTimeout(() => {
                    stopTyping(session.id);
                  }, 3000);
                } else {
                  stopTyping(session.id);
                }
              }
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={!session || isLoading || !isConnected}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={
              !newMessage.trim() || !session || isLoading || !isConnected
            }
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
