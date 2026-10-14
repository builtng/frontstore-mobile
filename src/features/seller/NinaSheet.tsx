import { Pressable, View } from 'react-native';
import { Sparkles, X } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, T } from '@/components/ui';
import { BottomSheet, SwitchRow } from '@/features/buyer/account';
import { updateStore } from '@/api/store';
import type { Store } from '@/api/types';

export type NinaState = 'on' | 'off' | 'needs_plan';

/** Nina answers customers only on Pro and above, and only while the merchant has her switched on */
export function ninaState(store?: Store | null): NinaState | null {
  if (!store) return null;
  if (!store.nina_available) return 'needs_plan';
  return store.nina_enabled === false ? 'off' : 'on';
}

export const NINA_LABEL: Record<NinaState, string> = { on: 'On', off: 'Off', needs_plan: 'Not in plan' };

export function NinaSheet({ store, visible, onClose }: { store?: Store | null; visible: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const state = ninaState(store);

  const toggle = useMutation({
    mutationFn: (on: boolean) => updateStore({ nina_enabled: on }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seller-store'] }),
  });

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="gap-3 py-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Sparkles size={20} color="#0B6E4F" />
            <T className="font-display text-xl">Nina AI Assistant</T>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} onPress={onClose}>
            <X size={20} color="#0E1A15" />
          </Pressable>
        </View>
        <T className="text-sm leading-[21px] text-muted-2">
          Nina answers customer messages on your store’s WhatsApp number: product questions, stock, and taking orders.
        </T>

        {state === 'needs_plan' ? (
          <T className="text-sm text-muted-2">Nina isn’t included in your current plan, so customers get your catalog link instead.</T>
        ) : state ? (
          <View className="overflow-hidden rounded-2xl border border-line bg-surface">
            <SwitchRow
              label="Let Nina reply to customers"
              sub={state === 'on' ? 'On: Nina answers on WhatsApp' : 'Off: customers get your catalog link'}
              value={toggle.isPending ? !!toggle.variables : state === 'on'}
              onChange={(v) => toggle.mutate(v)}
            />
          </View>
        ) : null}
        {toggle.error ? <T className="text-sm text-danger">{(toggle.error as Error).message}</T> : null}
        <Button title="Done" kind="dark" className="h-11" onPress={onClose} />
      </View>
    </BottomSheet>
  );
}
