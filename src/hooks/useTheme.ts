import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/colors';

export const useTheme = () => {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  return {
    isDark,
    scheme,
    colors: Colors,
    theme,
  };
};
