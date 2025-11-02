"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, User, MessageSquare, Bot, Phone, Mail } from "lucide-react";

interface SessionDetailsProps {
  session: {
    id: string;
    customer_name: string;
    customer_phone?: string;
    customer_email?: string;
    channel: "web" | "app" | "zalo";
    status: "active" | "closed";
    bot_enabled?: boolean;
    handled_by: "bot" | "human";
    start_time?: string;
    end_time?: string;
    created_at?: string;
    updated_at?: string;
    user?: {
      id: string;
      username: string;
      full_name?: string;
      email?: string;
      phone?: string;
    };
  };
  onCloseSession?: () => void;
  onReopenSession?: () => void;
  onToggleBot?: () => void;
}

export function ChatSessionDetails({
  session,
  onCloseSession,
  onReopenSession,
  onToggleBot,
}: SessionDetailsProps) {
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "web":
        return "🌐";
      case "app":
        return "📱";
      case "zalo":
        return "💬";
      default:
        return "💬";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600";
      case "closed":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "N/A";
    return new Date(timeString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDuration = () => {
    if (!session.start_time) return "N/A";
    const start = new Date(session.start_time);
    const end = session.end_time ? new Date(session.end_time) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;

    if (diffHours > 0) {
      return `${diffHours}h ${remainingMins}m`;
    }
    return `${diffMins}m`;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Thông tin phiên chat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Info */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <User className="h-4 w-4" />
            Khách hàng
          </h4>
          <div className="space-y-1 text-sm">
            <p className="font-medium">{session.customer_name}</p>
            {session.customer_phone && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3 w-3" />
                {session.customer_phone}
              </p>
            )}
            {session.customer_email && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3 w-3" />
                {session.customer_email}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Session Info */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Phiên chat
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kênh:</span>
              <div className="flex items-center gap-1">
                <span>{getChannelIcon(session.channel)}</span>
                <span className="capitalize">{session.channel}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trạng thái:</span>
              <span className={getStatusColor(session.status)}>
                {session.status === "active" ? "Đang hoạt động" : "Đã đóng"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Xử lý bởi:</span>
              <div className="flex items-center gap-1">
                {session.handled_by === "bot" ? (
                  <Bot className="h-3 w-3" />
                ) : (
                  <User className="h-3 w-3" />
                )}
                <span className="capitalize">
                  {session.handled_by === "bot" ? "Bot" : "Nhân viên"}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bot:</span>
              <Badge
                variant={session.bot_enabled ? "default" : "secondary"}
                className="text-xs"
              >
                {session.bot_enabled ? "Bật" : "Tắt"}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Time Info */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Thời gian
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bắt đầu:</span>
              <span>{formatTime(session.start_time)}</span>
            </div>
            {session.end_time && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kết thúc:</span>
                <span>{formatTime(session.end_time)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Thời lượng:</span>
              <span>{getDuration()}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          <h4 className="font-medium">Hành động</h4>
          <div className="space-y-2">
            {session.status === "active" && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCloseSession}
                className="w-full"
              >
                Đóng phiên chat
              </Button>
            )}
            {session.status === "closed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReopenSession}
                className="w-full"
              >
                Mở lại phiên chat
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleBot}
              className="w-full"
            >
              {session.bot_enabled ? "Tắt Bot" : "Bật Bot"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
