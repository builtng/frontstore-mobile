import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, X } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen, T, cx } from '@/components/ui';
import { BackHeader, Segmented } from '@/features/seller/parts';
import { createInvoice } from '@/api/invoices';
import { formatNaira } from '@/lib/format';

type Line = { name: string; qty: string; price: string };
const box = 'h-[50px] rounded-[14px] border border-line bg-surface px-3.5 font-sans-semibold text-base text-ink';
const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const DUE: ReadonlyArray<readonly ['0' | '7' | '14' | '30', string]> = [['0', 'Today'], ['7', '7 days'], ['14', '14 days'], ['30', '30 days']];

function Label({ children }: { children: string }) {
  return <T className="font-sans-bold text-[13px] text-muted">{children}</T>;
}

/** New invoice: who it's for, what they're paying for, and when it's due. It's saved as a draft. */
export default function NewInvoice() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [lines, setLines] = useState<Line[]>([{ name: '', qty: '1', price: '' }]);
  const [due, setDue] = useState<'0' | '7' | '14' | '30'>('7');
  const [notes, setNotes] = useState('');

  const items = lines
    .map((l) => ({ name: l.name.trim(), qty: Math.max(1, parseInt(l.qty, 10) || 1), price: Number(l.price) || 0 }))
    .filter((l) => l.name && l.price > 0);
  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  const emailOk = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const ready = name.trim().length > 0 && items.length > 0 && emailOk;

  const save = useMutation({
    mutationFn: () => {
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + Number(due));
      return createInvoice({
        customer_name: name.trim(),
        customer_email: email.trim() || null,
        customer_whatsapp: whatsapp.trim() || null,
        issue_date: isoDay(today),
        due_date: isoDay(dueDate),
        items,
        notes: notes.trim() || null,
      });
    },
    onSuccess: (v) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      router.replace({ pathname: '/invoice/[id]', params: { id: v.id } });
    },
  });

  const setLine = (i: number, patch: Partial<Line>) => setLines((cur) => cur.map((l, k) => (k === i ? { ...l, ...patch } : l)));

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <BackHeader title="New invoice" fallback="/invoices" />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-3.5 px-5 pb-6 pt-1.5" showsVerticalScrollIndicator={false}>
          <View className="gap-1.5">
            <Label>Customer name</Label>
            <TextInput value={name} onChangeText={setName} placeholder="e.g. Mrs Funmi Bello" placeholderTextColor="#8A948F" maxLength={150} accessibilityLabel="Customer name" className={box} />
          </View>
          <View className="flex-row gap-2.5">
            <View className="min-w-0 flex-1 gap-1.5">
              <Label>WhatsApp (optional)</Label>
              <TextInput value={whatsapp} onChangeText={setWhatsapp} placeholder="0803 000 0000" placeholderTextColor="#8A948F" keyboardType="phone-pad" accessibilityLabel="Customer WhatsApp number, optional" className={box} />
            </View>
            <View className="min-w-0 flex-1 gap-1.5">
              <Label>Email (optional)</Label>
              <TextInput value={email} onChangeText={setEmail} placeholder="For emailing it" placeholderTextColor="#8A948F" keyboardType="email-address" autoCapitalize="none" accessibilityLabel="Customer email, optional" className={cx(box, !emailOk && 'border-danger')} />
            </View>
          </View>

          <View className="gap-2">
            <Label>What they’re paying for</Label>
            <View className="overflow-hidden rounded-[18px] border border-line bg-surface">
              {lines.map((l, i) => (
                <View key={i} className={cx('gap-2 p-3', i > 0 && 'border-t border-line')}>
                  <View className="flex-row items-center gap-2">
                    <TextInput value={l.name} onChangeText={(v) => setLine(i, { name: v })} placeholder="Item, e.g. Aso-ebi gown" placeholderTextColor="#8A948F" accessibilityLabel={`Item ${i + 1}`} className="h-11 min-w-0 flex-1 font-sans-semibold text-base text-ink" />
                    {lines.length > 1 ? (
                      <Pressable accessibilityRole="button" accessibilityLabel={`Remove item ${i + 1}`} hitSlop={8} onPress={() => setLines((cur) => cur.filter((_, k) => k !== i))} className="h-8 w-8 items-center justify-center rounded-full bg-bg">
                        <X size={14} color="#5F6B65" strokeWidth={2.4} />
                      </Pressable>
                    ) : null}
                  </View>
                  <View className="flex-row gap-2">
                    <View className="h-11 w-[90px] flex-row items-center gap-1 rounded-xl bg-bg px-3">
                      <T className="text-sm text-muted">Qty</T>
                      <TextInput value={l.qty} onChangeText={(v) => setLine(i, { qty: v.replace(/\D/g, '').slice(0, 4) })} keyboardType="number-pad" accessibilityLabel={`Quantity for item ${i + 1}`} className="h-full flex-1 font-sans-bold text-base text-ink" />
                    </View>
                    <View className="h-11 flex-1 flex-row items-center gap-1 rounded-xl bg-bg px-3">
                      <T className="text-sm text-muted">₦</T>
                      <TextInput value={l.price} onChangeText={(v) => setLine(i, { price: v.replace(/\D/g, '').slice(0, 9) })} keyboardType="number-pad" placeholder="Price each" placeholderTextColor="#8A948F" accessibilityLabel={`Price each for item ${i + 1}`} className="h-full flex-1 font-sans-bold text-base text-ink" />
                    </View>
                  </View>
                </View>
              ))}
              <Pressable accessibilityRole="button" onPress={() => setLines((cur) => [...cur, { name: '', qty: '1', price: '' }])} className="flex-row items-center justify-center gap-1.5 border-t border-line py-3">
                <Plus size={16} color="#1E5E3A" strokeWidth={2.4} />
                <T className="font-sans-bold text-sm text-green">Add another item</T>
              </Pressable>
            </View>
          </View>

          <View className="gap-2">
            <Label>Payment due in</Label>
            <Segmented value={due} onChange={setDue} options={DUE} />
          </View>

          <View className="gap-1.5">
            <Label>Note (optional)</Label>
            <TextInput value={notes} onChangeText={setNotes} multiline textAlignVertical="top" placeholder="e.g. 50% deposit now, balance on pickup" placeholderTextColor="#8A948F" accessibilityLabel="Note, optional" className="min-h-[80px] rounded-[14px] border border-line bg-surface px-3.5 py-3 font-sans text-[15px] text-ink" />
          </View>
        </ScrollView>

        <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }} className="gap-2 px-5 pt-3">
          {save.error ? <T className="text-center text-[13px] text-danger">{(save.error as Error).message || 'Couldn’t save the invoice. Try again.'}</T> : null}
          <View className="flex-row items-baseline justify-between px-1">
            <T className="text-sm text-muted">Total</T>
            <T className="font-display text-xl">{formatNaira(total)}</T>
          </View>
          <Pressable accessibilityRole="button" disabled={!ready || save.isPending} onPress={() => save.mutate()} className={cx('h-[54px] flex-row items-center justify-center gap-2 rounded-2xl', ready ? 'bg-green' : 'bg-[#BFD3C6]')}>
            {save.isPending ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
            <T className="font-sans-bold text-base text-white">{save.isPending ? 'Saving…' : 'Create invoice'}</T>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
