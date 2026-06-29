import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, ShoppingBag, Users, Eye, RefreshCw, BarChart2 } from 'lucide-react-native';
import { StatCard } from '@/components/ui/StatCard';
import { SkeletonStatCard, Skeleton } from '@/components/ui/SkeletonLoader';
import { RevenueChart } from '@/components/merchant/RevenueChart';
import { merchantApi } from '@/services/merchantApi';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

const PERIODS = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: 'All time', value: 'all' },
];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

const pct = (value: number, total: number) =>
  total === 0 ? '0%' : `${((value / total) * 100).toFixed(1)}%`;

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const [period, setPeriod] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => merchantApi.getAnalytics({ period }),
    select: (r) => r.data,
  });

  // Fallback to dashboard stats if analytics endpoint isn't implemented yet
  const { data: dashStats, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: merchantApi.getDashboardStats,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const stats = data ?? dashStats;
  const loading = isLoading && dashLoading;

  const revenueChart = stats?.revenue_chart ?? [];
  const topProducts = stats?.top_products ?? [];
  const totalRevenue = stats?.total_revenue ?? 0;
  const totalOrders = stats?.total_orders ?? 0;
  const totalCustomers = stats?.total_customers ?? 0;
  const visitors = stats?.total_visitors ?? 0;
  const conversionRate = visitors > 0 ? ((totalOrders / visitors) * 100).toFixed(1) : '0';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Analytics</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Your store performance</Text>
        </View>
        <TouchableOpacity onPress={() => refetch()}>
          <RefreshCw size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        {/* Period selector */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.value}
              onPress={() => setPeriod(p.value)}
              style={[
                styles.periodChip,
                { backgroundColor: period === p.value ? Colors.primary : theme.card, borderColor: period === p.value ? Colors.primary : theme.border },
              ]}
            >
              <Text style={[styles.periodLabel, { color: period === p.value ? Colors.white : theme.textSecondary }]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Revenue chart */}
        <View style={[styles.chartCard, { backgroundColor: theme.card }, Shadow.md as any]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>Revenue</Text>
          {loading ? (
            <Skeleton height={160} radius={12} />
          ) : (
            <RevenueChart data={revenueChart} />
          )}
        </View>

        {/* Key metrics */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Key Metrics</Text>
        {loading ? (
          <View style={styles.statsGrid}>
            <SkeletonStatCard />
            <SkeletonStatCard />
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatCard
                label="Total Revenue"
                value={formatCurrency(totalRevenue)}
                icon={<TrendingUp size={20} color={Colors.success} strokeWidth={2} />}
                accentColor={Colors.success}
              />
              <StatCard
                label="Total Orders"
                value={String(totalOrders)}
                icon={<ShoppingBag size={20} color={Colors.primary} strokeWidth={2} />}
                accentColor={Colors.primary}
              />
            </View>
            <View style={styles.statsGrid}>
              <StatCard
                label="Customers"
                value={String(totalCustomers)}
                icon={<Users size={20} color={Colors.info} strokeWidth={2} />}
                accentColor={Colors.info}
              />
              <StatCard
                label="Conversion Rate"
                value={`${conversionRate}%`}
                icon={<BarChart2 size={20} color={Colors.amber} strokeWidth={2} />}
                accentColor={Colors.amber}
              />
            </View>
          </>
        )}

        {/* Avg order value */}
        {!loading && totalOrders > 0 && (
          <View style={[styles.avgCard, { backgroundColor: theme.card }, Shadow.sm as any]}>
            <Text style={[styles.avgLabel, { color: theme.textSecondary }]}>Average Order Value</Text>
            <Text style={[styles.avgValue, { color: Colors.primary }]}>
              {formatCurrency(totalRevenue / totalOrders)}
            </Text>
          </View>
        )}

        {/* Top products */}
        {topProducts.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Best-Selling Products</Text>
            <View style={[styles.topProductsCard, { backgroundColor: theme.card }, Shadow.sm as any]}>
              {topProducts.slice(0, 5).map((tp: any, i: number) => {
                const revenueShare = totalRevenue > 0 ? (tp.revenue / totalRevenue) * 100 : 0;
                return (
                  <View
                    key={i}
                    style={[styles.productRow, i < topProducts.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
                  >
                    <View style={[styles.rankBadge, { backgroundColor: Colors.primaryDim }]}>
                      <Text style={[styles.rank, { color: Colors.primary }]}>#{i + 1}</Text>
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>
                        {tp.product?.name ?? `Product ${i + 1}`}
                      </Text>
                      <View style={styles.barWrap}>
                        <View style={[styles.barTrack, { backgroundColor: theme.border }]}>
                          <View style={[styles.barFill, { width: `${Math.min(revenueShare, 100)}%`, backgroundColor: Colors.primary }]} />
                        </View>
                        <Text style={[styles.barPct, { color: theme.textTertiary }]}>
                          {revenueShare.toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                    <View style={styles.productStats}>
                      <Text style={[styles.productRevenue, { color: Colors.primary }]}>
                        {formatCurrency(tp.revenue)}
                      </Text>
                      <Text style={[styles.productSold, { color: theme.textTertiary }]}>
                        {tp.total_sold} sold
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Returning customers */}
        {!loading && (
          <View style={[styles.returningCard, { backgroundColor: theme.card }, Shadow.sm as any]}>
            <View style={styles.returningHeader}>
              <Users size={18} color={Colors.success} strokeWidth={2} />
              <Text style={[styles.returningTitle, { color: theme.text }]}>Customer Retention</Text>
            </View>
            <View style={styles.returningStats}>
              <View style={styles.returningStat}>
                <Text style={[styles.returningValue, { color: theme.text }]}>{totalCustomers}</Text>
                <Text style={[styles.returningLabel, { color: theme.textTertiary }]}>Total Customers</Text>
              </View>
              <View style={[styles.returningDivider, { backgroundColor: theme.border }]} />
              <View style={styles.returningStat}>
                <Text style={[styles.returningValue, { color: Colors.success }]}>
                  {stats?.returning_customers ?? 0}
                </Text>
                <Text style={[styles.returningLabel, { color: theme.textTertiary }]}>Returning</Text>
              </View>
              <View style={[styles.returningDivider, { backgroundColor: theme.border }]} />
              <View style={styles.returningStat}>
                <Text style={[styles.returningValue, { color: Colors.info }]}>
                  {totalCustomers > 0
                    ? pct(stats?.returning_customers ?? 0, totalCustomers)
                    : '0%'}
                </Text>
                <Text style={[styles.returningLabel, { color: theme.textTertiary }]}>Retention</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: Spacing[6], paddingTop: Spacing[5], paddingBottom: Spacing[3] },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], letterSpacing: -0.5 },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, marginTop: 2 },
  scroll: { paddingHorizontal: Spacing[6], paddingBottom: 120 },

  periodRow: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[5] },
  periodChip: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], borderRadius: Radius.full, borderWidth: 1.5 },
  periodLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs },

  chartCard: { borderRadius: Radius.lg, padding: Spacing[5], marginBottom: Spacing[5] },
  chartTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.md, marginBottom: Spacing[4] },

  sectionTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.lg, marginBottom: Spacing[4] },
  statsGrid: { flexDirection: 'row', gap: Spacing[4], marginBottom: Spacing[4] },

  avgCard: { borderRadius: Radius.lg, padding: Spacing[5], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[5] },
  avgLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm },
  avgValue: { fontFamily: FontFamily.headingBold, fontSize: FontSize['2xl'] },

  topProductsCard: { borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing[5] },
  productRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[4], paddingVertical: Spacing[4], gap: Spacing[3] },
  rankBadge: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rank: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xs },
  productInfo: { flex: 1, gap: 6 },
  productName: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  barWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  barTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
  barPct: { fontFamily: FontFamily.bodyRegular, fontSize: 10, minWidth: 28 },
  productStats: { alignItems: 'flex-end' },
  productRevenue: { fontFamily: FontFamily.headingBold, fontSize: FontSize.sm },
  productSold: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },

  returningCard: { borderRadius: Radius.lg, padding: Spacing[5], gap: Spacing[4], marginBottom: Spacing[2] },
  returningHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  returningTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.md },
  returningStats: { flexDirection: 'row', alignItems: 'center' },
  returningStat: { flex: 1, alignItems: 'center' },
  returningValue: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl },
  returningLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, marginTop: 3 },
  returningDivider: { width: 1, height: 40 },
});
