"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageCircle, Send, X, Bot, User, Minimize2, Maximize2 } from "lucide-react"

interface Message {
  id: string
  sender_type: "customer" | "bot" | "staff"
  message: string
  sent_at: string
}

interface ChatPopupProps {
  isOpen: boolean
  onClose: () => void
  onMinimize: () => void
  isMinimized: boolean
}

export default function ChatPopup({ isOpen, onClose, onMinimize, isMinimized }: ChatPopupProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && user && !sessionStarted) {
      const welcomeMsg: Message = {
        id: `msg-${Date.now()}`,
        sender_type: "bot",
        message: `Xin chào ${user.full_name}! Tôi là trợ lý ảo của nhà hàng. Tôi có thể giúp gì cho bạn hôm nay?`,
        sent_at: new Date().toISOString(),
      }
      setMessages([welcomeMsg])
      setSessionStarted(true)
    }
  }, [isOpen, user, sessionStarted])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender_type: "customer",
      message: newMessage,
      sent_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, newMsg])
    setNewMessage("")
    setIsTyping(true)

    setTimeout(() => {
      const message = newMessage.toLowerCase()
      let response = ""

      if (message.includes("đặt bàn") || message.includes("reservation")) {
        response = "Tôi có thể giúp bạn đặt bàn. Bạn muốn đặt bàn cho bao nhiêu người và vào thời gian nào?"
      } else if (message.includes("thực đơn") || message.includes("menu")) {
        response =
          "Bạn có thể xem thực đơn đầy đủ trong mục 'Thực Đơn'. Tôi có thể gợi ý một số món đặc biệt cho bạn không?"
      } else if (message.includes("giá") || message.includes("price")) {
        response =
          "Giá cả của chúng tôi rất cạnh tranh. Bạn có thể xem chi tiết giá từng món trong thực đơn. Có món nào cụ thể bạn muốn biết giá không?"
      } else if (message.includes("địa chỉ") || message.includes("location")) {
        response = "Nhà hàng chúng tôi tại 123 Đường ABC, Quận 1, TP.HCM. Bạn có cần hướng dẫn đường đi không?"
      } else if (message.includes("khuyến mãi") || message.includes("promotion")) {
        response = "Hiện tại chúng tôi có khuyến mãi giảm 20% cho tất cả món chính. Sử dụng mã WEEK20 khi đặt bàn!"
      } else {
        const responses = [
          "Cảm ơn bạn đã liên hệ! Tôi sẽ chuyển cho nhân viên hỗ trợ chuyên nghiệp.",
          "Tôi hiểu yêu cầu của bạn. Để tôi kiểm tra và phản hồi ngay.",
          "Bạn có thể cung cấp thêm thông tin chi tiết để tôi hỗ trợ tốt hơn không?",
          "Chúng tôi sẽ xử lý yêu cầu này trong thời gian sớm nhất. Cảm ơn bạn!",
        ]
        response = responses[Math.floor(Math.random() * responses.length)]
      }

      const botResponse: Message = {
        id: `msg-${Date.now() + 1}`,
        sender_type: "bot",
        message: response,
        sent_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, botResponse])
      setIsTyping(false)
    }, 1500)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card
        className={`bg-card border-border shadow-2xl transition-all duration-300 ${
          isMinimized ? "w-80 h-16" : "w-96 h-[500px]"
        }`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">Hỗ Trợ Khách Hàng</CardTitle>
              {!isMinimized && (
                <p className="text-xs text-muted-foreground">{isTyping ? "Đang nhập..." : "Trực tuyến"}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={onMinimize}>
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="flex flex-col h-[calc(500px-80px)] p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === "customer" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender_type === "customer"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {message.sender_type === "customer" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                      <span className="text-xs opacity-70">
                        {message.sender_type === "customer" ? "Bạn" : "Trợ lý"}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{message.message}</p>
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
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-current rounded-full animate-bounce" />
                        <div
                          className="w-1 h-1 bg-current rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-1 h-1 bg-current rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-border p-3">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 h-9"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="sm" className="h-9 w-9 p-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
