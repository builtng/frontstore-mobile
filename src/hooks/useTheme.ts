import { Colors } from '@/constants/colors';

// Frontstore's signature look is a single dark, glassy theme — always on,
// regardless of the device's system appearance.
export const useTheme = () => {
  return {
    isDark: true as const,
    scheme: 'dark' as const,
    colors: Colors,
    theme: Colors.dark,
  };
};
