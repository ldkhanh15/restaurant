"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MessageCircle, Send, Bell, X, Bot, User, AlertCircle, Gift, Calendar, Utensils } from "lucide-react"

// Mock data for chat sessions
const mockChatSessions = [
  {
    id: "chat-1",
    channel: "web",
    status: "active",
    created_at: "2024-01-15T10:30:00Z",
    last_message: "Cảm ơn bạn đã liên hệ! Chúng tôi sẽ hỗ trợ bạn ngay.",
  },
  {
    id: "chat-2",
    channel: "zalo",
    status: "resolved",
    created_at: "2024-01-14T15:20:00Z",
    last_message: "Đã đặt bàn thành công cho 4 người vào 19:00 ngày mai.",
  },
  {
    id: "chat-3",
    channel: "web",
    status: "active",
    created_at: "2024-01-13T09:15:00Z",
    last_message: "Bạn có thể gợi ý món ăn cho bữa tối lãng mạn không?",
  },
]

// Mock data for chat messages
const mockMessages = [
  {
    id: "msg-1",
    chat_session_id: "chat-1",
    sender_type: "customer",
    message: "Chào bạn, tôi muốn đặt bàn cho 2 người vào tối nay",
    sent_at: "2024-01-15T10:30:00Z",
  },
  {
    id: "msg-2",
    chat_session_id: "chat-1",
    sender_type: "bot",
    message: "Xin chào! Tôi có thể giúp bạn đặt bàn. Bạn muốn đặt bàn vào thời gian nào?",
    sent_at: "2024-01-15T10:31:00Z",
  },
  {
    id: "msg-3",
    chat_session_id: "chat-1",
    sender_type: "customer",
    message: "Khoảng 19:00 được không?",
    sent_at: "2024-01-15T10:32:00Z",
  },
  {
    id: "msg-4",
    chat_session_id: "chat-1",
    sender_type: "staff",
    message: "Chúng tôi có bàn trống lúc 19:00. Bạn có muốn tôi đặt bàn cho bạn không?",
    sent_at: "2024-01-15T10:33:00Z",
  },
]

// Mock data for notifications
const mockNotifications = [
  {
    id: "notif-1",
    user_id: "user-1",
    type: "reservation_confirm",
    title: "Xác nhận đặt bàn",
    message: "Đặt bàn của bạn cho 4 người vào 19:00 ngày 16/01 đã được xác nhận.",
    is_read: false,
    created_at: "2024-01-15T14:30:00Z",
  },
  {
    id: "notif-2",
    user_id: "user-1",
    type: "promotion",
    title: "Khuyến mãi đặc biệt",
    message: "Giảm 20% cho tất cả món chính trong tuần này. Sử dụng mã WEEK20.",
    is_read: false,
    created_at: "2024-01-15T09:00:00Z",
  },
  {
    id: "notif-3",
    user_id: "user-1",
    type: "order_ready",
    title: "Đơn hàng sẵn sàng",
    message: "Đơn hàng #ORD-001 của bạn đã sẵn sàng để phục vụ.",
    is_read: true,
    created_at: "2024-01-14T18:45:00Z",
  },
  {
    id: "notif-4",
    user_id: "user-1",
    type: "voucher_received",
    title: "Nhận voucher mới",
    message: "Bạn đã nhận được voucher giảm giá 50,000đ từ khiếu nại đã được giải quyết.",
    is_read: true,
    created_at: "2024-01-13T16:20:00Z",
  },
  {
    id: "notif-5",
    user_id: "user-1",
    type: "event_reminder",
    title: "Nhắc nhở sự kiện",
    message: "Sự kiện 'Tiệc Sinh Nhật' mà bạn đã đặt sẽ diễn ra vào ngày mai lúc 18:00.",
    is_read: true,
    created_at: "2024-01-12T10:00:00Z",
  },
]

interface ChatNotificationsProps {
  onClose: () => void
}

