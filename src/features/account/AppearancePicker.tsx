import { View } from 'react-native';
import { T } from '@/components/ui';
import { Segmented } from '@/features/seller/parts';
import { useTheme, type ThemePref } from '@/lib/theme';

export const THEME_LABEL: Record<ThemePref, string> = { system: 'Same as phone', light: 'Light', dark: 'Dark' };

/** Light / dark / follow the phone. Saved on this phone. */
export function AppearancePicker() {
  const { pref, setPref } = useTheme();
  return (
    <View className="gap-2 rounded-[20px] border border-line bg-surface p-3.5">
      <T className="font-sans-bold text-[15px]">Appearance</T>
      <Segmented value={pref} onChange={setPref} options={[['system', 'Phone'], ['light', 'Light'], ['dark', 'Dark']] as const} />
    </View>
  );
}
