import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order, OrderItem } from "@/services/orderService";

interface OrderStore {
  // Orders list
  orders: Order[];
  isLoading: boolean;
  error: string | null;

  // Selected order detail
  selectedOrder: Order | null;
  isLoadingDetail: boolean;
  detailError: string | null;

  // Actions
  setOrders: (orders: Order[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Order detail actions
  setSelectedOrder: (order: Order | null) => void;
  setLoadingDetail: (loading: boolean) => void;
  setDetailError: (error: string | null) => void;

  // Update order in list
  updateOrderInList: (orderId: string, updates: Partial<Order>) => void;

  // Add new order
  addOrder: (order: Order) => void;

  // Remove order
  removeOrder: (orderId: string) => void;

  // Update selected order
  updateSelectedOrder: (updates: Partial<Order>) => void;

  // Update order item
  updateOrderItem: (
    orderId: string,
    itemId: string,
    updates: Partial<OrderItem>
  ) => void;

  // Add item to selected order
  addItemToSelectedOrder: (item: OrderItem) => void;

  // Remove item from selected order
  removeItemFromSelectedOrder: (itemId: string) => void;

  // Clear all
  clear: () => void;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      // Initial state
      orders: [],
      isLoading: false,
      error: null,
      selectedOrder: null,
      isLoadingDetail: false,
      detailError: null,

      // List actions
      setOrders: (orders) => set({ orders }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Detail actions
      setSelectedOrder: (order) => set({ selectedOrder: order }),
      setLoadingDetail: (loading) => set({ isLoadingDetail: loading }),
      setDetailError: (error) => set({ detailError: error }),

      // Update order in list
      updateOrderInList: (orderId, updates) =>
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, ...updates } : order
          ),
          // Also update selected order if it's the same
          selectedOrder:
            state.selectedOrder?.id === orderId
              ? { ...state.selectedOrder, ...updates }
              : state.selectedOrder,
        })),

      // Add new order
      addOrder: (order) =>
        set((state) => {
          // Check if order already exists
          const exists = state.orders.find((o) => o.id === order.id);
          if (exists) {
            return {
              orders: state.orders.map((o) => (o.id === order.id ? order : o)),
            };
          }
          return {
            orders: [order, ...state.orders],
          };
        }),

      // Remove order
      removeOrder: (orderId) =>
        set((state) => ({
          orders: state.orders.filter((order) => order.id !== orderId),
          selectedOrder:
            state.selectedOrder?.id === orderId ? null : state.selectedOrder,
        })),

      // Update selected order
      updateSelectedOrder: (updates) =>
        set((state) => ({
          selectedOrder: state.selectedOrder
            ? { ...state.selectedOrder, ...updates }
            : null,
          // Also update in list
          orders: state.selectedOrder
            ? state.orders.map((order) =>
                order.id === state.selectedOrder!.id
                  ? { ...order, ...updates }
                  : order
              )
            : state.orders,
        })),

      // Update order item
      updateOrderItem: (orderId, itemId, updates) =>
        set((state) => {
          const updateItems = (items: OrderItem[] | undefined) =>
            items?.map((item) =>
              item.id === itemId ? { ...item, ...updates } : item
            );

          return {
            orders: state.orders.map((order) =>
              order.id === orderId
                ? { ...order, items: updateItems(order.items) }
                : order
            ),
            selectedOrder:
              state.selectedOrder?.id === orderId
                ? {
                    ...state.selectedOrder,
                    items: updateItems(state.selectedOrder.items),
                  }
                : state.selectedOrder,
          };
        }),

      // Add item to selected order
      addItemToSelectedOrder: (item) =>
        set((state) => {
          if (!state.selectedOrder) return state;

          const existingItems = state.selectedOrder.items || [];
          const existingItem = existingItems.find(
            (i) => i.dish_id === item.dish_id
          );

          let newItems: OrderItem[];
          if (existingItem) {
            newItems = existingItems.map((i) =>
              i.dish_id === item.dish_id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            );
          } else {
            newItems = [...existingItems, item];
          }

          return {
            selectedOrder: {
              ...state.selectedOrder,
              items: newItems,
            },
            orders: state.orders.map((order) =>
              order.id === state.selectedOrder!.id
                ? { ...order, items: newItems }
                : order
            ),
          };
        }),

      // Remove item from selected order
      removeItemFromSelectedOrder: (itemId) =>
        set((state) => {
          if (!state.selectedOrder) return state;

          const newItems =
            state.selectedOrder.items?.filter((item) => item.id !== itemId) ||
            [];

          return {
            selectedOrder: {
              ...state.selectedOrder,
              items: newItems,
            },
            orders: state.orders.map((order) =>
              order.id === state.selectedOrder!.id
                ? { ...order, items: newItems }
                : order
            ),
          };
        }),

      // Clear all
      clear: () =>
        set({
          orders: [],
          selectedOrder: null,
          isLoading: false,
          isLoadingDetail: false,
          error: null,
          detailError: null,
        }),
    }),
    {
      name: "order-store",
      // Only persist orders list, not loading states
      partialize: (state) => ({
        orders: state.orders,
        selectedOrder: state.selectedOrder,
      }),
    }
  )
);
