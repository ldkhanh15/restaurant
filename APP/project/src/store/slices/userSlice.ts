import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../data/mockData';

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  userRole: 'customer' | 'employee' | 'admin' | null;
}

const initialState: UserState = {
  currentUser: null,
  isAuthenticated: false,
  loading: false,
  userRole: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
      state.userRole = action.payload.role;
    },
    clearUser: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.userRole = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    updateUserPoints: (state, action: PayloadAction<number>) => {
      if (state.currentUser) {
        state.currentUser.points = action.payload;
      }
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.currentUser) {
        state.currentUser = {
          ...state.currentUser,
          ...action.payload,
          updated_at: new Date().toISOString(),
        };
      }
    },
    updateUserPreferences: (state, action: PayloadAction<Partial<User['preferences']>>) => {
      if (state.currentUser) {
        state.currentUser.preferences = {
          ...state.currentUser.preferences,
          ...action.payload,
        };
        state.currentUser.updated_at = new Date().toISOString();
      }
    },
  },
});

export const { 
  setUser, 
  clearUser, 
  setLoading, 
  updateUserPoints, 
  updateUserProfile, 
  updateUserPreferences 
} = userSlice.actions;

export default userSlice.reducer;
