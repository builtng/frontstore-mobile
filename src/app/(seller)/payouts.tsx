import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { Check, CircleAlert, Clock, Landmark } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, T, cx } from '@/components/ui';
import { BackHeader, Grip, IconTile } from '@/features/seller/parts';
import { getWalletBalance, getPayoutHistory, requestWithdrawal, sendWithdrawalOtp } from '@/api/orders';
import { formatNaira } from '@/lib/format';
import { ContactEditSheet } from '@/features/account/ContactEditSheet';

const payoutStyle = {
  paid: { label: 'paid', tone: 'green' as const, Icon: Check, color: '#1E5E3A' },
  processing: { label: 'processing', tone: 'warn' as const, Icon: Clock, color: '#8A4A06' },
  failed: { label: 'failed, retrying', tone: 'danger' as const, Icon: CircleAlert, color: '#9A2C14' },
};
const fmtDay = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export default function Payouts() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [otpModal, setOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [addingEmail, setAddingEmail] = useState(false);
  const [sentKobo, setSentKobo] = useState<number | null>(null);

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: getWalletBalance,
  });

  const { data: history } = useQuery({
    queryKey: ['payout-history'],
    queryFn: getPayoutHistory,
  });

  const withdrawMutation = useMutation({
    mutationFn: () => requestWithdrawal(availKobo, otpCode),
    onSuccess: () => {
      setSentKobo(availKobo);
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['seller-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['payout-history'] });
      setOtpModal(false);
      setOtpCode('');
      setSubmitting(false);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Withdrawal failed. Please check OTP.');
      setSubmitting(false);
    },
  });

  const handlePayOutNow = async () => {
    if (sending) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await sendWithdrawalOtp();
      setSentTo(res?.sent_to ?? null);
      setResent(otpModal);
      setOtpModal(true);
    } catch (err: any) {
      // No code went out, so don't ask for one.
      setOtpModal(false);
      if (err?.data?.errors?.email) setNeedsEmail(true);
      else setSendError(err?.message || 'We couldn’t send your code. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const confirmWithdrawal = () => {
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    withdrawMutation.mutate();
  };

  const availKobo = wallet?.available_balance_kobo ?? 0;
  const pendingKobo = wallet?.pending_balance_kobo ?? 0;
  const bankName = wallet?.bank_name || 'Bank account';
  const accNo = wallet?.account_number ? `••••${wallet.account_number.slice(-4)}` : 'Not linked';
  const accHolder = wallet?.account_name || 'Payout Account';

  return (
    <Screen>
      <BackHeader title="Payouts" fallback="/home" />
      <ScrollView contentContainerClassName="gap-3.5 px-5 pb-8 pt-1" showsVerticalScrollIndicator={false}>
        <View className="gap-3.5 rounded-[26px] bg-ink p-5">
          <T className="text-[13px] text-on-dark-2">Available to withdraw</T>
          <T numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} className="font-display text-[40px] leading-[44px] tracking-[-0.8px] text-white">{formatNaira(availKobo / 100)}</T>
          <View className="flex-row gap-2">
            <View className="flex-1 rounded-[14px] bg-white/10 px-3 py-2.5">
              <T className="text-[11px] text-on-dark-2">On the way</T>
              <T className="font-sans-bold text-[15px] text-white">{formatNaira(pendingKobo / 100)}</T>
            </View>
            <View className="flex-1 rounded-[14px] bg-white/10 px-3 py-2.5">
              <T className="text-[11px] text-on-dark-2">Next payout</T>
              <T className="font-sans-bold text-[15px] text-white">10:00am, next working day</T>
            </View>
          </View>
          {sentKobo != null ? (
            <View accessibilityLiveRegion="polite" className="h-[52px] flex-row items-center justify-center gap-2 rounded-2xl bg-leaf/15">
              <Check size={18} color="#6FD3A4" strokeWidth={2.4} />
              <T className="font-sans-bold text-[15px] text-leaf">{formatNaira(sentKobo / 100)} is on its way</T>
            </View>
          ) : availKobo > 0 ? (
            <Pressable accessibilityRole="button" onPress={handlePayOutNow} disabled={sending} className="h-[52px] flex-row items-center justify-center gap-2 rounded-2xl bg-gold">
              {sending ? <ActivityIndicator color="#2A1B05" size="small" /> : null}
              <T numberOfLines={1} className="font-sans-bold text-base text-[#2A1B05]">{sending ? 'Sending your code…' : wallet?.account_number ? `Withdraw to ${bankName} •••• ${wallet.account_number.slice(-4)}` : 'Withdraw now'}</T>
            </Pressable>
          ) : (
            <T className="text-[13px] text-on-dark">Sales land here once orders are paid.</T>
          )}
          {sendError ? <T accessibilityLiveRegion="polite" className="text-[13px] text-[#FFB4A8]">{sendError}</T> : null}
        </View>

        {needsEmail ? (
          <View className="gap-2 rounded-[20px] bg-warn-bg p-4">
            <T className="font-sans-bold text-warn-fg">Add your email to get paid</T>
            <T className="text-[13px] text-warn-fg">Your payout code is sent to your email, and your account doesn’t have one yet.</T>
            <Pressable accessibilityRole="button" onPress={() => setAddingEmail(true)} className="mt-1 h-11 items-center justify-center self-start rounded-xl bg-ink px-5">
              <T className="font-sans-bold text-sm text-white">Add email</T>
            </Pressable>
          </View>
        ) : null}

        <View className="flex-row items-center gap-3 rounded-[22px] border border-line bg-surface px-4 py-3.5">
          <IconTile><Landmark size={19} color="#1E5E3A" strokeWidth={2} /></IconTile>
          <View className="flex-1">
            <T className="font-sans-bold text-[15px]">{accHolder}</T>
            <T className="text-[13px] text-muted">{bankName} · {accNo}</T>
          </View>
          <Link href="/payout" asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Change payout account" hitSlop={4} className="h-9 justify-center rounded-full bg-mint px-3">
              <T className="font-sans-bold text-[13px] text-green">Change</T>
            </Pressable>
          </Link>
        </View>

        <View className="flex-row items-baseline justify-between pt-1">
          <T className="font-display text-[17px]">History</T>
          <T className="text-[13px] text-muted">Paystack transfer fees apply</T>
        </View>
        <View className="overflow-hidden rounded-[22px] border border-line bg-surface">
          {history && history.length > 0 ? (
            history.map((r, i) => {
              const st = payoutStyle[r.status] || payoutStyle.paid;
              return (
                <View key={r.id ?? i} className={cx('flex-row items-center gap-3 px-4 py-3.5', i > 0 && 'border-t border-line')}>
                  <IconTile tone={st.tone}><st.Icon size={19} color={st.color} strokeWidth={2} /></IconTile>
                  <View className="min-w-0 flex-1">
                    <T numberOfLines={1} className="font-sans-bold text-[15px]">Withdrawal{r.bank_name ? ` to ${r.bank_name}` : ''}</T>
                    <T numberOfLines={1} className="text-xs text-muted">{fmtDay(r.date)} · {st.label}{r.orders_count ? ` · ${r.orders_count} orders` : ''}</T>
                  </View>
                  <T className="font-sans-bold text-[15px]">{formatNaira(r.amount_kobo / 100)}</T>
                </View>
              );
            })
          ) : (
            <View className="items-center p-5">
              <T className="text-sm text-muted">No payouts yet.</T>
            </View>
          )}
        </View>
      </ScrollView>

      {/* OTP Confirmation Modal */}
      <Modal visible={otpModal} transparent animationType="fade" onRequestClose={() => setOtpModal(false)}>
        <View className="flex-1 justify-end">
          <Pressable onPress={() => setOtpModal(false)} className="absolute inset-0 bg-[rgba(14,26,21,0.5)]" />
          <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }} className="gap-4 rounded-t-[28px] bg-surface px-5 pt-3">
            <Grip />
            <T className="font-display-x text-[22px]">Confirm payout</T>
            <T className="text-sm text-muted">{resent ? 'New code sent' : 'We sent a 6-digit code'} to {sentTo || 'your email'}. Check your spam folder too. Enter it to withdraw {formatNaira(availKobo / 100)}.</T>

            {errorMsg ? (
              <View className="rounded-2xl bg-danger-bg p-3">
                <T className="font-sans-medium text-[13px] text-danger">{errorMsg}</T>
              </View>
            ) : null}

            <View className="gap-1.5">
              <T className="font-sans-bold text-[13px] text-muted">6-digit code</T>
              <TextInput
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="123456"
                className="h-14 rounded-2xl border-[1.5px] border-line bg-surface px-4 text-center font-display-x text-2xl tracking-[6px] text-ink"
              />
            </View>

            <Pressable accessibilityRole="button" onPress={handlePayOutNow} disabled={sending} hitSlop={8} className="self-start">
              <T className="font-sans-bold text-sm text-green">{sending ? 'Sending…' : 'Didn’t get it? Send a new code'}</T>
            </Pressable>

            <Pressable accessibilityRole="button" onPress={confirmWithdrawal} disabled={submitting || otpCode.length < 6} className={cx('h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-green', otpCode.length < 6 && 'opacity-40')}>
              {submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
              <T className="font-sans-bold text-base text-white">{submitting ? 'Sending…' : `Withdraw ${formatNaira(availKobo / 100)}`}</T>
            </Pressable>
          </View>
        </View>
      </Modal>
      <ContactEditSheet kind={addingEmail ? 'email' : null} onClose={() => { setAddingEmail(false); setNeedsEmail(false); }} />
    </Screen>
  );
}
