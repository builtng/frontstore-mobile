import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, ReceiptText } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { Button, Screen, SkeletonRows, T, cx } from '@/components/ui';
import { BackHeader, Segmented } from '@/features/seller/parts';
import { LockedOrError } from '@/features/seller/ProGate';
import { getInvoices, invoiceState } from '@/api/invoices';
import { formatNaira } from '@/lib/format';
import { INVOICE_PILL, dueLine } from '@/features/seller/invoiceMeta';

type Tab = 'all' | 'unpaid' | 'overdue' | 'paid';

export default function Invoices() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('all');
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['invoices'], queryFn: getInvoices, retry: (n, e: any) => e?.status !== 403 && n < 2 });

  const all = data ?? [];
  const outstanding = all.filter((v) => ['sent', 'overdue'].includes(invoiceState(v))).reduce((s, v) => s + v.total_amount, 0);
  const overdue = all.filter((v) => invoiceState(v) === 'overdue').reduce((s, v) => s + v.total_amount, 0);
  const shown = useMemo(() => all.filter((v) => {
    const st = invoiceState(v);
    if (tab === 'unpaid') return st === 'sent' || st === 'draft';
    if (tab === 'overdue') return st === 'overdue';
    if (tab === 'paid') return st === 'paid';
    return true;
  }), [all, tab]);

  return (
    <Screen>
      <BackHeader title="Invoices" fallback="/home" />
      <ScrollView contentContainerClassName="gap-3.5 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <SkeletonRows count={4} />
        ) : error ? (
          <LockedOrError error={error} what="your invoices" feature="Invoices" onRetry={() => refetch()} />
        ) : (
          <>
            <View className="flex-row gap-2.5">
              <View className="flex-1 gap-1 rounded-[20px] bg-ink p-4">
                <T className="text-xs text-on-dark-2">Outstanding</T>
                <T numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} className="font-display text-[22px] text-white">{formatNaira(outstanding)}</T>
              </View>
              <View className="flex-1 gap-1 rounded-[20px] border border-line bg-surface p-4">
                <T className={cx('text-xs', overdue ? 'text-danger' : 'text-muted')}>Overdue</T>
                <T numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} className={cx('font-display text-[22px]', overdue ? 'text-danger' : 'text-ink')}>{formatNaira(overdue)}</T>
              </View>
            </View>
            <Segmented value={tab} onChange={setTab} options={[['all', 'All'], ['unpaid', 'Unpaid'], ['overdue', 'Overdue'], ['paid', 'Paid']] as const} />
            {shown.length ? (
              <View className="overflow-hidden rounded-[22px] border border-line bg-surface">
                {shown.map((v, i) => {
                  const pill = INVOICE_PILL[invoiceState(v)];
                  const what = v.items.length ? `${v.items[0].name}${v.items.length > 1 ? ` +${v.items.length - 1}` : ''}` : '';
                  return (
                    <Pressable key={v.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/invoice/[id]', params: { id: v.id } })} className={cx('flex-row items-center gap-3 p-3.5', i > 0 && 'border-t border-line')}>
                      <View className="min-w-0 flex-1 gap-1">
                        <View className="flex-row justify-between gap-2">
                          <T numberOfLines={1} className="shrink font-sans-bold text-[15px]">{v.customer_name}</T>
                          <T className="font-sans-bold text-[15px]">{formatNaira(v.total_amount)}</T>
                        </View>
                        <T numberOfLines={1} className="text-xs text-muted">{v.invoice_number}{what ? ` · ${what}` : ''}</T>
                        <View className="flex-row items-center gap-2">
                          <View style={{ backgroundColor: pill.bg }} className="rounded-full px-[9px] py-[3px]">
                            <T style={{ color: pill.fg }} className="font-sans-bold text-[11px]">{pill.label}</T>
                          </View>
                          <T className="text-xs text-muted">{dueLine(v)}</T>
                        </View>
                      </View>
                      <ChevronRight size={18} color="#9AA39E" strokeWidth={2} />
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View className="items-center gap-2 rounded-[22px] border border-line bg-surface px-6 py-8">
                <View className="h-14 w-14 items-center justify-center rounded-[18px] bg-mint"><ReceiptText size={24} color="#1E5E3A" strokeWidth={2} /></View>
                <T className="text-center font-sans-bold text-base">{all.length ? 'Nothing in this list' : 'Bill a customer'}</T>
                <T className="text-center text-sm leading-5 text-muted">{all.length ? 'Invoices move here as they’re sent and paid.' : 'For bulk and custom orders. Send the link on WhatsApp or email and they pay online.'}</T>
              </View>
            )}
          </>
        )}
      </ScrollView>
      {!error ? (
        <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }} className="px-5 pt-3">
          <Button title="New invoice" href="/invoice/new" />
        </View>
      ) : null}
    </Screen>
  );
}
