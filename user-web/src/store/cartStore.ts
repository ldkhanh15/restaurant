import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  dish_id: string;
  dish_name: string;
  quantity: number;
  price: number;
  customizations?: any;
}

interface CartStore {
  items: CartItem[];
  tableId: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  clearCart: () => void;
  setTableId: (tableId: string | null) => void;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      tableId: null,

      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.dish_id === item.dish_id
          );
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.dish_id === item.dish_id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (dishId) =>
        set((state) => ({
          items: state.items.filter((i) => i.dish_id !== dishId),
        })),

      updateQuantity: (dishId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((i) => i.dish_id !== dishId),
            };
          }
          return {
            items: state.items.map((i) =>
              i.dish_id === dishId ? { ...i, quantity } : i
            ),
          };
        }),

      clearCart: () => set({ items: [] }),

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
      name: "cart-store",
      partialize: (state) => ({
        items: state.items,
        tableId: state.tableId,
      }),
    }
  )
);
