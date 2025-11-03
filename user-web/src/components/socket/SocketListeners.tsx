"use client";

import { useEffect } from "react";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import { useReservationSocket } from "@/hooks/useReservationSocket";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";

/**
 * Socket Listeners Component
 * Automatically listens to all socket events and updates the store
 * Mount this component once in your app layout to enable realtime updates
 */
export default function SocketListeners() {
  const chatSocket = useChatSocket();
  const orderSocket = useOrderSocket();
  const reservationSocket = useReservationSocket();
  const notificationSocket = useNotificationSocket();

  // Chat event listeners
  useEffect(() => {
    if (!chatSocket.isConnected) return;

    // Listen to new messages
    chatSocket.onMessageReceived((message) => {
      console.log("[Socket] New chat message received:", message);
    });

    // Listen to typing indicators
    chatSocket.onTypingStart((data) => {
      console.log("[Socket] User typing:", data);
    });

    chatSocket.onTypingEnd((data) => {
      console.log("[Socket] User stopped typing:", data);
    });

    // Listen to read receipts
    chatSocket.onMessagesRead((data) => {
      console.log("[Socket] Messages read:", data);
    });

    // Listen to new sessions
    chatSocket.onSessionNew((session) => {
      console.log("[Socket] New chat session:", session);
    });

    // Listen to session status changes
    chatSocket.onSessionStatusChanged((data) => {
      console.log("[Socket] Session status changed:", data);
    });

    // Listen to message ACKs
    chatSocket.onMessageAck((data) => {
      console.log("[Socket] Message ACK:", data);
    });
  }, [chatSocket.isConnected, chatSocket]);

  // Order event listeners
  useEffect(() => {
    if (!orderSocket.isConnected) return;

    orderSocket.onOrderCreated((order) => {
      console.log("[Socket] Order created:", order);
    });

    orderSocket.onOrderUpdated((order) => {
      console.log("[Socket] Order updated:", order);
    });

    orderSocket.onOrderStatusChanged((order) => {
      console.log("[Socket] Order status changed:", order);
    });

    orderSocket.onPaymentRequested((order) => {
      console.log("[Socket] Payment requested:", order);
    });

    orderSocket.onPaymentCompleted((order) => {
      console.log("[Socket] Payment completed:", order);
    });

    orderSocket.onPaymentFailed((order) => {
      console.log("[Socket] Payment failed:", order);
    });

    orderSocket.onSupportRequested((data) => {
      console.log("[Socket] Support requested:", data);
    });

    orderSocket.onVoucherApplied((order) => {
      console.log("[Socket] Voucher applied:", order);
    });

    orderSocket.onVoucherRemoved((order) => {
      console.log("[Socket] Voucher removed:", order);
    });

    orderSocket.onOrderMerged((order) => {
      console.log("[Socket] Order merged:", order);
    });
  }, [orderSocket.isConnected, orderSocket]);

  // Reservation event listeners
  useEffect(() => {
    if (!reservationSocket.isConnected) return;

    reservationSocket.onReservationCreated((reservation) => {
      console.log("[Socket] Reservation created:", reservation);
    });

    reservationSocket.onReservationUpdated((reservation) => {
      console.log("[Socket] Reservation updated:", reservation);
    });

    reservationSocket.onReservationStatusChanged((reservation) => {
      console.log("[Socket] Reservation status changed:", reservation);
    });

    reservationSocket.onReservationCheckedIn((data) => {
      console.log("[Socket] Reservation checked in:", data);
    });

    reservationSocket.onDepositPaymentRequested((data) => {
      console.log("[Socket] Deposit payment requested:", data);
    });

    reservationSocket.onDepositPaymentCompleted((reservation) => {
      console.log("[Socket] Deposit payment completed:", reservation);
    });

    reservationSocket.onDepositPaymentFailed((reservation) => {
      console.log("[Socket] Deposit payment failed:", reservation);
    });
  }, [reservationSocket.isConnected, reservationSocket]);

  // Notification event listeners
  useEffect(() => {
    if (!notificationSocket.isConnected) return;

    notificationSocket.onNewNotification((notification) => {
      console.log("[Socket] New notification:", notification);
    });

    notificationSocket.onNotificationOrder((notification) => {
      console.log("[Socket] Order notification:", notification);
    });

    notificationSocket.onNotificationReservation((notification) => {
      console.log("[Socket] Reservation notification:", notification);
    });

    notificationSocket.onNotificationChat((notification) => {
      console.log("[Socket] Chat notification:", notification);
    });

    notificationSocket.onNotificationBroadcast((notification) => {
      console.log("[Socket] Broadcast notification:", notification);
    });
  }, [notificationSocket.isConnected, notificationSocket]);

  return null; // This component doesn't render anything
}
