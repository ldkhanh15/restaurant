"use client";

import { useState } from "react";
import ChatWidget from "./chat-widget";
import { Button } from "./ui/button";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function GlobalChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!user) return null;

  return (
    <>
      <ChatWidget
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onMinimize={() => setIsMinimized(!isMinimized)}
        isMinimized={isMinimized}
      />
      {!isOpen && !isMinimized && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          size="sm"
          aria-label="Mở chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </>
  );
}
