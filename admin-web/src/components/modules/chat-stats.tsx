"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Users,
  Bot,
  Clock,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface ChatStatsProps {
  sessions: Array<{
    id: string;
    status: "active" | "closed";
    bot_enabled?: boolean;
    handled_by: "bot" | "human";
    created_at?: string;
    updated_at?: string;
    unread_count?: number;
  }>;
}

export function ChatStats({ sessions }: ChatStatsProps) {
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => s.status === "active").length;
  const closedSessions = sessions.filter((s) => s.status === "closed").length;
  const botSessions = sessions.filter((s) => s.bot_enabled).length;
  const humanSessions = sessions.filter((s) => !s.bot_enabled).length;
  const totalUnread = sessions.reduce(
    (sum, s) => sum + (s.unread_count || 0),
    0
  );

  // Calculate average response time (mock data for now)
  const avgResponseTime = "2.5 phút";

  // Calculate today's stats
  const today = new Date().toDateString();
  const todaySessions = sessions.filter(
    (s) => s.created_at && new Date(s.created_at).toDateString() === today
  ).length;

  // Calculate bot vs human handling
  const botHandled = sessions.filter((s) => s.handled_by === "bot").length;
  const humanHandled = sessions.filter((s) => s.handled_by === "human").length;

  const stats = [
    {
      title: "Tổng phiên chat",
      value: totalSessions,
      icon: MessageSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Đang hoạt động",
      value: activeSessions,
      icon: Activity,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Đã đóng",
      value: closedSessions,
      icon: XCircle,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    {
      title: "Tin nhắn chưa đọc",
      value: totalUnread,
      icon: MessageSquare,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Bot đang xử lý",
      value: botSessions,
      icon: Bot,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Nhân viên xử lý",
      value: humanSessions,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6">
    

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Thống kê nhanh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((activeSessions / totalSessions) * 100) || 0}%
              </div>
              <div className="text-xs text-muted-foreground">
                Tỷ lệ hoạt động
              </div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((botSessions / totalSessions) * 100) || 0}%
              </div>
              <div className="text-xs text-muted-foreground">Bot tự động</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {totalUnread}
              </div>
              <div className="text-xs text-muted-foreground">Chưa đọc</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {todaySessions}
              </div>
              <div className="text-xs text-muted-foreground">Hôm nay</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
