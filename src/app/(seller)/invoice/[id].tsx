import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Check, Copy, Mail, Trash2 } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen, SkeletonRows, T, cx } from '@/components/ui';
import { BackHeader } from '@/features/seller/parts';
import { WhatsAppIcon } from '@/features/setup/parts';
import { INVOICE_PILL, dueLine, shortDay } from '@/features/seller/invoiceMeta';
import { deleteInvoice, emailInvoice, getInvoice, invoiceState, invoiceUrl, markInvoiceSent, recordInvoicePayment } from '@/api/invoices';
import { formatNaira } from '@/lib/format';
import { C } from '@/lib/theme';

export default function InvoiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const { data: v, isLoading, refetch } = useQuery({ queryKey: ['invoice', id], queryFn: () => getInvoice(id!), enabled: !!id });

  const refresh = () => { qc.invalidateQueries({ queryKey: ['invoices'] }); refetch(); };
  const sent = useMutation({ mutationFn: () => markInvoiceSent(id!), onSuccess: refresh });
  const email = useMutation({ mutationFn: () => emailInvoice(id!), onSuccess: () => { setNote(`Emailed to ${v?.customer_email}.`); refresh(); } });
  const paid = useMutation({ mutationFn: () => recordInvoicePayment(id!), onSuccess: () => { setNote('Marked as paid. A receipt was made.'); refresh(); } });
  const remove = useMutation({ mutationFn: () => deleteInvoice(id!), onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); router.back(); } });
  const error = sent.error || email.error || paid.error || remove.error;

  if (isLoading || !v) {
    return (
      <Screen>
        <BackHeader title="Invoice" fallback="/invoices" />
        <View className="px-5 pt-2">{isLoading ? <SkeletonRows count={3} /> : <T className="text-center text-muted">Invoice not found.</T>}</View>
      </Screen>
    );
  }

  const st = invoiceState(v);
  const pill = INVOICE_PILL[st];
  const url = invoiceUrl(v);
  const message = `Hello ${v.customer_name}, here is your invoice ${v.invoice_number} for ${formatNaira(v.total_amount)}. You can pay online here: ${url}`;

  const copy = async () => {
    await Clipboard.setStringAsync(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  // Sharing it yourself counts as sending it.
  const shareWhatsApp = async () => {
    const digits = (v.customer_whatsapp || v.customer_phone || '').replace(/\D/g, '').replace(/^0/, '234');
    const target = digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null;
    if (target) await Linking.openURL(target).catch(() => Share.share({ message }));
    else await Share.share({ message }).catch(() => {});
    if (v.status === 'draft') sent.mutate();
  };
  const confirmPaid = () => Alert.alert('Mark as paid?', `Only do this if ${v.customer_name} paid you another way, like cash or a direct transfer.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Mark as paid', onPress: () => paid.mutate() },
  ]);
  const confirmDelete = () => Alert.alert('Delete this invoice?', 'The link will stop working.', [
    { text: 'Keep it', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => remove.mutate() },
  ]);

  return (
    <Screen>
      <BackHeader
        title={v.invoice_number}
        fallback="/invoices"
        right={st !== 'paid' ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Delete invoice" onPress={confirmDelete} hitSlop={6} className="h-10 w-10 items-center justify-center rounded-full border border-line bg-surface">
            <Trash2 size={18} color={C.danger} strokeWidth={2} />
          </Pressable>
        ) : undefined}
      />
      <ScrollView contentContainerClassName="gap-3 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        <View className="gap-3 rounded-[22px] border border-line bg-surface p-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <T numberOfLines={1} className="text-xs text-muted">For {v.customer_name}</T>
              <T className="font-display text-[26px]">{formatNaira(v.total_amount)}</T>
            </View>
            <View style={{ backgroundColor: pill.bg }} className="rounded-full px-3 py-1.5">
              <T style={{ color: pill.fg }} className="font-sans-bold text-xs">{pill.label}</T>
            </View>
          </View>
          <T className={cx('text-[13px]', st === 'overdue' ? 'font-sans-bold text-danger' : 'text-muted')}>Issued {shortDay(v.issue_date)} · {st === 'paid' ? 'paid in full' : dueLine(v)}</T>
        </View>

        <View className="rounded-[22px] border border-line bg-surface px-4 py-1.5">
          {v.items.map((it, i) => (
            <View key={i} className="flex-row items-center gap-3 border-b border-line py-2.5">
              <View className="min-w-0 flex-1">
                <T numberOfLines={2} className="font-sans-bold text-sm">{it.name}</T>
                <T className="text-xs text-muted">{it.qty} × {formatNaira(it.price)}</T>
              </View>
              <T className="font-sans-bold text-sm">{formatNaira(it.qty * it.price)}</T>
            </View>
          ))}
          {v.discount_rate > 0 ? (
            <View className="flex-row justify-between pt-2.5"><T className="text-sm text-muted">Discount {v.discount_rate}%</T><T className="text-sm">−{formatNaira((v.subtotal * v.discount_rate) / 100)}</T></View>
          ) : null}
          <View className="flex-row justify-between py-2.5">
            <T className="font-sans-bold text-[15px]">Total</T>
            <T className="font-sans-bold text-[15px]">{formatNaira(v.total_amount)}</T>
          </View>
        </View>
        {v.notes ? <View className="rounded-[18px] bg-surface-2 p-3.5"><T className="text-sm text-muted">{v.notes}</T></View> : null}

        {st !== 'paid' ? (
          <View className="flex-row items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-4 pr-1.5">
            <T numberOfLines={1} className="flex-1 text-[13px] text-muted">{url.replace('https://', '')}</T>
            <Pressable accessibilityRole="button" accessibilityLabel="Copy invoice link" onPress={copy} className={cx('h-[34px] flex-row items-center gap-1.5 rounded-full px-3', copied ? 'bg-green' : 'bg-bg')}>
              {copied ? <Check size={14} color="#FFFFFF" strokeWidth={2.6} /> : <Copy size={14} color={C.ink} strokeWidth={2} />}
              <T className={cx('font-sans-bold text-xs', copied ? 'text-white' : 'text-ink')}>{copied ? 'Copied' : 'Copy'}</T>
            </Pressable>
          </View>
        ) : null}
        {note ? <T accessibilityLiveRegion="polite" className="text-center text-[13px] text-accent">{note}</T> : null}
        {error ? <T accessibilityLiveRegion="polite" className="text-center text-[13px] text-danger">{(error as Error).message || 'That didn’t work. Try again.'}</T> : null}
      </ScrollView>

      {st !== 'paid' ? (
        <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }} className="gap-2.5 px-5 pt-3">
          <Pressable accessibilityRole="button" onPress={shareWhatsApp} className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-green">
            <WhatsAppIcon size={20} color="#FFFFFF" />
            <T className="font-sans-bold text-base text-white">{v.status === 'draft' ? 'Send on WhatsApp' : 'Remind on WhatsApp'}</T>
          </Pressable>
          <View className="flex-row gap-2.5">
            {v.customer_email ? (
              <Pressable accessibilityRole="button" disabled={email.isPending} onPress={() => email.mutate()} className="h-[50px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl border-[1.5px] border-line bg-surface">
                {email.isPending ? <ActivityIndicator size="small" color={C.accent} /> : <Mail size={17} color={C.ink} strokeWidth={2} />}
                <T className="font-sans-bold text-sm">Email it</T>
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" disabled={paid.isPending} onPress={confirmPaid} className="h-[50px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl border-[1.5px] border-line bg-surface">
              {paid.isPending ? <ActivityIndicator size="small" color={C.accent} /> : <Check size={17} color={C.ink} strokeWidth={2.2} />}
              <T className="font-sans-bold text-sm">Mark as paid</T>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }} className="px-5 pt-3">
          <View className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-mint">
            <Check size={18} color={C.accent} strokeWidth={2.4} />
            <T className="font-sans-bold text-[15px] text-accent">Paid</T>
          </View>
        </View>
      )}
    </Screen>
  );
}