export default function ChatNotifications({ onClose }: ChatNotificationsProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "notifications">("chat")
  const [selectedChatSession, setSelectedChatSession] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState(mockMessages)
  const [notifications, setNotifications] = useState(mockNotifications)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChatSession) return

    const newMsg = {
      id: `msg-${Date.now()}`,
      chat_session_id: selectedChatSession,
      sender_type: "customer" as const,
      message: newMessage,
      sent_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, newMsg])
    setNewMessage("")
    setIsTyping(true)

    // Simulate bot/staff response
    setTimeout(() => {
      const responses = [
        "Cảm ơn bạn đã liên hệ! Chúng tôi sẽ hỗ trợ bạn ngay.",
        "Tôi hiểu yêu cầu của bạn. Để tôi kiểm tra và phản hồi.",
        "Bạn có thể cung cấp thêm thông tin chi tiết không?",
        "Chúng tôi sẽ xử lý yêu cầu này trong thời gian sớm nhất.",
      ]

      const botResponse = {
        id: `msg-${Date.now() + 1}`,
        chat_session_id: selectedChatSession,
        sender_type: "bot" as const,
        message: responses[Math.floor(Math.random() * responses.length)],
        sent_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, botResponse])
      setIsTyping(false)
    }, 2000)
  }

  const handleStartNewChat = () => {
    const newSession = {
      id: `chat-${Date.now()}`,
      channel: "web" as const,
      status: "active" as const,
      created_at: new Date().toISOString(),
      last_message: "Cuộc trò chuyện mới đã được bắt đầu",
    }

    setSelectedChatSession(newSession.id)

    // Add welcome message
    const welcomeMsg = {
      id: `msg-${Date.now()}`,
      chat_session_id: newSession.id,
      sender_type: "bot" as const,
      message: "Xin chào! Tôi là trợ lý ảo của nhà hàng. Tôi có thể giúp gì cho bạn hôm nay?",
      sent_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, welcomeMsg])
  }

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === notificationId ? { ...notif, is_read: true } : notif)))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reservation_confirm":
        return <Calendar className="h-4 w-4 text-green-500" />
      case "promotion":
        return <Gift className="h-4 w-4 text-purple-500" />
      case "order_ready":
        return <Utensils className="h-4 w-4 text-blue-500" />
      case "voucher_received":
        return <Gift className="h-4 w-4 text-yellow-500" />
      case "event_reminder":
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    })
  }

  const currentSessionMessages = messages.filter((msg) => msg.chat_session_id === selectedChatSession)

  const unreadNotifications = notifications.filter((notif) => !notif.is_read).length

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
          <div className="flex items-center space-x-4">
            <CardTitle className="text-xl">Hỗ Trợ & Thông Báo</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant={activeTab === "chat" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("chat")}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat Hỗ Trợ
              </Button>
              <Button
                variant={activeTab === "notifications" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("notifications")}
                className="relative"
              >
                <Bell className="h-4 w-4 mr-2" />
                Thông Báo
                {unreadNotifications > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500">
                    {unreadNotifications}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden">
          {activeTab === "chat" ? (
            <div className="flex h-full">
              {/* Chat Sessions Sidebar */}
              <div className="w-1/3 border-r border-border bg-muted/20">
                <div className="p-4 border-b border-border">
                  <Button onClick={handleStartNewChat} className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Bắt Đầu Chat Mới
                  </Button>
                </div>
                <div className="overflow-y-auto h-full">
                  {mockChatSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedChatSession === session.id ? "bg-muted" : ""
                      }`}
                      onClick={() => setSelectedChatSession(session.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {session.channel === "web" ? "Web Chat" : "Zalo Chat"}
                          </span>
                        </div>
                        <Badge variant={session.status === "active" ? "default" : "secondary"} className="text-xs">
                          {session.status === "active" ? "Đang hoạt động" : "Đã giải quyết"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{session.last_message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatTime(session.created_at)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 flex flex-col">
                {selectedChatSession ? (
                  <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {currentSessionMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_type === "customer" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.sender_type === "customer"
                                ? "bg-primary text-primary-foreground"
                                : message.sender_type === "bot"
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              {message.sender_type === "customer" ? (
                                <User className="h-3 w-3" />
                              ) : message.sender_type === "bot" ? (
                                <Bot className="h-3 w-3" />
                              ) : (
                                <MessageCircle className="h-3 w-3" />
                              )}
                              <span className="text-xs opacity-70">
                                {message.sender_type === "customer"
                                  ? "Bạn"
                                  : message.sender_type === "bot"
                                    ? "Bot"
                                    : "Nhân viên"}
                              </span>
                            </div>
                            <p className="text-sm">{message.message}</p>
                            <p className="text-xs opacity-70 mt-1">{formatTime(message.sent_at)}</p>
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-muted text-muted-foreground rounded-lg p-3">
                            <div className="flex items-center space-x-2">
                              <Bot className="h-3 w-3" />
                              <span className="text-xs">Đang nhập...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="border-t border-border p-4">
                      <div className="flex space-x-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Nhập tin nhắn..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSendMessage()
                            }
                          }}
                        />
                        <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Chọn một cuộc trò chuyện để bắt đầu</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Notifications Tab */
            <div className="h-full overflow-y-auto">
              <div className="p-4 space-y-4">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      !notification.is_read ? "border-primary/50 bg-primary/5" : ""
                    }`}
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium truncate">{notification.title}</h4>
                            <div className="flex items-center space-x-2">
                              {!notification.is_read && <div className="w-2 h-2 bg-primary rounded-full" />}
                              <span className="text-xs text-muted-foreground">
                                {formatTime(notification.created_at)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
