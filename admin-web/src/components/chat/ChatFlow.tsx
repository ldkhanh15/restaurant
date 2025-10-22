"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Bot,
  User,
  LogIn,
  LogOut,
  Wifi,
  WifiOff,
} from "lucide-react";
import chatFlowService, {
  isUserAuthenticated,
} from "@/services/chatFlowService";
import { useChatWebSocket } from "@/hooks/useWebSocket";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  requires_auth?: boolean;
  original_response?: any;
}

interface ChatFlowProps {
  className?: string;
}

function ChatFlow({ className }: ChatFlowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket integration
  const {
    isConnected: isWebSocketConnected,
    joinChatSession,
    onChatMessageReceived,
    onChatTyping,
    onSessionClosed,
  } = useChatWebSocket();

  // Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = isUserAuthenticated();
      setIsAuthenticated(authStatus);
    };

    checkAuth();
    // Listen for auth changes
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  // Tạo session khi component mount
  useEffect(() => {
    createSession();
  }, [isAuthenticated]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket event listeners
  useEffect(() => {
    if (!isWebSocketConnected || !sessionId) return;

    // Join chat session
    joinChatSession(sessionId);

    // Listen for new messages
    const handleMessageReceived = (message: any) => {
      const newMessage: Message = {
        id: message.id || Date.now().toString(),
        text: message.message_text || message.text,
        sender: message.sender_type === "user" ? "user" : "bot",
        timestamp: new Date(message.created_at || Date.now()),
        requires_auth: message.requires_auth,
        original_response: message.original_response,
      };

      setMessages((prev) => [...prev, newMessage]);
    };

    // Listen for typing indicators
    const handleTyping = (data: { session_id: string; from: string }) => {
      if (data.session_id === sessionId) {
        // Handle typing indicator UI
        console.log(`${data.from} is typing...`);
      }
    };

    // Listen for session closed
    const handleSessionClosed = (payload: any) => {
      if (payload.session_id === sessionId) {
        console.log("Session closed:", payload);
        // Handle session closure
      }
    };

    onChatMessageReceived(handleMessageReceived);
    onChatTyping(handleTyping);
    onSessionClosed(handleSessionClosed);

    return () => {
      // Cleanup listeners when component unmounts or session changes
    };
  }, [
    isWebSocketConnected,
    sessionId,
    joinChatSession,
    onChatMessageReceived,
    onChatTyping,
    onSessionClosed,
  ]);

  const createSession = async () => {
    try {
      const response = await chatFlowService.createSession({
        device_id: navigator.userAgent,
        name: isAuthenticated ? "Authenticated User" : "Guest User",
      });

      if (response.data?.data?.id) {
        setSessionId(response.data.data.id);
      }
    } catch (error) {
      console.error("Failed to create chat session:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await chatFlowService.chatWithBot({
        message: inputMessage,
        session_id: sessionId || undefined,
      });

      // For authenticated users, the bot response will come via WebSocket
      // For guests, we handle the response directly
      if (!isAuthenticated) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text:
            response.data?.data?.response ||
            "Xin lỗi, tôi không thể trả lời ngay bây giờ.",
          sender: "bot",
          timestamp: new Date(),
          requires_auth: response.data?.data?.requires_auth,
          original_response: response.data?.data?.original_response,
        };

        setMessages((prev) => [...prev, botMessage]);

        // Nếu cần đăng nhập, hiển thị prompt
        if (botMessage.requires_auth) {
          setShowAuthPrompt(true);
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLogin = () => {
    // Redirect to login page or open login modal
    window.location.href = "/login";
  };

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem("auth_token");
    setIsAuthenticated(false);
    setMessages([]);
    createSession();
  };

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat với AI Tư vấn
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={isAuthenticated ? "default" : "secondary"}>
            {isAuthenticated ? (
              <>
                <LogIn className="h-3 w-3 mr-1" />
                Đã đăng nhập
              </>
            ) : (
              <>
                <LogOut className="h-3 w-3 mr-1" />
                Khách
              </>
            )}
          </Badge>

          {/* WebSocket Connection Status */}
          <Badge variant={isWebSocketConnected ? "default" : "destructive"}>
            {isWebSocketConnected ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                Kết nối
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                Mất kết nối
              </>
            )}
          </Badge>

          {isAuthenticated && (
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Đăng xuất
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Messages */}
        <div className="h-96 overflow-y-auto space-y-4 p-4 border rounded-lg">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Xin chào! Tôi là AI tư vấn của HIWELL Restaurant.</p>
              <p className="text-sm mt-2">
                {isAuthenticated
                  ? "Tôi có thể giúp bạn đặt bàn, tư vấn món ăn, và tra cứu đơn hàng."
                  : "Tôi có thể tư vấn về món ăn và thông tin nhà hàng. Để đặt bàn hoặc tra cứu đơn hàng, bạn cần đăng nhập."}
              </p>
              {!isWebSocketConnected && (
                <p className="text-xs text-red-500 mt-2">
                  ⚠️ Mất kết nối WebSocket. Một số tính năng có thể không hoạt
                  động.
                </p>
              )}
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex items-start gap-2 max-w-[80%] ${
                    message.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.sender === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {message.sender === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`px-3 py-2 rounded-lg ${
                      message.sender === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    {message.requires_auth && (
                      <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-xs">
                        <p className="font-semibold">Cần đăng nhập</p>
                        <p>
                          Để thực hiện tác vụ này, bạn cần đăng nhập vào hệ
                          thống.
                        </p>
                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={handleLogin}
                        >
                          Đăng nhập ngay
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="px-3 py-2 rounded-lg bg-gray-100">
                  <div className="flex space-x-1">
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
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn của bạn..."
            disabled={isLoading || !isWebSocketConnected}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={
              isLoading || !inputMessage.trim() || !isWebSocketConnected
            }
          >
            Gửi
          </Button>
        </div>

        {/* Auth Prompt */}
        {showAuthPrompt && !isAuthenticated && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <LogIn className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-blue-800">Cần đăng nhập</span>
            </div>
            <p className="text-blue-700 text-sm mb-3">
              Để thực hiện tác vụ này, bạn cần đăng nhập vào hệ thống.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleLogin}>
                Đăng nhập
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAuthPrompt(false)}
              >
                Hủy
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ChatFlow;
export { ChatFlow };
