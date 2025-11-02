"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MessageSquare,
  Send,
  Loader2,
  Wifi,
  WifiOff,
  Bot,
  User,
  LogIn,
} from "lucide-react";
import { chatService } from "@/services/chatService";
import { useAuth } from "@/lib/auth";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";

interface ChatMessage {
  id: string;
  sender_type: "user" | "bot" | "human";
  message_text: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  status: "active" | "closed";
  user_id?: string;
  bot_enabled?: boolean;
}

export default function ChatTestPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Smart scroll: only scroll if user is near bottom
  const [isNearBottom, setIsNearBottom] = useState(true);

  useEffect(() => {
    const scrollContainer = document.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } =
        scrollContainer as HTMLElement;
      // Consider "near bottom" if within 100px of bottom
      setIsNearBottom(scrollHeight - scrollTop - clientHeight < 100);
    };

    scrollContainer.addEventListener("scroll", handleScroll);

    // Auto-scroll only if user is near bottom
    if (isNearBottom && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [messages.length, isNearBottom]);

  // No redirect useEffect needed - we handle it in the render with early returns

  // Initialize session (only after auth has finished loading)
  useEffect(() => {
    // Wait for auth to finish loading before initializing session
    if (authLoading) return;
    if (!token || !user) return;

    const initSession = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to get active session (or create if none exists - handled by backend)
        const response = await chatService.getActiveUserSession();
        console.log("Session response:", response);
        if (response?.data) {
          const sessionData = response.data as ChatSession;
          console.log("Setting session:", sessionData);
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
  }, [token, user, authLoading]);

  // Setup WebSocket message handlers
  useEffect(() => {
    if (!session?.id) return;

    // Join session when connected
    if (isConnected) {
      joinSession(session.id);
    }

    // Listen for new messages
    const handleMessage = (message: any) => {
      console.log("📩 New message received:", message);
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
        // Avoid duplicates
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

  const loadMessages = async (sessionId: string) => {
    try {
      const response = await chatService.getMessages(sessionId, {
        page: 1,
        limit: 100,
      });
      console.log("Load messages response:", response);
      if (response?.data) {
        // Handle different response formats
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
        console.log("Loaded messages:", messagesData.length);
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

    // Optimistic update
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender_type: "user",
      message_text: messageText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      // Send via WebSocket
      const clientMessageId = sendWebSocketMessage(session.id, messageText);

      if (!clientMessageId) {
        throw new Error("Failed to send message via WebSocket");
      }

      // Wait for ACK or new message event
      // The onMessageReceived handler will update the message with real ID
    } catch (err: any) {
      console.error("Failed to send message:", err);
      setError(err?.message || "Không thể gửi tin nhắn");
      // Remove failed message
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  // Show login required if not authenticated (only after auth loading completes)
  if (!token || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Yêu cầu đăng nhập
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Bạn cần đăng nhập để sử dụng tính năng chat.
            </p>
            <Button
              onClick={() => {
                window.location.href = "/login";
              }}
              className="w-full"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Đi đến trang đăng nhập
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                💬 Test Module Chat
              </h1>
              <p className="text-gray-600">
                Trang test để kiểm tra tính năng chat real-time với WebSocket
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              {user.username}
            </Badge>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Connection Status */}
        <Card className="mb-6 border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Trạng thái kết nối</span>
              <Badge
                variant={isConnected ? "default" : "destructive"}
                className="flex items-center gap-1"
              >
                {isConnected ? (
                  <>
                    <Wifi className="h-3 w-3" />
                    Đã kết nối
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    Chưa kết nối
                  </>
                )}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">WebSocket:</span>
              <span
                className={
                  isConnected
                    ? "text-green-600 font-medium"
                    : "text-red-600 font-medium"
                }
              >
                {isConnected ? "✅ Đã kết nối" : "❌ Ngắt kết nối"}
              </span>
            </div>
            {session && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Session ID:</span>
                  <span className="font-mono text-xs text-gray-600">
                    {session.id.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bot:</span>
                  <Badge
                    variant={session.bot_enabled ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {session.bot_enabled ? "✅ Bật" : "❌ Tắt"}
                  </Badge>
                </div>
              </>
            )}
            {error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                ⚠️ {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="border-2 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-amber-500 text-white">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat với nhà hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages Area */}
            <ScrollArea className="h-[500px] p-4 bg-gradient-to-b from-gray-50 to-white overflow-y-auto">
              {isLoading ? (
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
                  <div ref={messagesEndRef} className="h-1" />
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4 bg-white">
              {/* Typing Indicator */}
              {isAdminTyping && (
                <div className="mb-2 flex justify-start">
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

              <div className="flex gap-2">
                <Input
                  placeholder="Nhập tin nhắn... (Enter để gửi)"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);

                    // Emit typing indicator with debounce
                    if (session?.id && isConnected) {
                      // Clear existing timeout
                      if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                      }

                      if (e.target.value.trim()) {
                        startTyping(session.id);
                        // Auto stop typing after 3 seconds of no input
                        typingTimeoutRef.current = setTimeout(() => {
                          stopTyping(session.id);
                        }, 3000);
                      } else {
                        stopTyping(session.id);
                      }
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  disabled={!session || isLoading || !isConnected}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !session || isLoading}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Gửi
                    </>
                  )}
                </Button>
              </div>
              {!isConnected && (
                <p className="text-xs text-amber-600 mt-2">
                  ⚠️ WebSocket chưa kết nối. Tin nhắn sẽ được gửi qua API.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Các thao tác</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  if (session) {
                    await loadMessages(session.id);
                  }
                }}
                disabled={!session || isLoading}
              >
                🔄 Tải lại tin nhắn
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // WebSocket disconnect is handled by WebSocketProvider
                  console.log(
                    "Disconnect requested - handled by WebSocketProvider"
                  );
                }}
                disabled={!session}
              >
                🔌 Ngắt kết nối WebSocket
              </Button>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Bot Chat</span>
                <Badge
                  variant={session?.bot_enabled ? "default" : "secondary"}
                  className="text-xs"
                >
                  {session?.bot_enabled ? "✅ Đang bật" : "❌ Đang tắt"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleEnableBot}
                  disabled={!session || isLoading || session?.bot_enabled}
                  className="border-green-300 hover:bg-green-50 hover:border-green-400"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Bật Bot
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDisableBot}
                  disabled={!session || isLoading || !session?.bot_enabled}
                  className="border-red-300 hover:bg-red-50 hover:border-red-400"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Tắt Bot
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
