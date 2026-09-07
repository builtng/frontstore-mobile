import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, ShoppingBag, Users, RefreshCw, BarChart2, ArrowLeft } from 'lucide-react-native';
import { StatCard } from '@/components/ui/StatCard';
import { SkeletonStatCard, Skeleton } from '@/components/ui/SkeletonLoader';
import { RevenueChart } from '@/components/merchant/RevenueChart';
import { merchantApi } from '@/services/merchantApi';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

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
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const haptics = useHaptics();
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
    <SafeAreaView style={[styles.safe, { backgroundColor: '#F8FAFC' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            haptics.light();
            router.back();
          }}
          style={[styles.backBtn, { backgroundColor: '#FFFFFF', borderColor: '#EAEFF5' }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color="#0F172A" strokeWidth={2.2} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: '#0F172A' }]}>Analytics</Text>
          <Text style={[styles.subtitle, { color: '#64748B' }]}>Store performance & insights</Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshBtn, { backgroundColor: '#FFFFFF', borderColor: '#EAEFF5' }]}
          onPress={() => {
            haptics.light();
            refetch();
          }}
        >
          <RefreshCw size={18} color="#0F172A" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#128C7E" />}
        contentContainerStyle={styles.scroll}
      >
        {/* Apple/Linear-style Segmented Capsule Selector */}
        <View style={styles.segmentedContainer}>
          {PERIODS.map((p) => {
            const isActive = period === p.value;
            return (
              <TouchableOpacity
                key={p.value}
                onPress={() => {
                  haptics.selection();
                  setPeriod(p.value);
                }}
                activeOpacity={0.8}
                style={[
                  styles.segmentChip,
                  isActive && styles.segmentChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    isActive ? styles.segmentLabelActive : styles.segmentLabelInactive,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hero Revenue Card */}
        <View style={[styles.heroChartCard, { backgroundColor: '#FFFFFF', borderColor: '#EAEFF5' }, Shadow.card as any]}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroSublabel}>TOTAL REVENUE</Text>
              <Text style={styles.heroValue}>{formatCurrency(totalRevenue)}</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveBadgeText}>Live</Text>
            </View>
          </View>

          <View style={styles.chartWrapper}>
            {loading ? (
              <Skeleton height={150} radius={14} />
            ) : (
              <RevenueChart data={revenueChart} />
            )}
          </View>
        </View>

        {/* Key Metrics Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <Text style={styles.sectionMeta}>{period === 'all' ? 'All time' : `Last ${period}`}</Text>
        </View>

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
                icon={<TrendingUp size={19} color="#0F766E" strokeWidth={2.2} />}
                accentColor="#0F766E"
              />
              <StatCard
                label="Total Orders"
                value={String(totalOrders)}
                icon={<ShoppingBag size={19} color="#10B981" strokeWidth={2.2} />}
                accentColor="#10B981"
              />
            </View>
            <View style={styles.statsGrid}>
              <StatCard
                label="Customers"
                value={String(totalCustomers)}
                icon={<Users size={19} color="#3B82F6" strokeWidth={2.2} />}
                accentColor="#3B82F6"
              />
              <StatCard
                label="Conversion Rate"
                value={`${conversionRate}%`}
                icon={<BarChart2 size={19} color="#F59E0B" strokeWidth={2.2} />}
                accentColor="#F59E0B"
              />
            </View>
          </>
        )}

        {/* Avg order value */}
        {!loading && totalOrders > 0 && (
          <View style={[styles.avgCard, { backgroundColor: '#FFFFFF', borderColor: '#EAEFF5' }, Shadow.card as any]}>
            <View>
              <Text style={styles.avgLabel}>Average Order Value</Text>
              <Text style={styles.avgSubtext}>Per completed checkout</Text>
            </View>
            <Text style={styles.avgValue}>
              {formatCurrency(totalRevenue / totalOrders)}
            </Text>
          </View>
        )}

        {/* Customer Retention Card */}
        {!loading && (
          <View style={[styles.retentionCard, { backgroundColor: '#FFFFFF', borderColor: '#EAEFF5' }, Shadow.card as any]}>
            <View style={styles.retentionHeader}>
              <View style={styles.retentionIconBox}>
                <Users size={16} color="#0F766E" strokeWidth={2.4} />
              </View>
              <Text style={styles.retentionTitle}>Customer Retention</Text>
            </View>
            <View style={styles.retentionStats}>
              <View style={styles.retentionStat}>
                <Text style={styles.retentionValue}>{totalCustomers}</Text>
                <Text style={styles.retentionLabel}>Total Shoppers</Text>
              </View>
              <View style={styles.retentionDivider} />
              <View style={styles.retentionStat}>
                <Text style={[styles.retentionValue, { color: '#0F766E' }]}>
                  {stats?.returning_customers ?? 0}
                </Text>
                <Text style={styles.retentionLabel}>Returning</Text>
              </View>
              <View style={styles.retentionDivider} />
              <View style={styles.retentionStat}>
                <Text style={[styles.retentionValue, { color: '#3B82F6' }]}>
                  {totalCustomers > 0
                    ? pct(stats?.returning_customers ?? 0, totalCustomers)
                    : '0%'}
                </Text>
                <Text style={styles.retentionLabel}>Retention</Text>
              </View>
            </View>
          </View>
        )}

        {/* Top products */}
        {topProducts.length > 0 && (
          <View style={styles.topProductsSection}>
            <Text style={styles.sectionTitle}>Best-Selling Products</Text>
            <View style={[styles.topProductsCard, { backgroundColor: '#FFFFFF', borderColor: '#EAEFF5' }, Shadow.card as any]}>
              {topProducts.slice(0, 5).map((tp: any, i: number) => {
                const revenueShare = totalRevenue > 0 ? (tp.revenue / totalRevenue) * 100 : 0;
                return (
                  <View
                    key={i}
                    style={[styles.productRow, i < topProducts.length - 1 && { borderBottomColor: '#F1F5F9', borderBottomWidth: 1 }]}
                  >
                    <View style={styles.rankBadge}>
                      <Text style={styles.rank}>#{i + 1}</Text>
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={1}>
                        {tp.product?.name ?? `Product ${i + 1}`}
                      </Text>
                      <View style={styles.barWrap}>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${Math.min(revenueShare, 100)}%` }]} />
                        </View>
                        <Text style={styles.barPct}>
                          {revenueShare.toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                    <View style={styles.productStats}>
                      <Text style={styles.productRevenue}>
                        {formatCurrency(tp.revenue)}
                      </Text>
                      <Text style={styles.productSold}>
                        {tp.total_sold} sold
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[3],
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    marginTop: 2,
  },
  scroll: {
    paddingHorizontal: Spacing[5],
    paddingBottom: 120,
  },

  /* Segmented control bar */
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 9999,
    padding: 4,
    marginBottom: Spacing[4],
  },
  segmentChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentChipActive: {
    backgroundColor: '#0F172A',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentLabel: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 12,
  },
  segmentLabelActive: {
    color: '#FFFFFF',
  },
  segmentLabelInactive: {
    color: '#64748B',
  },

  /* Hero Revenue Card */
  heroChartCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    marginBottom: Spacing[5],
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[3],
  },
  heroSublabel: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: '#94A3B8',
    marginBottom: 4,
  },
  heroValue: {
    fontFamily: FontFamily.headingBold,
    fontSize: 30,
    letterSpacing: -0.8,
    color: '#0F172A',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveBadgeText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 11,
    color: '#047857',
  },
  chartWrapper: {
    marginTop: 6,
  },

  /* Section Title */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 17,
    letterSpacing: -0.3,
    color: '#0F172A',
  },
  sectionMeta: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: '#94A3B8',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },

  /* Avg Order Value */
  avgCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing[2],
  },
  avgLabel: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 14,
    color: '#0F172A',
  },
  avgSubtext: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  avgValue: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    letterSpacing: -0.5,
    color: '#0F766E',
  },

  /* Retention Card */
  retentionCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: Spacing[3],
    marginVertical: Spacing[3],
  },
  retentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retentionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(18, 140, 126, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retentionTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 15,
    color: '#0F172A',
  },
  retentionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
  },
  retentionStat: {
    flex: 1,
    alignItems: 'center',
  },
  retentionValue: {
    fontFamily: FontFamily.headingBold,
    fontSize: 20,
    letterSpacing: -0.4,
    color: '#0F172A',
  },
  retentionLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
  },
  retentionDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F1F5F9',
  },

  /* Top products */
  topProductsSection: {
    marginTop: Spacing[3],
  },
  topProductsCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: Spacing[3],
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    gap: Spacing[3],
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank: {
    fontFamily: FontFamily.headingBold,
    fontSize: 12,
    color: '#0F172A',
  },
  productInfo: {
    flex: 1,
    gap: 6,
  },
  productName: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 13,
    color: '#0F172A',
  },
  barWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  barTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  barFill: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#0F766E',
  },
  barPct: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 10,
    color: '#94A3B8',
    minWidth: 26,
  },
  productStats: {
    alignItems: 'flex-end',
  },
  productRevenue: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13,
    color: '#0F766E',
  },
  productSold: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: '#94A3B8',
  },
});
