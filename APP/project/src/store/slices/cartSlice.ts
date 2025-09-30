import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OrderItem, Voucher } from '../../data/mockData';

interface CartState {
  items: OrderItem[];
  appliedVoucher: Voucher | null;
  total: number;
}

const initialState: CartState = {
  items: [],
  appliedVoucher: null,
  total: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<OrderItem>) => {
      const existingItem = state.items.find(item => item.dish_id === action.payload.dish_id);
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      cartSlice.caseReducers.calculateTotal(state);
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.dish_id !== action.payload);
      cartSlice.caseReducers.calculateTotal(state);
    },
    updateQuantity: (state, action: PayloadAction<{ dish_id: string; quantity: number }>) => {
      const item = state.items.find(item => item.dish_id === action.payload.dish_id);
      if (item) {
        item.quantity = action.payload.quantity;
      }
      cartSlice.caseReducers.calculateTotal(state);
    },
    applyVoucher: (state, action: PayloadAction<Voucher>) => {
      state.appliedVoucher = action.payload;
      cartSlice.caseReducers.calculateTotal(state);
    },
    removeVoucher: (state) => {
      state.appliedVoucher = null;
      cartSlice.caseReducers.calculateTotal(state);
    },
    clearCart: (state) => {
      state.items = [];
      state.appliedVoucher = null;
      state.total = 0;
    },
    calculateTotal: (state) => {
      const subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      let total = subtotal;
      
      if (state.appliedVoucher) {
        if (state.appliedVoucher.discount_type === 'percentage') {
          total = subtotal * (1 - state.appliedVoucher.value / 100);
        } else {
          total = subtotal - state.appliedVoucher.value;
        }
      }
      
      state.total = Math.max(0, total);
    },
  },
});

export const { addItem, removeItem, updateQuantity, applyVoucher, removeVoucher, clearCart } = cartSlice.actions;
export default cartSlice.reducer;