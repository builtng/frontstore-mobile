import { Colors } from '@/constants/colors';

export const useTheme = () => {
  return {
    isDark: false as const,
    scheme: 'light' as const,
    colors: Colors,
    theme: Colors.light,
  };
};
