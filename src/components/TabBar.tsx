import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { T } from './ui';
type Item = { name: string; label: string; Icon: React.ComponentType<any>; useBadge?: () => number };

/**
 * White bottom tab bar from the designs (green active label, grey inactive).
 * If `centerHref` is set, a raised green "+" button sits in the middle (seller mode).
 */
/** Terracotta count on a tab (e.g. orders to ship). Hidden at zero. */
function Badge({ use }: { use: () => number }) {
  const n = use();
  if (!n) return null;
  return (
    <View pointerEvents="none" className="absolute -top-0.5 right-3.5 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-terra px-[5px]">
      <T className="font-sans-bold text-[11px] text-white">{n > 99 ? '99+' : n}</T>
    </View>
  );
}

export function makeTabBar(items: Item[], centerHref?: string) {
  return function TabBar({ state, navigation }: { state: any; navigation: any }) {
    const insets = useSafeAreaInsets();
    const nodes = items.map((it) => {
      const index = state.routes.findIndex((r: any) => r.name === it.name);
      const active = state.index === index;
      const color = active ? '#1E5E3A' : '#7A847F';
      return (
        <Pressable
          key={it.name}
          accessibilityRole="tab"
          accessibilityState={{ selected: active }}
          onPress={() => navigation.navigate(it.name)}
          className="relative w-16 items-center gap-1"
        >
          <it.Icon size={24} color={color} strokeWidth={active ? 2.2 : 1.9} />
          {it.useBadge ? <Badge use={it.useBadge} /> : null}
          <T style={{ color }} className={active ? 'font-sans-bold text-[11px]' : 'font-sans-semibold text-[11px]'}>{it.label}</T>
        </Pressable>
      );
    });
    if (centerHref) {
      nodes.splice(
        Math.floor(nodes.length / 2),
        0,
        <Pressable key="add" accessibilityLabel="Add product" onPress={() => router.push(centerHref as never)} style={{ shadowColor: '#1E5E3A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 11, elevation: 6 }} className="-mt-[18px] h-14 w-14 items-center justify-center rounded-[20px] bg-deep">
          <Plus size={26} color="#FFFFFF" strokeWidth={2.4} />
        </Pressable>,
      );
    }
    return (
      <View style={{ paddingBottom: Math.max(insets.bottom, 12) }} className="flex-row items-start justify-around border-t border-line bg-surface/95 px-1.5 pt-2.5">
        {nodes}
      </View>
    );
  };
}
