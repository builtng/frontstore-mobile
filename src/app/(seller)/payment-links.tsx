import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Check, Copy, Link2, Share2, Trash2 } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Screen, SkeletonRows, T, cx } from '@/components/ui';
import { BottomSheet } from '@/features/buyer/account';
import { BackHeader, Segmented, Toggle } from '@/features/seller/parts';
import { LockedOrError } from '@/features/seller/ProGate';
import { createPaymentLink, deletePaymentLink, getPaymentLinks, linkUrl, setPaymentLinkActive, type PaymentLink } from '@/api/paymentLinks';
import { formatNaira } from '@/lib/format';

const kindLine = (l: PaymentLink) => {
  const amount = l.allow_custom_amount ? `Any amount · min ${formatNaira(l.amount)}` : `Fixed · ${formatNaira(l.amount)}`;
  const once = l.type === 'one_time' ? ' · pays once' : '';
  const state = l.status === 'disabled' ? ' · paused' : l.status === 'paid' ? ' · paid' : '';
  return amount + once + state;
};

function LinkRow({ l, first, copied, onCopy, onShare, onToggle, onDelete, busy }: {
  l: PaymentLink; first: boolean; copied: boolean; busy: boolean;
  onCopy: () => void; onShare: () => void; onToggle: (on: boolean) => void; onDelete: () => void;
}) {
  const on = l.status === 'active';
  return (
    <View style={{ opacity: on || l.status === 'paid' ? 1 : 0.55 }} className={cx('gap-2.5 p-3.5', !first && 'border-t border-line')}>
      <View className="flex-row items-start gap-3">
        <View className="min-w-0 flex-1 gap-px">
          <T numberOfLines={1} className="font-sans-bold text-[15px]">{l.title}</T>
          <T numberOfLines={1} className="text-xs text-muted">{kindLine(l)}</T>
        </View>
        <View className="items-end gap-px">
          <T className="font-sans-bold text-[15px]">{formatNaira(l.amount_received)}</T>
          <T className="text-xs text-muted">{l.amount_received > 0 ? 'collected' : 'No payments yet'}</T>
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        {l.status === 'paid' ? (
          <View className="rounded-full bg-mint px-2.5 py-1"><T className="font-sans-bold text-xs text-green">Paid</T></View>
        ) : (
          <Toggle label={`${l.title} is taking payments`} value={on} onChange={onToggle} />
        )}
        <View className="flex-1" />
        {l.amount_received <= 0 ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${l.title}`} disabled={busy} onPress={onDelete} className="h-[34px] w-[34px] items-center justify-center rounded-full border border-line">
            <Trash2 size={15} color="#9A2C14" strokeWidth={2} />
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" accessibilityLabel={`Share ${l.title}`} onPress={onShare} className="h-[34px] w-[34px] items-center justify-center rounded-full border border-line">
          <Share2 size={15} color="#0E1A15" strokeWidth={2} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Copy link for ${l.title}`} onPress={onCopy} className={cx('h-[34px] flex-row items-center gap-1.5 rounded-full px-3', copied ? 'bg-green' : 'border border-line bg-surface')}>
          {copied ? <Check size={14} color="#FFFFFF" strokeWidth={2.6} /> : <Copy size={14} color="#0E1A15" strokeWidth={2} />}
          <T className={cx('font-sans-bold text-xs', copied ? 'text-white' : 'text-ink')}>{copied ? 'Copied' : 'Copy'}</T>
        </Pressable>
      </View>
    </View>
  );
}

/** Bottom sheet to make a new link: what it's for, the amount, fixed or any amount, once or many times. */
function NewLinkSheet({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: (l: PaymentLink) => void }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [custom, setCustom] = useState<'fixed' | 'any'>('fixed');
  const [type, setType] = useState<'reusable' | 'one_time'>('reusable');
  const create = useMutation({
    mutationFn: () => createPaymentLink({ title: title.trim(), amount: Number(amount), allow_custom_amount: custom === 'any', type }),
    onSuccess: (l) => { setTitle(''); setAmount(''); setCustom('fixed'); setType('reusable'); onCreated(l); },
  });
  const ok = title.trim().length > 0 && Number(amount) >= 1;
  return (
    <BottomSheet visible={visible} onClose={() => !create.isPending && onClose()}>
      <View className="gap-3.5 py-1">
        <T className="font-display-x text-[22px]">New payment link</T>
        <View className="gap-1.5">
          <T className="font-sans-bold text-[13px] text-muted">What is it for?</T>
          <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Aso-ebi deposit" placeholderTextColor="#8A948F" maxLength={150} accessibilityLabel="What is it for" className="h-14 rounded-2xl border-[1.5px] border-line bg-surface px-4 font-sans-semibold text-[17px] text-ink" />
        </View>
        <Segmented value={custom} onChange={setCustom} options={[['fixed', 'Fixed amount'], ['any', 'Customer chooses']] as const} />
        <View className="gap-1.5">
          <T className="font-sans-bold text-[13px] text-muted">{custom === 'any' ? 'Smallest amount' : 'Amount'}</T>
          <View className="h-14 flex-row items-center gap-1 rounded-2xl border-[1.5px] border-line bg-surface px-4">
            <T className="font-sans-semibold text-[17px] text-muted">₦</T>
            <TextInput value={amount} onChangeText={(v) => setAmount(v.replace(/\D/g, '').slice(0, 9))} keyboardType="number-pad" placeholder="25000" placeholderTextColor="#8A948F" accessibilityLabel="Amount in naira" className="h-full flex-1 font-sans-semibold text-[17px] text-ink" />
          </View>
        </View>
        <Segmented value={type} onChange={setType} options={[['reusable', 'Many payments'], ['one_time', 'Pays once']] as const} />
        {create.error ? <T className="text-[13px] text-danger">{(create.error as Error).message || 'Couldn’t create the link. Try again.'}</T> : null}
        <Button title={create.isPending ? 'Creating…' : 'Create link'} disabled={!ok || create.isPending} onPress={() => create.mutate()} left={create.isPending ? <ActivityIndicator color="#FFFFFF" size="small" /> : undefined} />
      </View>
    </BottomSheet>
  );
}

