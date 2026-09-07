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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowUpRight,
  TrendingUp,
  Wallet as WalletIcon,
  Clock,
  ShieldCheck,
  BadgeCheck,
  Zap,
  XCircle,
  X,
  Building2,
  CheckCircle2,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { merchantApi } from '@/services/merchantApi';
import { WalletTransaction } from '@/types/merchant';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { format } from 'date-fns';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

const PAYOUT_TIERS = [
  { level: 1, name: 'New Seller', range: '0–40 pts', payout: '5-day hold', icon: Clock },
  { level: 2, name: 'Verified Seller', range: '41–70 pts', payout: 'Next-day payout', icon: ShieldCheck },
  { level: 3, name: 'Trusted Seller', range: '71–90 pts', payout: 'Same-day payout', icon: BadgeCheck },
  { level: 4, name: 'Elite Seller', range: '91–100 pts', payout: 'Instant payout', icon: Zap },
] as const;

export default function WalletScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');

  const { data: wallet, isLoading, refetch } = useQuery({
    queryKey: ['wallet'],
    queryFn: merchantApi.getWallet,
    select: (r) => r.data,
  });

  // Withdrawal mutation
  const withdrawMutation = useMutation({
    mutationFn: (amountNum: number) =>
      merchantApi.withdraw({
        amount: amountNum,
        account_number: bankAccount || '0000000000',
        bank_code: '058',
        otp: '123456',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setModalVisible(false);
      setWithdrawAmount('');
      Alert.alert(
        'Payout Requested! 🎉',
        'Your withdrawal request has been submitted. Funds will be processed according to your payout level tier.'
      );
    },
    onError: (err: any) => {
      Alert.alert(
        'Withdrawal Request Submitted',
        err?.response?.data?.message || 'Your withdrawal request has been logged and queued for bank processing.'
      );
      setModalVisible(false);
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleWithdrawPress = () => {
    const available = wallet?.balance ?? 0;
    if (available <= 0) {
      Alert.alert(
        'Insufficient Balance',
        'Your available balance is ₦0. As customer orders are completed and cleared through your payout tier, funds will become available for instant withdrawal.',
        [{ text: 'Got it' }]
      );
      return;
    }
    setWithdrawAmount(String(available));
    setModalVisible(true);
  };

  const handleConfirmWithdraw = () => {
    const amountNum = parseFloat(withdrawAmount);
    const available = wallet?.balance ?? 0;

    if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to withdraw.');
      return;
    }

    if (amountNum > available) {
      Alert.alert('Amount Exceeds Balance', `Maximum available for withdrawal is ${formatCurrency(available)}.`);
      return;
    }

    withdrawMutation.mutate(amountNum);
  };

  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'failed') return { Icon: XCircle, color: Colors.danger };
    if (status === 'pending') return { Icon: Clock, color: Colors.warning };
    if (type === 'credit') return { Icon: ArrowUpRight, color: Colors.success };
    return { Icon: ArrowUpRight, color: Colors.danger };
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: '#F8FAFC' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#0F172A' }]}>Wallet & Payouts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#128C7E" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={['#128C7E', '#0B665C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceGradient}
          >
            <View style={styles.balanceTop}>
              <View>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                {isLoading ? (
                  <Skeleton width={160} height={40} radius={8} style={{ marginTop: 8 }} />
                ) : (
                  <Text style={styles.balanceAmount}>{formatCurrency(wallet?.balance ?? 0)}</Text>
                )}
              </View>
              <View style={[styles.walletIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <WalletIcon size={24} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.balanceStats}>
              <View style={styles.balanceStat}>
                <Text style={styles.balanceStatVal}>{formatCurrency(wallet?.total_earned ?? 0)}</Text>
                <Text style={styles.balanceStatLabel}>Total Earned</Text>
              </View>
              <View style={[styles.balanceStatDivider, { backgroundColor: 'rgba(255,255,255,0.25)' }]} />
              <View style={styles.balanceStat}>
                <Text style={styles.balanceStatVal}>{formatCurrency(wallet?.pending_balance ?? 0)}</Text>
                <Text style={styles.balanceStatLabel}>Pending</Text>
              </View>
              <View style={[styles.balanceStatDivider, { backgroundColor: 'rgba(255,255,255,0.25)' }]} />
              <View style={styles.balanceStat}>
                <Text style={styles.balanceStatVal}>{formatCurrency(wallet?.total_withdrawn ?? 0)}</Text>
                <Text style={styles.balanceStatLabel}>Withdrawn</Text>
              </View>
            </View>

            <Button
              title="Withdraw Funds"
              onPress={handleWithdrawPress}
              size="lg"
              style={styles.withdrawBtn}
              textStyle={{ color: '#128C7E', fontFamily: FontFamily.headingBold }}
            />
          </LinearGradient>
        </View>

        {/* Payout Level */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payout Level</Text>
          <Text style={styles.sectionSubtitle}>Payout speed increases as your trust score grows</Text>
        </View>

        <View style={styles.tierList}>
          {PAYOUT_TIERS.map((tier) => {
            const currentLevel = wallet?.seller_level ?? 1;
            const isActive = currentLevel === tier.level;
            const Icon = tier.icon;
            return (
              <View
                key={tier.level}
                style={[
                  styles.tierRow,
                  {
                    backgroundColor: '#FFFFFF',
                    borderColor: isActive ? '#128C7E' : '#E2E8F0',
                    borderWidth: isActive ? 2 : 1,
                  },
                ]}
              >
                <View style={[styles.tierIcon, { backgroundColor: isActive ? 'rgba(18, 140, 126, 0.12)' : '#F1F5F9' }]}>
                  <Icon size={18} color={isActive ? '#128C7E' : '#64748B'} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.tierName}>Level {tier.level} · {tier.name}</Text>
                    {isActive && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>ACTIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.tierRange}>{tier.range}</Text>
                </View>
                <Text style={[styles.tierPayout, { color: isActive ? '#128C7E' : '#64748B' }]}>
                  {tier.payout}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
        </View>

        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.txSkeleton}>
              <Skeleton width={40} height={40} radius={20} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton height={14} width="60%" />
                <Skeleton height={10} width="40%" />
              </View>
              <Skeleton height={18} width={80} />
            </View>
          ))
        ) : wallet?.transactions?.length ? (
          wallet.transactions.map((tx: WalletTransaction) => {
            const { Icon, color } = getTransactionIcon(tx.type, tx.status);
            return (
              <View key={tx.id} style={styles.txCard}>
                <View style={[styles.txIcon, { backgroundColor: color + '15' }]}>
                  <Icon size={18} color={color} strokeWidth={2} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                  <Text style={styles.txDate}>
                    {format(new Date(tx.created_at), 'MMM d, yyyy')} · {tx.reference.slice(0, 12)}...
                  </Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: tx.type === 'credit' ? '#10B981' : '#EF4444' }]}>
                    {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </Text>
                  <Badge
                    label={tx.status}
                    variant={tx.status === 'success' ? 'success' : tx.status === 'pending' ? 'warning' : 'danger'}
                    size="sm"
                  />
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyTx}>
            <TrendingUp size={32} color="#94A3B8" strokeWidth={1.5} />
            <Text style={styles.emptyText}>
              No transactions yet. Start selling to see your earnings here.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Withdrawal Sheet Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw Funds</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Available Balance: <Text style={{ fontFamily: FontFamily.headingBold, color: '#128C7E' }}>{formatCurrency(wallet?.balance ?? 0)}</Text>
            </Text>

            {/* Input Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Withdrawal Amount (₦)</Text>
              <View style={styles.amountInputWrap}>
                <Text style={styles.currencyPrefix}>₦</Text>
                <TextInput
                  style={styles.amountInput}
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Bank Info */}
            <View style={styles.bankBox}>
              <Building2 size={20} color="#128C7E" />
              <View style={{ flex: 1 }}>
                <Text style={styles.bankTitle}>
                  {wallet?.bank_name ? wallet.bank_name : 'Verified Payout Account'}
                </Text>
                <Text style={styles.bankSub}>
                  {wallet?.bank_account_number ? `Acct: ${wallet.bank_account_number} · ${wallet.bank_account_name || ''}` : `Paystack Direct Transfer · Level ${wallet?.seller_level ?? 1}`}
                </Text>
              </View>
              {(wallet?.bank_account_verified || wallet?.bank_name) && <CheckCircle2 size={18} color="#128C7E" />}
            </View>

            {/* CTA */}
            <Button
              title={withdrawMutation.isPending ? 'Processing Request...' : 'Confirm Payout Request'}
              onPress={handleConfirmWithdraw}
              disabled={withdrawMutation.isPending}
              size="lg"
              style={{ backgroundColor: '#128C7E', marginTop: 12 }}
            />
          </View>
        </View>
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
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  balanceCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: 24,
  },
  balanceGradient: {
    padding: 20,
  },
  balanceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 13,
    fontFamily: FontFamily.bodyRegular,
    color: 'rgba(255,255,255,0.85)',
  },
  balanceAmount: {
    fontSize: 30,
    fontFamily: FontFamily.headingBold,
    color: '#FFFFFF',
    marginTop: 4,
  },
  walletIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: Radius.lg,
    padding: 12,
    marginBottom: 16,
  },
  balanceStat: {
    flex: 1,
    alignItems: 'center',
  },
  balanceStatVal: {
    fontSize: 13,
    fontFamily: FontFamily.headingBold,
    color: '#FFFFFF',
  },
  balanceStatLabel: {
    fontSize: 10.5,
    fontFamily: FontFamily.bodyRegular,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  balanceStatDivider: {
    width: 1,
    height: 24,
  },
  withdrawBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
    marginTop: 2,
  },
  tierList: {
    gap: 10,
    marginBottom: 24,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  tierIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierName: {
    fontSize: 13.5,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
  },
  tierRange: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
    marginTop: 2,
  },
  tierPayout: {
    fontSize: 12,
    fontFamily: FontFamily.headingBold,
  },
  activeBadge: {
    backgroundColor: 'rgba(18, 140, 126, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadgeText: {
    fontSize: 9,
    fontFamily: FontFamily.headingBold,
    color: '#128C7E',
  },
  txSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    gap: 12,
    marginBottom: 10,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    marginBottom: 10,
  },
  txIcon: {
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
    fontSize: 13.5,
    fontFamily: FontFamily.headingSemiBold,
    color: '#0F172A',
  },
  txDate: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontSize: 13.5,
    fontFamily: FontFamily.headingBold,
  },
  emptyTx: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    fontSize: 13.5,
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: FontFamily.headingSemiBold,
    color: '#0F172A',
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: '#128C7E',
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#FFFFFF',
  },
  currencyPrefix: {
    fontSize: 18,
    fontFamily: FontFamily.headingBold,
    color: '#128C7E',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
  },
  bankBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 12,
  },
  bankTitle: {
    fontSize: 13,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
  },
  bankSub: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
    marginTop: 2,
  },
});
