import { useState, useEffect } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen, T } from '@/components/ui';
import { AccountHeader, Group, LinkRow, SwitchRow } from '@/features/buyer/account';
import { getNotificationPreferences, updateNotificationPreferences } from '@/api/buyer';
import type { NotificationPreferences } from '@/api/types';
import { PrivacyActions } from '@/features/account/PrivacyActions';
import { PasswordLogin } from '@/features/account/PasswordLogin';

type NoteKey = 'orderWa' | 'orderEmail' | 'push' | 'drops' | 'prices';

const KEY: Record<NoteKey, keyof NotificationPreferences> = {
  orderWa: 'whatsapp_order_updates', orderEmail: 'email_notifications', push: 'push_notifications', drops: 'new_drops', prices: 'price_drops',
};

const NOTES: [NoteKey, string, string][] = [
  ['orderWa', 'Order updates on WhatsApp', 'Paid, shipped, out for delivery'],
  ['orderEmail', 'Order emails and receipts', 'Sent to registered email'],
  ['push', 'App notifications', 'On this phone'],
  ['drops', 'New drops from stores I follow', 'At most one a week per store'],
  ['prices', 'Price drops on saved items', ''],
];

export default function BuyerSettings() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: prefs, isError, refetch } = useQuery({ queryKey: ['notification-preferences'], queryFn: getNotificationPreferences });

  const [notes, setNotes] = useState<Record<NoteKey, boolean>>({
    orderWa: true,
    orderEmail: true,
    push: true,
    drops: false,
    prices: true,
  });

  useEffect(() => {
    if (prefs) {
      setNotes({
        orderWa: prefs.whatsapp_order_updates ?? true,
        orderEmail: prefs.email_notifications ?? true,
        push: prefs.push_notifications ?? true,
        drops: prefs.new_drops ?? false,
        prices: prefs.price_drops ?? true,
      });
    }
  }, [prefs]);

  // Only the switch that changed is sent, so nothing else can be overwritten
  const updateMutation = useMutation({
    mutationFn: ({ k, val }: { k: NoteKey; val: boolean }) => updateNotificationPreferences({ [KEY[k]]: val }),
    onError: (_err, { k, val }) => setNotes((n) => ({ ...n, [k]: !val })),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notification-preferences'] }),
  });

  const handleToggle = (k: NoteKey, val: boolean) => {
    if (!prefs) return; // not loaded: the switches would show guesses
    setNotes((n) => ({ ...n, [k]: val }));
    updateMutation.mutate({ k, val });
  };


  return (
    <Screen>
      <AccountHeader title="Settings" />
      <ScrollView contentContainerClassName="gap-4 px-4 pt-2" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <Group title="Notifications">
          {isError ? (
            <Pressable accessibilityRole="button" onPress={() => refetch()} className="px-[18px] py-3.5">
              <T className="text-sm text-danger">Couldn’t load your notification settings. Tap to try again.</T>
            </Pressable>
          ) : prefs ? (
            NOTES.map(([k, label, sub]) => (
              <SwitchRow key={k} label={label} sub={sub || undefined} value={notes[k]} onChange={(v) => handleToggle(k, v)} />
            ))
          ) : (
            <T className="px-[18px] py-3.5 text-sm text-muted">Loading…</T>
          )}
          {updateMutation.error ? <T className="px-[18px] py-2 text-sm text-danger">{(updateMutation.error as Error).message}</T> : null}
        </Group>

        <Group title="Login & security">
          <LinkRow label="Login codes are sent by" value="Email" />
          <PasswordLogin />
        </Group>

        <Group title="Privacy">
          <PrivacyActions />
        </Group>
      </ScrollView>
    </Screen>
  );
}