export default function PaymentLinks() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { data: links, isLoading, error, refetch } = useQuery({ queryKey: ['payment-links'], queryFn: getPaymentLinks, retry: (n, e: any) => e?.status !== 403 && n < 2 });

  const toggle = useMutation({
    mutationFn: ({ l, on }: { l: PaymentLink; on: boolean }) => setPaymentLinkActive(l.id, on),
    onMutate: ({ l, on }) => {
      const before = qc.getQueryData<PaymentLink[]>(['payment-links']);
      qc.setQueryData<PaymentLink[]>(['payment-links'], (cur) => cur?.map((x) => (x.id === l.id ? { ...x, status: on ? 'active' : 'disabled' } : x)));
      return { before };
    },
    onError: (_e, _v, ctx) => ctx?.before && qc.setQueryData(['payment-links'], ctx.before),
    onSettled: () => qc.invalidateQueries({ queryKey: ['payment-links'] }),
  });
  const remove = useMutation({
    mutationFn: (l: PaymentLink) => deletePaymentLink(l.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-links'] }),
  });

  const copy = async (l: PaymentLink) => {
    await Clipboard.setStringAsync(linkUrl(l));
    setCopiedId(l.id);
    setTimeout(() => setCopiedId((c) => (c === l.id ? null : c)), 1800);
  };
  const share = (l: PaymentLink) => Share.share({ message: `${l.title}: pay here ${linkUrl(l)}` }).catch(() => {});

  const list = links ?? [];
  const collected = list.reduce((s, l) => s + l.amount_received, 0);
  const activeCount = list.filter((l) => l.status === 'active').length;
  const actionError = toggle.error || remove.error;

  return (
    <Screen>
      <BackHeader title="Payment links" fallback="/home" />
      <ScrollView contentContainerClassName="gap-3.5 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <SkeletonRows count={4} />
        ) : error ? (
          <LockedOrError error={error} what="your payment links" feature="Payment links" onRetry={() => refetch()} />
        ) : (
          <>
            <View className="flex-row gap-2.5">
              <View className="flex-1 gap-1 rounded-[20px] bg-green p-4">
                <T className="text-xs text-mint-2">Collected so far</T>
                <T numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} className="font-display text-[22px] text-white">{formatNaira(collected)}</T>
              </View>
              <View className="flex-1 gap-1 rounded-[20px] border border-line bg-surface p-4">
                <T className="text-xs text-muted">Active links</T>
                <T className="font-display text-[22px]">{activeCount} of {list.length}</T>
              </View>
            </View>
            {actionError ? <View className="rounded-2xl bg-danger-bg p-3"><T className="text-sm text-danger">{(actionError as Error).message || 'That didn’t save. Try again.'}</T></View> : null}
            {list.length ? (
              <View className="overflow-hidden rounded-[22px] border border-line bg-surface">
                {list.map((l, i) => (
                  <LinkRow
                    key={l.id}
                    l={l}
                    first={i === 0}
                    copied={copiedId === l.id}
                    busy={remove.isPending}
                    onCopy={() => copy(l)}
                    onShare={() => share(l)}
                    onToggle={(on) => toggle.mutate({ l, on })}
                    onDelete={() => remove.mutate(l)}
                  />
                ))}
              </View>
            ) : (
              <View className="items-center gap-2 rounded-[22px] border border-line bg-surface px-6 py-8">
                <View className="h-14 w-14 items-center justify-center rounded-[18px] bg-mint"><Link2 size={24} color="#1E5E3A" strokeWidth={2} /></View>
                <T className="text-center font-sans-bold text-base">Get paid without a product</T>
                <T className="text-center text-sm leading-5 text-muted">Deposits, fees, classes, “pay what you owe”. Make a link, send it on WhatsApp, and the money comes to your wallet.</T>
              </View>
            )}
          </>
        )}
      </ScrollView>
      {!error ? (
        <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }} className="px-5 pt-3">
          <Button title="New payment link" onPress={() => setCreating(true)} />
        </View>
      ) : null}
      <NewLinkSheet
        visible={creating}
        onClose={() => setCreating(false)}
        onCreated={(l) => { setCreating(false); qc.invalidateQueries({ queryKey: ['payment-links'] }); copy(l); }}
      />
    </Screen>
  );
}
