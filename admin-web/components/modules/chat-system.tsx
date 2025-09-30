"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ChatSession {
  id: number
  customer_name: string
  customer_phone?: string
  customer_email?: string
  channel: "web" | "app" | "zalo" | "facebook"
  status: "active" | "waiting" | "closed"
  created_at: string
  updated_at: string
  last_message: string
  unread_count: number
  assigned_agent?: string
  context?: any
  customer_history?: {
    total_orders: number
    last_order_date?: string
    favorite_dishes?: string[]
    avg_rating: number
  }
  tags?: string[]
  priority: "low" | "normal" | "high" | "urgent"
}

interface ChatMessage {
  id: number
  session_id: number
  sender_type: "customer" | "agent" | "bot"
  sender_name: string
  message_text: string
  sent_at: string
  read_at?: string
  message_type: "text" | "image" | "file" | "quick_reply" | "template"
  attachments?: string[]
  metadata?: {
    template_id?: string
    quick_reply_options?: string[]
    file_name?: string
    file_size?: number
  }
}

const mockSessions: ChatSession[] = [
  {
    id: 1,
    customer_name: "Nguyễn Văn A",
    customer_phone: "0901234567",
    customer_email: "nguyenvana@email.com",
    channel: "web",
    status: "active",
    created_at: "2024-03-20T14:30:00",
    updated_at: "2024-03-20T15:45:00",
    last_message: "Tôi muốn đặt bàn cho 4 người vào tối nay",
    unread_count: 2,
    assigned_agent: "Nhân viên Lan",
    context: { page: "reservation", intent: "booking" },
    customer_history: {
      total_orders: 12,
      last_order_date: "2024-03-15T19:30:00",
      favorite_dishes: ["Phở bò tái", "Gỏi cuốn tôm"],
      avg_rating: 4.5,
    },
    tags: ["VIP", "Khách quen"],
    priority: "high",
  },
  {
    id: 2,
    customer_name: "Trần Thị B",
    channel: "zalo",
    status: "waiting",
    created_at: "2024-03-20T15:20:00",
    updated_at: "2024-03-20T15:22:00",
    last_message: "Xin chào, tôi cần hỗ trợ về thực đơn",
    unread_count: 1,
    context: { source: "zalo", intent: "menu_inquiry" },
    customer_history: {
      total_orders: 3,
      avg_rating: 4.0,
    },
    tags: ["Khách mới"],
    priority: "normal",
  },
  {
    id: 3,
    customer_name: "Lê Quân C",
    customer_phone: "0912345678",
    channel: "app",
    status: "closed",
    created_at: "2024-03-20T10:15:00",
    updated_at: "2024-03-20T10:45:00",
    last_message: "Cảm ơn bạn đã hỗ trợ!",
    unread_count: 0,
    assigned_agent: "Nhân viên Minh",
    context: { order_id: 1001, intent: "order_support" },
    customer_history: {
      total_orders: 8,
      last_order_date: "2024-03-20T09:00:00",
      avg_rating: 4.2,
    },
    tags: ["Khách quen"],
    priority: "normal",
  },
]

const mockMessages: ChatMessage[] = [
  {
    id: 1,
    session_id: 1,
    sender_type: "customer",
    sender_name: "Nguyễn Văn A",
    message_text: "Xin chào, tôi muốn đặt bàn",
    sent_at: "2024-03-20T14:30:00",
    read_at: "2024-03-20T14:31:00",
    message_type: "text",
  },
  {
    id: 2,
    session_id: 1,
    sender_type: "bot",
    sender_name: "Bot hỗ trợ",
    message_text: "Xin chào! Tôi có thể giúp bạn đặt bàn. Bạn muốn đặt bàn cho bao nhiều người và vào thời gian nào?",
    sent_at: "2024-03-20T14:30:30",
    read_at: "2024-03-20T14:31:00",
    message_type: "quick_reply",
    metadata: {
      quick_reply_options: ["2 người", "4 người", "6 người", "8+ người"],
    },
  },
  {
    id: 3,
    session_id: 1,
    sender_type: "customer",
    sender_name: "Nguyễn Văn A",
    message_text: "Tôi muốn đặt bàn cho 4 người vào tối nay lúc 7h",
    sent_at: "2024-03-20T14:32:00",
    read_at: "2024-03-20T14:33:00",
    message_type: "text",
  },
  {
    id: 4,
    session_id: 1,
    sender_type: "agent",
    sender_name: "Nhân viên Lan",
    message_text: "Chào anh! Tôi sẽ hỗ trợ anh đặt bàn. Cho tôi xin số điện thoại để xác nhận đặt bàn ạ.",
    sent_at: "2024-03-20T15:45:00",
    message_type: "template",
    metadata: {
      template_id: "reservation_request_phone",
    },
  },
  {
    id: 5,
    session_id: 1,
    sender_type: "customer",
    sender_name: "Nguyễn Văn A",
    message_text: "Tôi muốn đặt bàn cho 4 người vào tối nay",
    sent_at: "2024-03-20T15:46:00",
    message_type: "text",
  },
]

