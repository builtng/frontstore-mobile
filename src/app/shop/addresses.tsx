import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin } from 'lucide-react-native';
import { Button, Screen, T, cx } from '@/components/ui';
import { AccountHeader, BottomSheet, DashedAdd, SheetField } from '@/features/buyer/account';
import { getAddresses, addAddress, deleteAddress, setDefaultAddress } from '@/api/buyer';
import { Address } from '@/api/types';

const EMPTY = { label: 'Home', recipient_name: 'Customer', street: '', city: '', state: 'Lagos', phone_number: '', landmark: '' };

export default function BuyerAddresses() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const set = (k: keyof typeof EMPTY) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const { data: liveAddresses = [] } = useQuery({ queryKey: ['buyer-addresses'], queryFn: getAddresses });

  const addMutation = useMutation({
    mutationFn: (payload: Omit<Address, 'id'>) => addAddress(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-addresses'] });
      close();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-addresses'] });
    },
  });

  const defaultMutation = useMutation({
    mutationFn: (id: number) => setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-addresses'] });
    },
  });

  const close = () => { setOpen(false); setForm(EMPTY); };

  const save = () => {
    addMutation.mutate({
      label: form.label || 'Home',
      recipient_name: form.recipient_name || 'Customer',
      street: form.street.trim(),
      city: form.city.trim() || 'Lagos',
      state: form.state.trim() || 'Lagos',
      phone_number: form.phone_number.trim() || '08000000000',
      landmark: form.landmark.trim(),
      is_default: false,
    });
  };

  const list: Address[] = liveAddresses;

  return (
    <Screen>
      <AccountHeader title="Addresses" />
      <ScrollView contentContainerClassName="gap-3 px-4 pt-2" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
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
                <T className="font-sans-bold text-sm text-ink">{a.recipient_name}</T>
                {`\n${a.street}${a.city ? `, ${a.city}` : ''}\n${a.phone_number}`}
              </T>
              <View className="flex-row items-center gap-4 border-t border-[#F0ECE3] pt-2">
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${a.label} address`} hitSlop={12} onPress={() => deleteMutation.mutate(typeof a.id === 'number' ? a.id : Number(a.id))}>
                  <T className="font-sans-bold text-sm text-danger">Remove</T>
                </Pressable>
                {!isDef ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={`Set ${a.label} as default address`} hitSlop={12} onPress={() => defaultMutation.mutate(typeof a.id === 'number' ? a.id : Number(a.id))} className="ml-auto">
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
        <SheetField label="Full Name" placeholder="Recipient name" value={form.recipient_name} onChangeText={set('recipient_name')} />
        <SheetField label="Street address" placeholder="House number and street" value={form.street} onChangeText={set('street')} autoComplete="street-address" />
        <View className="flex-row gap-2.5">
          <SheetField className="flex-1" label="City" placeholder="e.g. Yaba" value={form.city} onChangeText={set('city')} />
          <SheetField className="flex-1" label="State" value={form.state} onChangeText={set('state')} />
        </View>
        <SheetField label="Phone for the rider" placeholder="0803 000 0000" keyboardType="phone-pad" value={form.phone_number} onChangeText={set('phone_number')} />
        <SheetField label="Landmark (optional)" placeholder="Helps the rider find you" value={form.landmark} onChangeText={set('landmark')} />
        <Button title="Save address" className="h-[54px]" textClassName="text-base" disabled={!form.street.trim()} onPress={save} />
      </BottomSheet>
    </Screen>
  );
}
