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
    background: '#020C1B',
    surface: '#0A192F',
    card: '#0A192F',
    border: '#112240',
    borderStrong: '#1d3461',
    text: '#E8F4F8',
    textSecondary: '#8892B0',
    textTertiary: '#4A5568',
    textInverse: '#0A192F',
    overlay: 'rgba(2, 12, 27, 0.7)',
    tabBar: '#0A192F',
    tabBarBorder: '#112240',
  },

  // Always
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorScheme = 'light' | 'dark';