const quickResponses = [
  "Xin chào! Tôi có thể giúp gì cho bạn?",
  "Cảm ơn bạn đã liên hệ. Tôi sẽ hỗ trợ ngay.",
  "Vui lòng chờ trong giây lát, tôi đang kiểm tra thông tin.",
  "Bạn có thể cung cấp thêm thông tin chi tiết không?",
  "Cảm ơn bạn đã phản hồi. Chúng tôi sẽ xử lý ngay.",
  "Bạn còn cần hỗ trợ gì khác không?",
  "Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!",
]

const messageTemplates = [
  {
    id: "greeting",
    name: "Chào hỏi",
    content: "Xin chào {customer_name}! Cảm ơn bạn đã liên hệ với nhà hàng. Tôi có thể giúp gì cho bạn?",
  },
  {
    id: "reservation_confirm",
    name: "Xác nhận đặt bàn",
    content: "Đặt bàn thành công cho {guest_count} người vào {date} lúc {time}. Mã đặt bàn: {booking_id}",
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
    content: "Đơn hàng #{order_id} của bạn đang được chuẩn bị. Thời gian dự kiến: {estimated_time} phút.",
  },
]

export function ChatSystem() {
  const [sessions, setSessions] = useState<ChatSession[]>(mockSessions)
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages)
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(sessions[0])
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showQuickResponses, setShowQuickResponses] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showCustomerInfo, setShowCustomerInfo] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.last_message.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || session.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const sortedSessions = filteredSessions.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
    if (a.priority !== b.priority) {
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    return b.unread_count - a.unread_count
  })

  const sessionMessages = messages.filter((msg) => msg.session_id === selectedSession?.id)

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case "web":
        return <Badge className="bg-blue-100 text-blue-800">Website</Badge>
      case "app":
        return <Badge className="bg-green-100 text-green-800">App</Badge>
      case "zalo":
        return <Badge className="bg-purple-100 text-purple-800">Zalo</Badge>
      case "facebook":
        return <Badge className="bg-indigo-100 text-indigo-800">Facebook</Badge>
      default:
        return <Badge variant="outline">{channel}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Đang chat</Badge>
      case "waiting":
        return <Badge className="bg-yellow-100 text-yellow-800">Chờ hỗ trợ</Badge>
      case "closed":
        return <Badge className="bg-gray-100 text-gray-800">Đã đóng</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge className="bg-red-100 text-red-800">Khẩn cấp</Badge>
      case "high":
        return <Badge className="bg-orange-100 text-orange-800">Cao</Badge>
      case "normal":
        return <Badge className="bg-blue-100 text-blue-800">Bình thường</Badge>
      case "low":
        return <Badge className="bg-gray-100 text-gray-800">Thấp</Badge>
      default:
        return null
    }
  }

  const sendMessage = (messageText?: string, messageType: "text" | "template" = "text") => {
    const textToSend = messageText || newMessage
    if (!textToSend.trim() || !selectedSession) return

    const message: ChatMessage = {
      id: messages.length + 1,
      session_id: selectedSession.id,
      sender_type: "agent",
      sender_name: "Nhân viên hỗ trợ",
      message_text: textToSend,
      sent_at: new Date().toISOString(),
      message_type: messageType,
    }

    setMessages([...messages, message])
    setNewMessage("")
    setShowQuickResponses(false)
    setShowTemplates(false)

    // Update session last message
    setSessions(
      sessions.map((session) =>
        session.id === selectedSession.id
          ? {
              ...session,
              last_message: textToSend,
              updated_at: new Date().toISOString(),
            }
          : session,
      ),
    )
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && selectedSession) {
      const message: ChatMessage = {
        id: messages.length + 1,
        session_id: selectedSession.id,
        sender_type: "agent",
        sender_name: "Nhân viên hỗ trợ",
        message_text: `Đã gửi file: ${file.name}`,
        sent_at: new Date().toISOString(),
        message_type: "file",
        metadata: {
          file_name: file.name,
          file_size: file.size,
        },
      }
      setMessages([...messages, message])
    }
  }

  const assignSession = (sessionId: number) => {
    setSessions(
      sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              status: "active" as any,
              assigned_agent: "Nhân viên hỗ trợ",
              updated_at: new Date().toISOString(),
            }
          : session,
      ),
    )
  }

  const closeSession = (sessionId: number) => {
    setSessions(
      sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              status: "closed" as any,
              updated_at: new Date().toISOString(),
            }
          : session,
      ),
    )
  }

  const activeSessions = sessions.filter((s) => s.status === "active").length
  const waitingSessions = sessions.filter((s) => s.status === "waiting").length
  const totalUnread = sessions.reduce((sum, s) => sum + s.unread_count, 0)

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng phiên chat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đang chat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chờ hỗ trợ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{waitingSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tin nhắn chưa đọc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalUnread}</div>
          </CardContent>
        </Card>
      </div> */}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[700px]">
        {/* Chat Sessions List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Danh sách chat</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                  🔍
                </span>
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-8"
                />
              </div>
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" className="text-xs">
                  Tất cả
                </TabsTrigger>
                <TabsTrigger value="active" className="text-xs">
                  Đang chat
                </TabsTrigger>
                <TabsTrigger value="waiting" className="text-xs">
                  Chờ
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2 p-4">
                {sortedSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedSession?.id === session.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{session.customer_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{session.customer_name}</p>
                          <div className="flex gap-1 flex-wrap">
                            {getChannelBadge(session.channel)}
                            {getStatusBadge(session.status)}
                            {getPriorityBadge(session.priority)}
                          </div>
                        </div>
                      </div>
                      {session.unread_count > 0 && (
                        <Badge className="bg-red-500 text-white text-xs">{session.unread_count}</Badge>
                      )}
                    </div>

                    {session.tags && session.tags.length > 0 && (
                      <div className="flex gap-1 mb-2">
                        {session.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{session.last_message}</p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>
                        {new Date(session.updated_at).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {session.assigned_agent && <span>{session.assigned_agent}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="lg:col-span-3">
          {selectedSession ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{selectedSession.customer_name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 flex-wrap">
                      {getChannelBadge(selectedSession.channel)}
                      {getStatusBadge(selectedSession.status)}
                      {getPriorityBadge(selectedSession.priority)}
                      {selectedSession.customer_phone && <span>• {selectedSession.customer_phone}</span>}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowCustomerInfo(!showCustomerInfo)}>
                      Thông tin KH
                    </Button>
                    {selectedSession.status === "waiting" && (
                      <Button size="sm" onClick={() => assignSession(selectedSession.id)}>
                        Nhận chat
                      </Button>
                    )}
                    {selectedSession.status === "active" && (
                      <Button size="sm" variant="outline" onClick={() => closeSession(selectedSession.id)}>
                        Đóng chat
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[450px] p-4">
                  <div className="space-y-4">
                    {sessionMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.sender_type === "agent" ? "justify-end" : "justify-start"}`}
                      >
                        {message.sender_type !== "agent" && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {message.sender_type === "bot" ? "🤖" : "👤"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.sender_type === "agent"
                              ? "bg-primary text-primary-foreground"
                              : message.sender_type === "bot"
                                ? "bg-muted"
                                : "bg-secondary"
                          }`}
                        >
                          <p className="text-sm">{message.message_text}</p>

                          {message.message_type === "file" && message.metadata?.file_name && (
                            <div className="mt-2 p-2 bg-white/10 rounded text-xs">
                              📎 {message.metadata.file_name}
                              {message.metadata.file_size && (
                                <span className="ml-2">({Math.round(message.metadata.file_size / 1024)}KB)</span>
                              )}
                            </div>
                          )}

                          {message.message_type === "quick_reply" && message.metadata?.quick_reply_options && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {message.metadata.quick_reply_options.map((option, index) => (
                                <button
                                  key={index}
                                  className="px-2 py-1 bg-white/20 rounded text-xs hover:bg-white/30"
                                  onClick={() => sendMessage(option)}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs opacity-70">
                              {new Date(message.sent_at).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {message.read_at && message.sender_type === "agent" && (
                              <span className="text-xs opacity-70">✓✓</span>
                            )}
                          </div>
                        </div>
                        {message.sender_type === "agent" && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">A</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {selectedSession.status === "active" && (
                  <div className="p-4 border-t space-y-2">
                    <div className="flex gap-2 mb-2">
                      <Button size="sm" variant="outline" onClick={() => setShowQuickResponses(!showQuickResponses)}>
                        Phản hồi nhanh
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowTemplates(!showTemplates)}>
                        Mẫu tin nhắn
                      </Button>
                      <label className="cursor-pointer">
                        <Button size="sm" variant="outline" asChild>
                          <span>📎 File</span>
                        </Button>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileUpload}
                          accept="image/*,.pdf,.doc,.docx"
                        />
                      </label>
                    </div>

                    {/* Quick Responses */}
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

                    {/* Message Templates */}
                    {showTemplates && (
                      <div className="space-y-1 p-2 bg-gray-50 rounded max-h-32 overflow-y-auto">
                        {messageTemplates.map((template) => (
                          <button
                            key={template.id}
                            className="w-full text-left p-2 text-xs hover:bg-white rounded"
                            onClick={() => sendMessage(template.content, "template")}
                          >
                            <div className="font-medium">{template.name}</div>
                            <div className="text-gray-600 truncate">{template.content}</div>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Input
                        placeholder="Nhập tin nhắn..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      />
                      <Button onClick={() => sendMessage()} disabled={!newMessage.trim()}>
                        📤
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
                <p className="text-muted-foreground">Chọn một cuộc trò chuyện để bắt đầu</p>
              </div>
            </CardContent>
          )}
        </Card>

        {selectedSession && showCustomerInfo && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Thông tin khách hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Thông tin cơ bản</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Tên:</span> {selectedSession.customer_name}
                  </p>
                  {selectedSession.customer_phone && (
                    <p>
                      <span className="font-medium">SĐT:</span> {selectedSession.customer_phone}
                    </p>
                  )}
                  {selectedSession.customer_email && (
                    <p>
                      <span className="font-medium">Email:</span> {selectedSession.customer_email}
                    </p>
                  )}
                </div>
              </div>

              {selectedSession.customer_history && (
                <div>
                  <h4 className="font-medium mb-2">Lịch sử mua hàng</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Tổng đơn:</span> {selectedSession.customer_history.total_orders}
                    </p>
                    <p>
                      <span className="font-medium">Đánh giá TB:</span> {selectedSession.customer_history.avg_rating}/5
                      ⭐
                    </p>
                    {selectedSession.customer_history.last_order_date && (
                      <p>
                        <span className="font-medium">Đơn cuối:</span>{" "}
                        {new Date(selectedSession.customer_history.last_order_date).toLocaleDateString("vi-VN")}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedSession.customer_history?.favorite_dishes && (
                <div>
                  <h4 className="font-medium mb-2">Món ăn yêu thích</h4>
                  <div className="space-y-1">
                    {selectedSession.customer_history.favorite_dishes.map((dish, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {dish}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedSession.tags && (
                <div>
                  <h4 className="font-medium mb-2">Nhãn khách hàng</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedSession.tags.map((tag, index) => (
                      <Badge key={index} className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
