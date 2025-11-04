import { create } from 'zustand';

interface ThemeState {
  isDarkMode: boolean;
}

interface ThemeActions {
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState & ThemeActions>((set) => ({
  isDarkMode: false,
  
  toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  
  setDarkMode: (isDarkMode) => set({ isDarkMode }),
}));