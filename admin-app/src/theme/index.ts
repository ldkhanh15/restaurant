// Light theme configuration
export const lightTheme = {
  dark: false,
  version: 3 as const,
  colors: {
    primary: '#3b82f6',
    primaryContainer: '#dbeafe',
    secondary: '#10b981',
    secondaryContainer: '#d1fae5',
    tertiary: '#8b5cf6',
    tertiaryContainer: '#ede9fe',
    surface: '#ffffff',
    surfaceVariant: '#f8fafc',
    surfaceDisabled: '#f1f5f9',
    background: '#f1f5f9',
    error: '#ef4444',
    errorContainer: '#fee2e2',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#1e40af',
    onSecondary: '#ffffff',
    onSecondaryContainer: '#047857',
    onTertiary: '#ffffff',
    onTertiaryContainer: '#6d28d9',
    onSurface: '#1e293b',
    onSurfaceVariant: '#64748b',
    onSurfaceDisabled: '#94a3b8',
    onBackground: '#0f172a',
    onError: '#ffffff',
    onErrorContainer: '#dc2626',
    outline: '#cbd5e1',
    outlineVariant: '#e2e8f0',
    inverseSurface: '#1e293b',
    inverseOnSurface: '#f1f5f9',
    inversePrimary: '#60a5fa',
    shadow: '#000000',
    scrim: '#000000',
    backdrop: 'rgba(0,0,0,0.5)',
  },
};

// Dark theme configuration
export const darkTheme = {
  dark: true,
  version: 3 as const,
  colors: {
    primary: '#60a5fa',
    primaryContainer: '#1e40af',
    secondary: '#34d399',
    secondaryContainer: '#047857',
    tertiary: '#a78bfa',
    tertiaryContainer: '#6d28d9',
    surface: '#1e293b',
    surfaceVariant: '#334155',
    surfaceDisabled: '#475569',
    background: '#0f172a',
    error: '#f87171',
    errorContainer: '#dc2626',
    onPrimary: '#1e40af',
    onPrimaryContainer: '#dbeafe',
    onSecondary: '#047857',
    onSecondaryContainer: '#d1fae5',
    onTertiary: '#6d28d9',
    onTertiaryContainer: '#ede9fe',
    onSurface: '#f1f5f9',
    onSurfaceVariant: '#cbd5e1',
    onSurfaceDisabled: '#64748b',
    onBackground: '#f8fafc',
    onError: '#ffffff',
    onErrorContainer: '#fee2e2',
    outline: '#64748b',
    outlineVariant: '#475569',
    inverseSurface: '#f1f5f9',
    inverseOnSurface: '#1e293b',
    inversePrimary: '#3b82f6',
    shadow: '#000000',
    scrim: '#000000',
    backdrop: 'rgba(0,0,0,0.5)',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};