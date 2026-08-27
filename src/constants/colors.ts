export const Colors = {
  // Brand
  primary: '#128C7E',
  primaryLight: '#25D366',
  primaryDark: '#075E54',
  primaryDim: 'rgba(18, 140, 126, 0.1)',
  navy: '#0F172A',
  navyLight: '#1E293B',
  teal: '#14B8A6',
  amber: '#F59E0B',

  // Semantic
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Grays / Neutrals
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',

  // Light mode (Modern clean white/slate canvas)
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    text: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    textInverse: '#FFFFFF',
    overlay: 'rgba(15, 23, 42, 0.45)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#F1F5F9',
  },

  // Dark mode
  dark: {
    background: '#0B1120',
    surface: '#0F172A',
    card: '#1E293B',
    border: '#334155',
    borderStrong: '#475569',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    textInverse: '#0F172A',
    overlay: 'rgba(0, 0, 0, 0.75)',
    tabBar: '#0F172A',
    tabBarBorder: '#1E293B',
  },

  // Glass
  glass: {
    bg: 'rgba(255, 255, 255, 0.85)',
    bgStrong: 'rgba(255, 255, 255, 0.95)',
    border: 'rgba(226, 232, 240, 0.8)',
    borderStrong: 'rgba(203, 213, 225, 0.8)',
    sheen: 'rgba(255, 255, 255, 0.4)',
  },

  // Glow
  glow: {
    primary: 'rgba(18, 140, 126, 0.28)',
    primarySoft: 'rgba(18, 140, 126, 0.1)',
    teal: 'rgba(37, 211, 102, 0.25)',
  },

  // Static
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorScheme = 'light' | 'dark';
