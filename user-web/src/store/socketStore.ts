import { create } from "zustand";

/**
 * Socket Store for User-Web
 * Manages realtime state for all socket modules (chat, order, reservation, notification)
 */

// ============================================
// Chat State
// ============================================
interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: "user" | "human" | "bot";
  sender_id: string | null;
  message_text: string;
  timestamp: string;
  serverMessageId?: string;
  clientMessageId?: string;
  attachments?: any[];
}

interface ChatSession {
  id: string;
  user_id?: string;
  status: string;
  bot_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface ChatState {
  messages: Record<string, ChatMessage[]>; // sessionId -> messages
  sessions: ChatSession[];
  typingUsers: Record<string, Set<string>>; // sessionId -> userIds
  currentSessionId: string | null;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  setMessages: (sessionId: string, messages: ChatMessage[]) => void;
  addSession: (session: ChatSession) => void;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void;
  setTyping: (sessionId: string, userId: string, isTyping: boolean) => void;
  setCurrentSession: (sessionId: string | null) => void;
}

// ============================================
// Order State
// ============================================
interface Order {
  id: string;
  user_id?: string;
  customer_id?: string;
  table_id?: string;
  status: string;
  total: number;
  total_amount?: number;
  final_amount?: number;
  payment_status?: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

interface OrderState {
  orders: Record<string, Order>; // orderId -> order
  ordersByUser: string[]; // orderIds for current user
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  removeOrder: (orderId: string) => void;
  setOrders: (orders: Order[]) => void;
}

// ============================================
// Reservation State
// ============================================
interface Reservation {
  id: string;
  user_id?: string;
  customer_id?: string;
  table_id?: string;
  status: string;
  date: string;
  time: string;
  num_people: number;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

interface ReservationState {
  reservations: Record<string, Reservation>; // reservationId -> reservation
  reservationsByUser: string[]; // reservationIds for current user
  addReservation: (reservation: Reservation) => void;
  updateReservation: (
    reservationId: string,
    updates: Partial<Reservation>
  ) => void;
  removeReservation: (reservationId: string) => void;
  setReservations: (reservations: Reservation[]) => void;
}

// ============================================
// Notification State
// ============================================
interface Notification {
  id: string;
  user_id?: string;
  title?: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  metadata?: any;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  setNotifications: (notifications: Notification[]) => void;
}

// ============================================
// Combined Store
// ============================================
interface SocketStore
  extends ChatState,
    OrderState,
    ReservationState,
    NotificationState {
  // Connection state
  isConnected: boolean;
  setConnected: (connected: boolean) => void;

  // Reset all states
  reset: () => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  // Connection state
  isConnected: false,
  setConnected: (connected: boolean) => set({ isConnected: connected }),

  // Chat state
  messages: {},
  sessions: [],
  typingUsers: {},
  currentSessionId: null,
  addMessage: (sessionId: string, message: ChatMessage) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: [...(state.messages[sessionId] || []), message],
      },
    })),
  setMessages: (sessionId: string, messages: ChatMessage[]) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: messages,
      },
    })),
  addSession: (session: ChatSession) =>
    set((state) => ({
      sessions: [...state.sessions.filter((s) => s.id !== session.id), session],
    })),
  updateSession: (sessionId: string, updates: Partial<ChatSession>) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, ...updates } : s
      ),
    })),
  setTyping: (sessionId: string, userId: string, isTyping: boolean) =>
    set((state) => {
      const typingSet = state.typingUsers[sessionId] || new Set<string>();
      if (isTyping) {
        typingSet.add(userId);
      } else {
        typingSet.delete(userId);
      }
      return {
        typingUsers: {
          ...state.typingUsers,
          [sessionId]: typingSet,
        },
      };
    }),
  setCurrentSession: (sessionId: string | null) =>
    set({ currentSessionId: sessionId }),

  // Order state
  orders: {},
  ordersByUser: [],
  addOrder: (order: Order) =>
    set((state) => ({
      orders: { ...state.orders, [order.id]: order },
      ordersByUser: state.ordersByUser.includes(order.id)
        ? state.ordersByUser
        : [...state.ordersByUser, order.id],
    })),
  updateOrder: (orderId: string, updates: Partial<Order>) =>
    set((state) => ({
      orders: {
        ...state.orders,
        [orderId]: { ...state.orders[orderId], ...updates },
      },
    })),
  removeOrder: (orderId: string) =>
    set((state) => {
      const { [orderId]: removed, ...orders } = state.orders;
      return {
        orders,
        ordersByUser: state.ordersByUser.filter((id) => id !== orderId),
      };
    }),
  setOrders: (orders: Order[]) =>
    set({
      orders: orders.reduce(
        (acc, order) => ({ ...acc, [order.id]: order }),
        {}
      ),
      ordersByUser: orders.map((order) => order.id),
    }),

  // Reservation state
  reservations: {},
  reservationsByUser: [],
  addReservation: (reservation: Reservation) =>
    set((state) => ({
      reservations: { ...state.reservations, [reservation.id]: reservation },
      reservationsByUser: state.reservationsByUser.includes(reservation.id)
        ? state.reservationsByUser
        : [...state.reservationsByUser, reservation.id],
    })),
  updateReservation: (reservationId: string, updates: Partial<Reservation>) =>
    set((state) => ({
      reservations: {
        ...state.reservations,
        [reservationId]: { ...state.reservations[reservationId], ...updates },
      },
    })),
  removeReservation: (reservationId: string) =>
    set((state) => {
      const { [reservationId]: removed, ...reservations } = state.reservations;
      return {
        reservations,
        reservationsByUser: state.reservationsByUser.filter(
          (id) => id !== reservationId
        ),
      };
    }),
  setReservations: (reservations: Reservation[]) =>
    set({
      reservations: reservations.reduce(
        (acc, reservation) => ({ ...acc, [reservation.id]: reservation }),
        {}
      ),
      reservationsByUser: reservations.map((reservation) => reservation.id),
    }),

  // Notification state
  notifications: [],
  unreadCount: 0,
  addNotification: (notification: Notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.read ? 0 : 1),
    })),
  markAsRead: (notificationId: string) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      };
    }),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  removeNotification: (notificationId: string) =>
    set((state) => {
      const notification = state.notifications.find(
        (n) => n.id === notificationId
      );
      return {
        notifications: state.notifications.filter(
          (n) => n.id !== notificationId
        ),
        unreadCount: state.unreadCount - (notification?.read ? 0 : 1),
      };
    }),
  setNotifications: (notifications: Notification[]) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),

  // Reset all states
  reset: () =>
    set({
      isConnected: false,
      messages: {},
      sessions: [],
      typingUsers: {},
      currentSessionId: null,
      orders: {},
      ordersByUser: [],
      reservations: {},
      reservationsByUser: [],
      notifications: [],
      unreadCount: 0,
    }),
}));

// Export types
export type { ChatMessage, ChatSession, Order, Reservation, Notification };
