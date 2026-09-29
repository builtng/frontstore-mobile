import { KeyboardAvoidingView, Modal, Platform, Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { T, cx } from '@/components/ui';

/** Back to the buyer profile (or wherever we came from). */
export function backToProfile() {
  if (router.canGoBack()) router.back();
  else router.replace('/shop/profile');
}

/** Back chevron + centred title header used by the buyer account screens. */
export function AccountHeader({ title }: { title: string }) {
  return (
    <View className="flex-row items-center justify-between px-2 pb-2">
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={backToProfile} className="h-11 w-11 items-center justify-center">
        <ChevronLeft size={22} color="#0E1A15" strokeWidth={2} />
      </Pressable>
      <T accessibilityRole="header" className="font-sans-bold text-[17px]">{title}</T>
      <View className="w-11" />
    </View>
  );
}

/** Dashed "+ Add ..." button. */
export function DashedAdd({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="h-[52px] items-center justify-center rounded-2xl border-[1.5px] border-dashed border-[#B9B1A0]"
    >
      <T className="font-sans-bold text-[15px]">{label}</T>
    </Pressable>
  );
}

/** Bottom sheet over a dimmed backdrop (cream, rounded top, grab handle). */
export function BottomSheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ backgroundColor: 'rgba(14,26,21,0.45)' }} className="flex-1 justify-end">
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} className="flex-1" />
        <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }} className="gap-3 rounded-t-[28px] bg-bg px-4 pt-3">
          <View className="h-[5px] w-10 self-center rounded-full bg-line-2" />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Compact labelled input used inside sheets (46px, 12px radius). */
export function SheetField({ label, className, ...rest }: TextInputProps & { label: string; className?: string }) {
  return (
    <View className={cx('gap-1.5', className)}>
      <T className="font-sans-bold text-[13px]">{label}</T>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#8A928E"
        className="h-[46px] rounded-xl border border-line-2 bg-surface px-3 font-sans text-[15px] text-ink"
        {...rest}
      />
    </View>
  );
}

/** Uppercase section label + white rounded group. */
export function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <T className="px-1 font-sans-bold text-xs uppercase tracking-[1px] text-muted">{title}</T>
      <View className="overflow-hidden rounded-[20px] border border-line bg-surface">{children}</View>
    </View>
  );
}

/** Tappable settings row with value + chevron. */
export function LinkRow({ label, value, danger, onPress }: { label: string; value?: string; danger?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      className="min-h-[56px] flex-row items-center gap-3 border-b border-[#F0ECE3] px-[18px]"
    >
      <T className={cx('flex-1 font-sans-semibold text-[15px]', danger ? 'text-danger' : 'text-ink')}>{label}</T>
      {value ? <T className="text-sm text-muted">{value}</T> : null}
      <ChevronRight size={16} color="#8A918D" strokeWidth={2} />
    </Pressable>
  );
}

/** Whole-row switch (label, optional sub line, 50x30 track). */
export function SwitchRow({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={sub}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      className="min-h-[60px] flex-row items-center gap-3 border-b border-[#F0ECE3] px-[18px] py-2.5"
    >
      <View className="flex-1 gap-0.5">
        <T className="font-sans-semibold text-[15px]">{label}</T>
        {sub ? <T className="text-[13px] text-muted">{sub}</T> : null}
      </View>
      <View className={cx('h-[30px] w-[50px] justify-center rounded-full px-[3px]', value ? 'items-end bg-green' : 'items-start bg-line-2')}>
        <View className="h-6 w-6 rounded-full bg-surface" />
      </View>
    </Pressable>
  );
}
