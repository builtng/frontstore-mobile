import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Heart } from 'lucide-react-native';
import { T, cx } from '@/components/ui';

/** Coloured square/round avatar with a store initial. */
export function Avatar({ initial, color, size = 48, radius = 14, fontSize = 18, className }: {
  initial: string; color: string; size?: number; radius?: number; fontSize?: number; className?: string;
}) {
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: color }} className={cx('items-center justify-center', className)}>
      <T style={{ fontSize, color: '#FFFFFF' }} className="font-display-x">{initial}</T>
    </View>
  );
}

/** Horizontally scrolling row of filter chips (single select). */
export function ChipRow({ options, value, onChange, px = 14, bordered = 'border-line bg-surface', className, contentPadding }: {
  options: string[]; value: string; onChange: (v: string) => void; px?: number; bordered?: string; className?: string;
  /** add 16px side padding inside the scroller (for full-bleed rows) */
  contentPadding?: boolean;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className={cx('grow-0', className)} contentContainerClassName={cx('gap-2', contentPadding && 'px-4')}>
      {options.map((o) => {
        const on = o === value;
        return (
          <Pressable
            key={o}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o)}
            style={{ paddingHorizontal: px }}
            className={cx('h-[38px] justify-center rounded-full', on ? 'bg-ink' : cx('border', bordered))}
          >
            <T className={cx('font-sans-semibold text-sm', on ? 'text-white' : 'text-ink')}>{o}</T>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Two-option segmented control on sand. */
export function Segmented<K extends string>({ options, value, onChange }: {
  options: { key: K; label: string }[]; value: K; onChange: (k: K) => void;
}) {
  return (
    <View className="flex-row gap-1 rounded-[14px] bg-sand p-1">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.key)}
            className={cx('h-10 flex-1 items-center justify-center rounded-[11px]', on ? 'bg-surface' : 'bg-transparent')}
          >
            <T className={cx('text-sm', on ? 'font-sans-bold text-ink' : 'font-sans-semibold text-muted-2')}>{o.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Round white heart toggle that sits on a product photo. */
export function HeartToggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? `Remove ${label} from saved` : `Save ${label}`}
      accessibilityState={{ selected: on }}
      onPress={onToggle}
      hitSlop={6}
      className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-surface"
    >
      <Heart size={16} color={on ? '#C8553D' : '#0E1A15'} fill={on ? '#C8553D' : 'none'} strokeWidth={2} />
    </Pressable>
  );
}

/** Follow / Following pill used on store rows. */
export function FollowPill({ on, onToggle, name }: { on: boolean; onToggle: () => void; name: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? `Unfollow ${name}` : `Follow ${name}`}
      accessibilityState={{ selected: on }}
      onPress={onToggle}
      hitSlop={8}
      className={cx('h-[32px] justify-center rounded-full px-3', on ? 'border border-line-2 bg-surface' : 'border border-ink')}
    >
      <T className="font-sans-bold text-[13px]">{on ? 'Following' : 'Follow'}</T>
    </Pressable>
  );
}

/** Width of a 2-column grid tile given 16px side padding and a 12px gap. */
export function useTileWidth() {
  const { width } = useWindowDimensions();
  return Math.floor((width - 32 - 12) / 2);
}
