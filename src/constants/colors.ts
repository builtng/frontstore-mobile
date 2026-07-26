export const Colors = {
  // Brand
  primary: '#128C7E',
  primaryLight: '#25D366',
  primaryDim: '#DCFCE7',
  navy: '#0A192F',
  navyLight: '#112240',
  teal: '#64FFDA',
  amber: '#FF9F43',

  // Semantic
  success: '#2ECC71',
  successLight: '#D1FAE5',
  warning: '#F1C40F',
  warningLight: '#FEF3C7',
  danger: '#E74C3C',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Grays
  gray50: '#F8F9FA',
  gray100: '#F1F3F5',
  gray200: '#E9ECEF',
  gray300: '#DEE2E6',
  gray400: '#CED4DA',
  gray500: '#ADB5BD',
  gray600: '#6C757D',
  gray700: '#495057',
  gray800: '#343A40',
  gray900: '#212529',

  // Light mode
  light: {
    background: '#F8F9FA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E9ECEF',
    borderStrong: '#DEE2E6',
    text: '#0A192F',
    textSecondary: '#495057',
    textTertiary: '#ADB5BD',
    textInverse: '#FFFFFF',
    overlay: 'rgba(10, 25, 47, 0.4)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#F1F3F5',
  },

  // Dark mode
  dark: {
    background: '#030810',
    surface: '#0A192F',
    card: '#0D1F3C',
    border: '#16294A',
    borderStrong: '#24395c',
    text: '#F1F6F9',
    textSecondary: '#8892B0',
    textTertiary: '#546080',
    textInverse: '#0A192F',
    overlay: 'rgba(2, 6, 14, 0.78)',
    tabBar: 'rgba(9, 20, 39, 0.92)',
    tabBarBorder: '#16294A',
  },

  // Glass — frosted surfaces layered over the dark background
  glass: {
    bg: 'rgba(20, 40, 74, 0.5)',
    bgStrong: 'rgba(20, 40, 74, 0.72)',
    border: 'rgba(255, 255, 255, 0.09)',
    borderStrong: 'rgba(255, 255, 255, 0.16)',
    sheen: 'rgba(255, 255, 255, 0.05)',
  },

  // Glow — accent light bleed for hero/CTA surfaces
  glow: {
    primary: 'rgba(37, 211, 102, 0.4)',
    primarySoft: 'rgba(37, 211, 102, 0.18)',
    teal: 'rgba(100, 255, 218, 0.32)',
  },

  // Always
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorScheme = 'light' | 'dark';
