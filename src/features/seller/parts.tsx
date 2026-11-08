import { Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { T, cx } from '@/components/ui';

/** Go back, or to `fallback` when there is no history (deep link / web refresh). */
export function goBack(fallback: Href = '/home') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

/** Header with a back chevron, centred title and an optional right slot. */
export function BackHeader({ title, sub, right, fallback }: { title: string; sub?: string; right?: React.ReactNode; fallback?: Href }) {
  return (
    <View className="h-[52px] flex-row items-center px-4">
      <View className="w-10">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => goBack(fallback)}
          hitSlop={6}
          className="h-10 w-10 items-center justify-center rounded-full border border-line bg-surface"
        >
          <ChevronLeft size={20} color="#0E1A15" strokeWidth={2} />
        </Pressable>
      </View>
      <View className="min-w-0 flex-1 items-center">
        <T numberOfLines={1} className="font-display-x text-[17px]">{title}</T>
        {sub ? <T numberOfLines={1} className="text-xs text-muted">{sub}</T> : null}
      </View>
      <View className="min-w-10 flex-row justify-end">{right ?? null}</View>
    </View>
  );
}

/** Pill filter chip (dark when selected, white with a border otherwise). */
export function Chip({ label, on, onPress, className }: { label: string; on: boolean; onPress?: () => void; className?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      className={cx('min-h-[38px] justify-center rounded-full px-4', on ? 'bg-ink' : 'border border-line bg-surface', className)}
    >
      <T className={cx('font-sans-bold text-sm', on ? 'text-white' : 'text-ink')}>{label}</T>
    </Pressable>
  );
}

/** iOS-style switch drawn like the designs (50x30 green track). */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      hitSlop={8}
      className={cx('h-[30px] w-[50px] justify-center rounded-full px-[3px]', value ? 'items-end bg-green' : 'items-start bg-[#CDD3CE]')}
    >
      <View className="h-6 w-6 rounded-full bg-surface" />
    </Pressable>
  );
}

/** Four-point sparkle used for the Nina AI badges. */
export function Sparkle({ size = 12, color = '#1E5E3A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l2.2 6.5L21 11l-6.8 2.5L12 20l-2.2-6.5L3 11l6.8-2.5z" />
    </Svg>
  );
}

/** Small grab handle at the top of bottom sheets. */
export function Grip({ className }: { className?: string }) {
  return <View className={cx('h-[5px] w-10 self-center rounded-full bg-line-2', className)} />;
}

/** Segmented control from the designs: grey track, the selected option is a white tab. */
export function Segmented<V extends string>({ options, value, onChange, className }: {
  options: ReadonlyArray<readonly [V, string]>;
  value: V;
  onChange: (v: V) => void;
  className?: string;
}) {
  return (
    <View accessibilityRole="tablist" className={cx('flex-row gap-1 rounded-[14px] bg-sand p-1', className)}>
      {options.map(([v, label]) => {
        const on = v === value;
        return (
          <Pressable
            key={v}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(v)}
            style={on ? { shadowColor: '#0E1A15', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.14, shadowRadius: 3, elevation: 1 } : undefined}
            className={cx('h-9 flex-1 items-center justify-center rounded-[10px]', on && 'bg-surface')}
          >
            <T numberOfLines={1} className={cx('font-sans-bold text-[13px]', on ? 'text-ink' : 'text-muted')}>{label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Rounded square holding a row icon, tinted by tone (design: 40px, 12px corners). */
export function IconTile({ tone = 'green', size = 40, children }: { tone?: 'green' | 'warn' | 'danger' | 'info' | 'plain'; size?: number; children: React.ReactNode }) {
  const bg = { green: 'bg-mint', warn: 'bg-warn-bg', danger: 'bg-danger-bg', info: 'bg-info-bg', plain: 'bg-bg' }[tone];
  return <View style={{ width: size, height: size }} className={cx('shrink-0 items-center justify-center rounded-xl', bg)}>{children}</View>;
}

/** Status pill with explicit colours. */
export function Tag({ label, bg, fg, small }: { label: string; bg: string; fg: string; small?: boolean }) {
  return (
    <View style={{ backgroundColor: bg }} className={cx('rounded-full', small ? 'px-2 py-[3px]' : 'px-2.5 py-[5px]')}>
      <T style={{ color: fg }} className={cx('font-sans-bold', small ? 'text-[11px]' : 'text-xs')}>{label}</T>
    </View>
  );
}
