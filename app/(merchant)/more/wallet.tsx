import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowUpRight, TrendingUp, Wallet as WalletIcon, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { merchantApi } from '@/services/merchantApi';
import { WalletTransaction } from '@/types/merchant';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { format } from 'date-fns';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

export default function WalletScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

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

  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'failed') return { Icon: XCircle, color: Colors.danger };
    if (status === 'pending') return { Icon: Clock, color: Colors.warning };
    if (type === 'credit') return { Icon: ArrowUpRight, color: Colors.success };
    return { Icon: ArrowUpRight, color: Colors.danger };
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Wallet</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Balance card */}
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={isDark ? ['#022C22', '#128C7E'] : ['#0F766E', '#128C7E']}
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
              <View style={[styles.walletIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <WalletIcon size={24} color={Colors.white} />
              </View>
            </View>

            <View style={styles.balanceStats}>
              <View style={styles.balanceStat}>
                <Text style={styles.balanceStatVal}>{formatCurrency(wallet?.total_earned ?? 0)}</Text>
                <Text style={styles.balanceStatLabel}>Total Earned</Text>
              </View>
              <View style={[styles.balanceStatDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
              <View style={styles.balanceStat}>
                <Text style={styles.balanceStatVal}>{formatCurrency(wallet?.pending_balance ?? 0)}</Text>
                <Text style={styles.balanceStatLabel}>Pending</Text>
              </View>
              <View style={[styles.balanceStatDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
              <View style={styles.balanceStat}>
                <Text style={styles.balanceStatVal}>{formatCurrency(wallet?.total_withdrawn ?? 0)}</Text>
                <Text style={styles.balanceStatLabel}>Withdrawn</Text>
              </View>
            </View>

            <Button
              title="Withdraw Funds"
              onPress={() => {}}
              size="lg"
              style={styles.withdrawBtn}
              textStyle={{ color: Colors.primary }}
            />
          </LinearGradient>
        </View>

        {/* Recent transactions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Transactions</Text>
        </View>

        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.txSkeleton, { backgroundColor: theme.card }]}>
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
              <View key={tx.id} style={[styles.txCard, { backgroundColor: theme.card }, Shadow.sm as any]}>
                <View style={[styles.txIcon, { backgroundColor: color + '18' }]}>
                  <Icon size={18} color={color} strokeWidth={2} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={[styles.txDesc, { color: theme.text }]} numberOfLines={1}>{tx.description}</Text>
                  <Text style={[styles.txDate, { color: theme.textTertiary }]}>
                    {format(new Date(tx.created_at), 'MMM d, yyyy')} · {tx.reference.slice(0, 12)}...
                  </Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: tx.type === 'credit' ? Colors.success : Colors.danger }]}>
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
          <View style={[styles.emptyTx, { backgroundColor: theme.card }]}>
            <TrendingUp size={32} color={theme.textTertiary} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No transactions yet. Start selling to see your earnings here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[6], paddingTop: Spacing[5], paddingBottom: Spacing[4] },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, letterSpacing: -0.3 },
  scroll: { paddingHorizontal: Spacing[6], paddingBottom: 100 },
  balanceCard: { borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing[6] },
  balanceGradient: { padding: Spacing[6], gap: Spacing[5] },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  balanceLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)' },
  balanceAmount: { fontFamily: FontFamily.headingBold, fontSize: FontSize['5xl'], color: Colors.white, letterSpacing: -2, marginTop: Spacing[2] },
  walletIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  balanceStats: { flexDirection: 'row', alignItems: 'center' },
  balanceStat: { flex: 1, alignItems: 'center' },
  balanceStatVal: { fontFamily: FontFamily.headingBold, fontSize: FontSize.md, color: Colors.white },
  balanceStatLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.6)', marginTop: 3 },
  balanceStatDivider: { width: 1, height: 32 },
  withdrawBtn: { backgroundColor: Colors.white },
  sectionHeader: { marginBottom: Spacing[4] },
  sectionTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.lg },
  txSkeleton: { flexDirection: 'row', alignItems: 'center', gap: Spacing[4], padding: Spacing[4], borderRadius: Radius.lg, marginBottom: Spacing[3] },
  txCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing[4], borderRadius: Radius.lg, marginBottom: Spacing[3], gap: Spacing[4] },
  txIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txDesc: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  txDate: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, marginTop: 3 },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontFamily: FontFamily.headingBold, fontSize: FontSize.base },
  emptyTx: { borderRadius: Radius.lg, padding: Spacing[8], alignItems: 'center', gap: Spacing[3] },
  emptyText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
});
