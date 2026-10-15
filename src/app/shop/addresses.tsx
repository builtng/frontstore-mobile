import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin } from 'lucide-react-native';
import { Button, Screen, T, cx } from '@/components/ui';
import { AccountHeader, BottomSheet, DashedAdd, SheetField } from '@/features/buyer/account';
import { getAddresses, addAddress, deleteAddress, setDefaultAddress } from '@/api/buyer';
import { Address } from '@/api/types';

// Field names match the backend's buyer_addresses table
const EMPTY = { label: 'Home', street: '', area: '', state: '', phone: '', landmark: '' };

export default function BuyerAddresses() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const set = (k: keyof typeof EMPTY) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const { data: liveAddresses = [], isError, refetch } = useQuery({ queryKey: ['buyer-addresses'], queryFn: getAddresses });

  const addMutation = useMutation({
    mutationFn: (payload: Omit<Address, 'id'>) => addAddress(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-addresses'] });
      close();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-addresses'] });
    },
  });

  const defaultMutation = useMutation({
    mutationFn: (id: number | string) => setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-addresses'] });
    },
  });

  const close = () => { setOpen(false); setForm(EMPTY); addMutation.reset(); };

  // A rider needs all of these; don't invent any of them
  const complete = (['street', 'area', 'state', 'phone'] as const).every((k) => form[k].trim());

  const save = () => {
    if (!complete) return;
    addMutation.mutate({
      label: form.label.trim() || 'Home',
      street: form.street.trim(),
      area: form.area.trim(),
      state: form.state.trim(),
      phone: form.phone.trim(),
      landmark: form.landmark.trim() || null,
      // The backend makes the first address the default
      is_default: liveAddresses.length === 0,
    });
  };

  const list: Address[] = liveAddresses;
  const actionError = (deleteMutation.error || defaultMutation.error) as Error | null;

  const confirmRemove = (a: Address) =>
    Alert.alert('Remove this address?', [a.street, a.area].filter(Boolean).join(', '), [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteMutation.mutate(a.id) },
    ]);

  return (
    <Screen>
      <AccountHeader title="Addresses" />
      <ScrollView contentContainerClassName="gap-3 px-4 pt-2" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {isError ? (
          <Pressable accessibilityRole="button" onPress={() => refetch()} className="rounded-2xl border border-line bg-surface p-4">
            <T className="text-sm text-danger">Couldn’t load your addresses. Tap to try again.</T>
          </Pressable>
        ) : null}
        {actionError ? <T className="text-sm text-danger">{actionError.message}</T> : null}
        {list.map((a) => {
          const isDef = a.is_default;
          return (
            <View key={a.id} className={cx('gap-2 rounded-[20px] bg-surface p-4', isDef ? 'border-2 border-green' : 'border border-line')}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <MapPin size={18} color="#0B6E4F" strokeWidth={2} />
                  <T className="font-sans-bold text-[15px] text-green">{a.label || 'Address'}</T>
                </View>
                {isDef ? (
                  <View className="rounded-full bg-mint-2 px-[9px] py-[3px]">
                    <T className="font-sans-bold text-[11px] text-deep">Default</T>
                  </View>
                ) : null}
              </View>
              <T className="text-sm leading-[21px] text-[#33403A]">
                {[a.street, a.area, a.state].filter(Boolean).join(', ')}
                {a.landmark ? `\nNear ${a.landmark}` : ''}
                {a.phone ? `\n${a.phone}` : ''}
              </T>
              <View className="flex-row items-center gap-4 border-t border-[#F0ECE3] pt-2">
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${a.label} address`} hitSlop={12} onPress={() => confirmRemove(a)}>
                  <T className="font-sans-bold text-sm text-danger">Remove</T>
                </Pressable>
                {!isDef ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={`Set ${a.label} as default address`} hitSlop={12} onPress={() => defaultMutation.mutate(a.id)} className="ml-auto">
                    <T className="font-sans-bold text-sm text-green">Set as default</T>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })}
        <DashedAdd label="+ Add a new address" onPress={() => setOpen(true)} />
        <T className="text-center text-[13px] text-muted">Stores only see the address you choose for their order.</T>
      </ScrollView>

      <BottomSheet visible={open} onClose={close}>
        <View className="flex-row items-center justify-between">
          <T className="font-display text-xl">New address</T>
          <Pressable accessibilityRole="button" onPress={close} hitSlop={12}>
            <T className="font-sans-bold text-[15px] text-muted">Cancel</T>
          </Pressable>
        </View>
        <SheetField label="Label" placeholder="Home, Work…" value={form.label} onChangeText={set('label')} />
        <SheetField label="Street address" placeholder="House number and street" value={form.street} onChangeText={set('street')} autoComplete="street-address" />
        <View className="flex-row gap-2.5">
          <SheetField className="flex-1" label="Area / town" placeholder="e.g. Yaba" value={form.area} onChangeText={set('area')} />
          <SheetField className="flex-1" label="State" placeholder="e.g. Lagos" value={form.state} onChangeText={set('state')} />
        </View>
        <SheetField label="Phone for the rider" placeholder="0803 000 0000" keyboardType="phone-pad" value={form.phone} onChangeText={set('phone')} maxLength={20} />
        <SheetField label="Landmark (optional)" placeholder="Helps the rider find you" value={form.landmark} onChangeText={set('landmark')} />
        {addMutation.error ? <T className="text-sm text-danger">{(addMutation.error as Error).message}</T> : null}
        <Button
          title={addMutation.isPending ? 'Saving...' : 'Save address'}
          className="h-[54px]"
          textClassName="text-base"
          disabled={!complete || addMutation.isPending}
          onPress={save}
        />
      </BottomSheet>
    </Screen>
  );
}
