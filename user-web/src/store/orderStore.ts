import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface OrderItem {
  dish_id: string;
  dish_name: string;
  quantity: number;
  price: number;
  customizations?: Record<string, any>;
}

interface OrderStore {
  items: OrderItem[];
  tableId: string | null;
  addItem: (item: OrderItem) => void;
  removeItem: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  clearCart: () => void;
  setTableId: (tableId: string | null) => void;
  getTotal: () => number;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      items: [],
      tableId: null,
      addItem: (item) =>
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.dish_id === item.dish_id
          );
          if (existingIndex >= 0) {
            const updated = [...state.items];
            updated[existingIndex].quantity += item.quantity;
            return { items: updated };
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (dishId) =>
        set((state) => ({
          items: state.items.filter((item) => item.dish_id !== dishId),
        })),
      updateQuantity: (dishId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.dish_id === dishId ? { ...item, quantity } : item
          ),
        })),
      clearCart: () => set({ items: [], tableId: null }),
      setTableId: (tableId) => set({ tableId }),
      getTotal: () => {
        const state = get();
        return state.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: "order-cart",
    }
  )
);
