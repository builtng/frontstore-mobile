import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Button, T, cx } from '@/components/ui';
import { BottomSheet } from '@/features/buyer/account';
import { C } from '@/lib/theme';

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
// Every half hour from 6am to 11:30pm.
const SLOTS = Array.from({ length: 36 }, (_, i) => [6 + Math.floor(i / 2), (i % 2) * 30] as const);
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const slotLabel = (h: number, m: number) => `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;

export const formatDateTime = (d: Date) =>
  `${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}, ${slotLabel(d.getHours(), d.getMinutes())}`;

/**
 * Date and time picker without a native module: a month calendar and
 * half-hour slots in a bottom sheet. Past days can't be picked.
 */
export function DateTimeField({ label, value, onChange }: { label: string; value: Date | null; onChange: (d: Date) => void }) {
  const [open, setOpen] = useState(false);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [month, setMonth] = useState(() => { const d = new Date(value ?? today); d.setDate(1); return d; });
  const [day, setDay] = useState<Date | null>(value ? new Date(value.getFullYear(), value.getMonth(), value.getDate()) : null);
  const [slot, setSlot] = useState<readonly [number, number] | null>(value ? [value.getHours(), value.getMinutes() >= 30 ? 30 : 0] : null);

  const first = new Date(month);
  const lead = (first.getDay() + 6) % 7; // Monday first
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  const canBack = month > new Date(today.getFullYear(), today.getMonth(), 1);

  const done = () => {
    if (!day || !slot) return;
    const d = new Date(day); d.setHours(slot[0], slot[1], 0, 0);
    onChange(d);
    setOpen(false);
  };

  return (
    <>
      <View className="gap-1.5">
        <T className="font-sans-bold text-[13px] text-muted">{label}</T>
        <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value ? formatDateTime(value) : 'not set'}`} onPress={() => setOpen(true)} className="h-[50px] flex-row items-center gap-2.5 rounded-[14px] border border-line bg-surface px-3.5">
          <CalendarDays size={18} color={C.accent} strokeWidth={2} />
          <T className={cx('flex-1 font-sans-semibold text-base', !value && 'text-placeholder')}>{value ? formatDateTime(value) : 'Pick a date and time'}</T>
        </Pressable>
      </View>
      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <View className="gap-3.5 py-1">
          <View className="flex-row items-center justify-between">
            <Pressable accessibilityRole="button" accessibilityLabel="Previous month" disabled={!canBack} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className={cx('h-10 w-10 items-center justify-center rounded-full border border-line', !canBack && 'opacity-30')}>
              <ChevronLeft size={18} color={C.ink} />
            </Pressable>
            <T className="font-display text-lg">{month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</T>
            <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="h-10 w-10 items-center justify-center rounded-full border border-line">
              <ChevronRight size={18} color={C.ink} />
            </Pressable>
          </View>
          <View className="flex-row">
            {WEEK.map((w, i) => <T key={i} className="flex-1 text-center font-sans-bold text-xs text-muted">{w}</T>)}
          </View>
          <View className="flex-row flex-wrap">
            {cells.map((d, i) => {
              if (!d) return <View key={i} style={{ width: `${100 / 7}%` }} className="h-10" />;
              const past = d < today;
              const on = !!day && sameDay(d, day);
              return (
                <Pressable key={i} accessibilityRole="button" accessibilityState={{ selected: on, disabled: past }} disabled={past} onPress={() => setDay(d)} style={{ width: `${100 / 7}%` }} className="h-10 items-center justify-center">
                  <View className={cx('h-9 w-9 items-center justify-center rounded-full', on && 'bg-green', !on && sameDay(d, today) && 'border border-line-2')}>
                    <T className={cx('font-sans-semibold text-sm', on ? 'text-white' : past ? 'text-faint-2' : 'text-ink')}>{d.getDate()}</T>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <T className="font-sans-bold text-[13px] text-muted">Starts at</T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {SLOTS.map(([h, m]) => {
              const on = !!slot && slot[0] === h && slot[1] === m;
              return (
                <Pressable key={`${h}:${m}`} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => setSlot([h, m])} className={cx('h-10 justify-center rounded-full px-3.5', on ? 'bg-ink' : 'border border-line bg-surface')}>
                  <T className={cx('font-sans-bold text-sm', on ? 'text-bg' : 'text-ink')}>{slotLabel(h, m)}</T>
                </Pressable>
              );
            })}
          </ScrollView>
          <Button title={day && slot ? `Set ${formatDateTime(new Date(day.getFullYear(), day.getMonth(), day.getDate(), slot[0], slot[1]))}` : 'Pick a day and a time'} disabled={!day || !slot} onPress={done} />
        </View>
      </BottomSheet>
    </>
  );
}
