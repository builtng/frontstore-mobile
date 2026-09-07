import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowUpRight,
  Receipt,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  HelpCircle,
  X,
  Wallet as WalletIcon,
  ShieldCheck,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { useToast } from '@/components/ui/Toast';
import { merchantApi } from '@/services/merchantApi';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { format } from 'date-fns';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

export default function WalletScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme, isDark } = useTheme();
  const toast = useToast();
  const haptics = useHaptics();
  const [refreshing, setRefreshing] = useState(false);

  // Modal & OTP State
  const [modalVisible, setModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const { data: wallet, isLoading, refetch } = useQuery({
    queryKey: ['wallet'],
    queryFn: merchantApi.getWallet,
    select: (r) => r.data,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Step 1: Send OTP to merchant email / whatsapp
  const handleSendOtp = async () => {
    const amt = parseFloat(withdrawAmount);
    const available = wallet?.withdrawable_balance ?? wallet?.balance ?? 0;

    if (!amt || isNaN(amt) || amt <= 0) {
      toast.warning('Please enter a valid amount.');
      return;
    }
    if (amt > available) {
      toast.error('Amount exceeds your withdrawable balance.');
      return;
    }

    try {
      setOtpLoading(true);
      const res = await merchantApi.sendWithdrawalOtp();
      setOtpSent(true);
      haptics.success();
      toast.success(res?.message || 'Verification code sent to your registered email.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to send verification code.';
      toast.error(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 2: Confirm Withdrawal with OTP
  const withdrawMutation = useMutation({
    mutationFn: (payload: { amount: number; otp_code: string }) =>
      merchantApi.withdraw(payload),
    onSuccess: (data: any) => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setModalVisible(false);
      setWithdrawAmount('');
      setOtpCode('');
      setOtpSent(false);
      Alert.alert(
        'Payout Requested! 🎉',
        data?.message || 'Your withdrawal request has been submitted successfully to your settlement bank account.'
      );
    },
    onError: (err: any) => {
      haptics.error();
      const msg = err?.response?.data?.message || err?.message || 'Failed to process withdrawal request.';
      Alert.alert('Withdrawal Failed', msg);
    },
  });

  const handleConfirmWithdraw = () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      toast.warning('Please enter a valid amount.');
      return;
    }
    if (!otpCode || otpCode.trim().length !== 6) {
      toast.warning('Please enter the 6-digit verification code.');
      return;
    }

    withdrawMutation.mutate({
      amount: amt,
      otp_code: otpCode.trim(),
    });
  };

  const handleOpenWithdrawModal = () => {
    const isVerified = wallet?.bank_account_verified;
    if (!isVerified) {
      Alert.alert(
        'Bank Account Required',
        'Please link and verify your settlement bank account before requesting a withdrawal.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Settings', onPress: () => router.push('/(merchant)/more/settings') },
        ]
      );
      return;
    }

    const available = wallet?.withdrawable_balance ?? wallet?.balance ?? 0;
    if (available <= 0) {
      Alert.alert(
        'No Withdrawable Balance',
        'You do not have any withdrawable balance yet. Customer order payments held in escrow will become available once deliveries are confirmed.'
      );
      return;
    }

    setWithdrawAmount(String(available));
    setOtpSent(false);
    setOtpCode('');
    setModalVisible(true);
  };

  // Payout Alert details (matching web)
  const payoutState = wallet?.payout_status?.state;
  const getPayoutAlert = () => {
    if (payoutState === 'processing') {
      return {
        title: 'Payout Processing',
        desc: "We're currently transferring your funds to your settlement bank account.",
        color: '#2563EB',
        bg: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
        border: 'rgba(37, 99, 235, 0.3)',
      };
    }
    if (payoutState === 'scheduled') {
      const nextAt = wallet?.payout_status?.next_payout_at;
      return {
        title: 'Payout Scheduled',
        desc: nextAt
          ? `Your payout is scheduled for ${format(new Date(nextAt), 'MMM d, yyyy · h:mm a')}.`
          : 'Your payout has been scheduled and will be credited soon.',
        color: '#D97706',
        bg: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FFFBEB',
        border: 'rgba(217, 119, 6, 0.3)',
      };
    }
    if (payoutState === 'under_review') {
      return {
        title: 'Payout Under Security Review',
        desc: 'A recent order is undergoing standard security review before payout release.',
        color: '#DC2626',
        bg: isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEF2F2',
        border: 'rgba(220, 38, 38, 0.3)',
      };
    }
    return null;
  };

  const activePayoutAlert = getPayoutAlert();
  const withdrawable = wallet?.withdrawable_balance ?? wallet?.balance ?? 0;
  const pending = wallet?.pending_balance ?? 0;
  const withdrawals = wallet?.withdrawals || wallet?.transactions || [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={isDark ? '#F8FAFC' : '#0F172A'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>Wallet & Payouts</Text>
        <TouchableOpacity
          onPress={() => router.push('/(merchant)/more/settings')}
          style={styles.settingsHeaderBtn}
          activeOpacity={0.7}
        >
          <Building2 size={20} color={isDark ? '#94A3B8' : '#64748B'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F766E" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Active Payout Alert (Processing / Scheduled / Under Review) */}
        {activePayoutAlert && (
          <View
            style={[
              styles.payoutAlert,
              {
                backgroundColor: activePayoutAlert.bg,
                borderColor: activePayoutAlert.border,
              },
            ]}
          >
            <View style={[styles.alertDot, { backgroundColor: activePayoutAlert.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                {activePayoutAlert.title}
              </Text>
              <Text style={[styles.alertDesc, { color: isDark ? '#94A3B8' : '#475569' }]}>
                {activePayoutAlert.desc}
              </Text>
            </View>
          </View>
        )}

        {/* Available Balance Card */}
        <View style={styles.balanceCardWrapper}>
          <LinearGradient
            colors={['#0F766E', '#064E3B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceTopRow}>
              <View>
                <Text style={styles.balanceHeaderLabel}>Withdrawable Balance</Text>
                {isLoading ? (
                  <Skeleton width={160} height={38} radius={8} style={{ marginTop: 8 }} />
                ) : (
                  <Text style={styles.balancePrimaryAmount}>{formatCurrency(withdrawable)}</Text>
                )}
              </View>
              <View style={styles.availableBadge}>
                <Text style={styles.availableBadgeText}>AVAILABLE</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.withdrawMainBtn}
              onPress={handleOpenWithdrawModal}
              activeOpacity={0.85}
            >
              <ArrowUpRight size={18} color="#0F766E" strokeWidth={2.5} />
              <Text style={styles.withdrawMainBtnText}>Withdraw Funds</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Pending Escrow Balance Card */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.infoCardTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.infoCardLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Pending (Escrow)
              </Text>
              <HelpCircle size={14} color={isDark ? '#64748B' : '#94A3B8'} />
            </View>
            <View style={[styles.heldBadge, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
              <Text style={[styles.heldBadgeText, { color: isDark ? '#94A3B8' : '#64748B' }]}>HELD</Text>
            </View>
          </View>

          {isLoading ? (
            <Skeleton width={130} height={32} radius={6} style={{ marginTop: 8 }} />
          ) : (
            <Text style={[styles.infoCardAmount, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
              {formatCurrency(pending)}
            </Text>
          )}

          <Text style={[styles.infoCardNote, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Payments are securely held in escrow and released to your withdrawable balance once customer order delivery is confirmed.
          </Text>
        </View>

        {/* Settlement Bank Account Card */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.infoCardTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Building2 size={16} color="#0F766E" />
              <Text style={[styles.infoCardLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Settlement Account
              </Text>
            </View>

            {wallet?.bank_account_verified ? (
              <View style={styles.verifiedBadge}>
                <CheckCircle2 size={12} color="#16A34A" strokeWidth={2.5} />
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            ) : (
              <View style={styles.unlinkedBadge}>
                <Text style={styles.unlinkedBadgeText}>Unlinked</Text>
              </View>
            )}
          </View>

          {wallet?.bank_name ? (
            <View style={styles.bankDetailsContainer}>
              <Text style={[styles.bankNameText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                {wallet.bank_name}
              </Text>
              <Text style={[styles.bankAcctNumber, { color: isDark ? '#94A3B8' : '#475569' }]}>
                {wallet.bank_account_number}
              </Text>
              {wallet.bank_account_name && (
                <Text style={[styles.bankAcctName, { color: isDark ? '#64748B' : '#64748B' }]}>
                  {wallet.bank_account_name}
                </Text>
              )}
            </View>
          ) : (
            <Text style={[styles.bankEmptyNotice, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              No settlement bank account linked yet. Add your bank details to receive payouts.
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.manageBankBtn,
              {
                borderColor: isDark ? '#334155' : '#CBD5E1',
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
              },
            ]}
            onPress={() => router.push('/(merchant)/more/settings')}
            activeOpacity={0.75}
          >
            <Text style={[styles.manageBankBtnText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
              {wallet?.bank_name ? 'Edit Bank Account' : 'Link Bank Account'}
            </Text>
            <ExternalLink size={14} color={isDark ? '#94A3B8' : '#64748B'} />
          </TouchableOpacity>
        </View>

        {/* Withdrawal History Section */}
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Receipt size={18} color="#0F766E" />
            <Text style={[styles.sectionTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
              Withdrawal History
            </Text>
          </View>
          {withdrawals.length > 0 && (
            <Text style={[styles.txCountText, { color: isDark ? '#64748B' : '#94A3B8' }]}>
              {withdrawals.length} {withdrawals.length === 1 ? 'record' : 'records'}
            </Text>
          )}
        </View>

        {isLoading ? (
          [1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.txSkeleton,
                { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' },
              ]}
            >
              <Skeleton width={38} height={38} radius={19} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton height={14} width="65%" />
                <Skeleton height={10} width="40%" />
              </View>
              <Skeleton height={18} width={70} />
            </View>
          ))
        ) : withdrawals.length === 0 ? (
          <View
            style={[
              styles.emptyStateContainer,
              { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' },
            ]}
          >
            <Receipt size={36} color={isDark ? '#475569' : '#CBD5E1'} strokeWidth={1.5} />
            <Text style={[styles.emptyStateTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
              No withdrawals yet
            </Text>
            <Text style={[styles.emptyStateDesc, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              When you request payouts, your transaction records will be logged here.
            </Text>
          </View>
        ) : (
          withdrawals.map((w: any) => {
            const rawStatus = (w.status || 'pending').toLowerCase();
            const isSuccess = ['success', 'completed', 'paid'].includes(rawStatus);
            const isProcessing = ['processing', 'submitted'].includes(rawStatus);
            const isFailed = ['failed', 'rejected', 'reversed'].includes(rawStatus);

            const badgeBg = isSuccess
              ? 'rgba(22, 163, 74, 0.12)'
              : isProcessing
              ? 'rgba(37, 99, 235, 0.12)'
              : isFailed
              ? 'rgba(220, 38, 38, 0.12)'
              : 'rgba(217, 119, 6, 0.12)';

            const badgeColor = isSuccess
              ? '#16A34A'
              : isProcessing
              ? '#2563EB'
              : isFailed
              ? '#DC2626'
              : '#D97706';

            const destination = w.bank_name
              ? `${w.bank_name} • ${w.account_number || w.bank_account_number || ''}`
              : w.description || 'Settlement Bank Transfer';

            const dateLabel = w.created_at
              ? format(new Date(w.created_at), 'MMM d, yyyy · h:mm a')
              : 'Recent';

            return (
              <View
                key={w.id || w.reference}
                style={[
                  styles.txCard,
                  { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' },
                ]}
              >
                <View style={[styles.txIconContainer, { backgroundColor: badgeBg }]}>
                  <ArrowUpRight size={18} color={badgeColor} strokeWidth={2.5} />
                </View>

                <View style={styles.txInfo}>
                  <Text style={[styles.txDesc, { color: isDark ? '#F8FAFC' : '#0F172A' }]} numberOfLines={1}>
                    {destination}
                  </Text>
                  <Text style={[styles.txDate, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    {dateLabel}
                  </Text>
                </View>

                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                    {formatCurrency(Number(w.amount || 0))}
                  </Text>
                  <View style={[styles.txStatusBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.txStatusBadgeText, { color: badgeColor }]}>
                      {rawStatus}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Withdrawal Sheet Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!withdrawMutation.isPending && !otpLoading) {
            setModalVisible(false);
          }
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                Withdraw Funds
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
                disabled={withdrawMutation.isPending || otpLoading}
              >
                <X size={18} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {/* Withdrawable Balance info */}
            <View style={[styles.modalBalanceBox, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
              <Text style={[styles.modalBalanceLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Available to Withdraw:
              </Text>
              <Text style={[styles.modalBalanceVal, { color: '#0F766E' }]}>
                {formatCurrency(withdrawable)}
              </Text>
            </View>

            {/* Destination Bank Account Summary */}
            <View style={[styles.destinationBankBox, { borderColor: isDark ? '#334155' : '#BBF7D0' }]}>
              <Building2 size={18} color="#0F766E" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.destinationBankName, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                  {wallet?.bank_name}
                </Text>
                <Text style={[styles.destinationBankSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  {wallet?.bank_account_number} · {wallet?.bank_account_name}
                </Text>
              </View>
              <CheckCircle2 size={16} color="#16A34A" />
            </View>

            {!otpSent ? (
              <>
                {/* Amount Input */}
                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.inputLabel, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                      Withdrawal Amount
                    </Text>
                    <TouchableOpacity
                      onPress={() => setWithdrawAmount(String(withdrawable))}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.useMaxText}>Use Max</Text>
                    </TouchableOpacity>
                  </View>
                  <View
                    style={[
                      styles.amountInputWrap,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: '#0F766E',
                      },
                    ]}
                  >
                    <Text style={styles.currencyPrefix}>₦</Text>
                    <TextInput
                      style={[styles.amountInput, { color: isDark ? '#F8FAFC' : '#0F172A' }]}
                      value={withdrawAmount}
                      onChangeText={setWithdrawAmount}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                {/* Send OTP Button */}
                <Button
                  title={otpLoading ? 'Sending Verification Code...' : 'Send Verification Code'}
                  onPress={handleSendOtp}
                  disabled={otpLoading}
                  size="lg"
                  style={{ backgroundColor: '#0F766E', marginTop: 10 }}
                />
              </>
            ) : (
              <>
                {/* OTP Sent Notice */}
                <View style={styles.otpNoticeBox}>
                  <Text style={styles.otpNoticeTitle}>Code Sent!</Text>
                  <Text style={styles.otpNoticeDesc}>
                    Please enter the 6-digit verification code sent to your registered merchant email / WhatsApp.
                  </Text>
                </View>

                {/* OTP Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                    6-Digit Verification Code
                  </Text>
                  <TextInput
                    style={[
                      styles.otpInput,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#CBD5E1',
                        color: isDark ? '#F8FAFC' : '#0F172A',
                      },
                    ]}
                    value={otpCode}
                    onChangeText={setOtpCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="123456"
                    placeholderTextColor="#94A3B8"
                    textAlign="center"
                  />
                </View>

                {/* Resend Code Link */}
                <TouchableOpacity
                  onPress={handleSendOtp}
                  disabled={otpLoading}
                  style={styles.resendCodeBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resendCodeText}>
                    {otpLoading ? 'Resending...' : "Didn't receive code? Resend"}
                  </Text>
                </TouchableOpacity>

                {/* Submit Withdrawal Button */}
                <Button
                  title={withdrawMutation.isPending ? 'Processing Payout...' : 'Confirm Withdrawal'}
                  onPress={handleConfirmWithdraw}
                  disabled={withdrawMutation.isPending}
                  size="lg"
                  style={{ backgroundColor: '#0F766E', marginTop: 8 }}
                />
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.lg,
  },
  settingsHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 16,
  },
  // Payout Alert
  payoutAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  alertDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    flexShrink: 0,
  },
  alertTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13.5,
  },
  alertDesc: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  // Available Balance Card
  balanceCardWrapper: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  balanceCard: {
    padding: 22,
    gap: 20,
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  balanceHeaderLabel: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balancePrimaryAmount: {
    fontFamily: FontFamily.headingBold,
    fontSize: 32,
    color: '#FFFFFF',
    marginTop: 6,
  },
  availableBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  availableBadgeText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  withdrawMainBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.lg,
  },
  withdrawMainBtnText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 14,
    color: '#0F766E',
  },
  // Info Cards (Pending & Settlement Bank)
  infoCard: {
    padding: 18,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 10,
  },
  infoCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCardLabel: {
    fontFamily: FontFamily.headingBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heldBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  heldBadgeText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  infoCardAmount: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
  },
  infoCardNote: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    lineHeight: 17,
  },
  // Settlement Account specifics
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  verifiedBadgeText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    color: '#16A34A',
  },
  unlinkedBadge: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  unlinkedBadgeText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    color: '#DC2626',
  },
  bankDetailsContainer: {
    gap: 2,
  },
  bankNameText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 15,
  },
  bankAcctNumber: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  bankAcctName: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
  },
  bankEmptyNotice: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12.5,
    lineHeight: 18,
  },
  manageBankBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: 4,
  },
  manageBankBtnText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 12.5,
  },
  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 15,
  },
  txCountText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
  },
  // History list
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 12,
  },
  txIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txDesc: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 13,
  },
  txDate: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13.5,
  },
  txStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  txStatusBadgeText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 9.5,
    textTransform: 'uppercase',
  },
  txSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 12,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 8,
  },
  emptyStateTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 14,
    marginTop: 4,
  },
  emptyStateDesc: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBalanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: Radius.md,
  },
  modalBalanceLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12.5,
  },
  modalBalanceVal: {
    fontFamily: FontFamily.headingBold,
    fontSize: 14,
  },
  destinationBankBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(15, 118, 110, 0.06)',
    borderWidth: 1,
    gap: 10,
  },
  destinationBankName: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13,
  },
  destinationBankSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    marginTop: 2,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 12.5,
  },
  useMaxText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 12,
    color: '#0F766E',
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 48,
  },
  currencyPrefix: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: '#0F766E',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
  },
  otpNoticeBox: {
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    borderRadius: Radius.md,
    padding: 12,
    gap: 4,
  },
  otpNoticeTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13,
    color: '#0F766E',
  },
  otpNoticeDesc: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11.5,
    color: '#0F766E',
    lineHeight: 16,
  },
  otpInput: {
    height: 50,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    letterSpacing: 8,
  },
  resendCodeBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  resendCodeText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 12,
    color: '#0F766E',
  },
});
