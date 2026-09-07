import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import {
  Bell,
  PieChart,
  BadgePercent,
  FileText,
  Package,
  Inbox,
  ArrowUpRight,
  ChevronDown,
  Share2,
  Plus,
  BarChart2,
} from 'lucide-react-native';
import { RevenueChart } from '@/components/merchant/RevenueChart';
import { merchantApi } from '@/services/merchantApi';
import { DashboardStats, ChartDataPoint } from '@/types/merchant';
import { useAuthStore } from '@/stores/authStore';
import { FontFamily } from '@/constants/typography';
import { Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { useToast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';

const formatCurrency = (amount: number, currency = 'NGN') =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);

export default function MerchantDashboardScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const haptics = useHaptics();
  const toast = useToast();
  const { user } = useAuthStore();
  const [timeRange, setTimeRange] = useState<'Today' | 'All Time'>('Today');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real store data
  const { data: storeRes, refetch: refetchStore } = useQuery({
    queryKey: ['merchant-store'],
    queryFn: merchantApi.getStore,
  });

  // Fetch real dashboard stats
  const { data: stats, isLoading, refetch: refetchStats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: merchantApi.getDashboardStats,
  });

  // Fetch real products count and stock
  const { data: productsRes, refetch: refetchProducts } = useQuery({
    queryKey: ['products-count'],
    queryFn: () => merchantApi.getProducts({ limit: 50 }),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStore(), refetchStats(), refetchProducts()]);
    setRefreshing(false);
  };

  // Name priority: cached store (instant) → API store (after fetch) → user name → fallback
  const cachedStoreName = user?.store?.name;
  const apiStoreName = storeRes?.data?.name;
  const storeName = apiStoreName || cachedStoreName || user?.name || 'My Store';
  const username = storeRes?.data?.username || user?.store?.username || 'store';
  const currencyCode = storeRes?.data?.currency || user?.store?.currency || 'NGN';
  const storeUrl = `https://${username}.frontstore.ng`;

  // Real metric values from API
  const rawRevenue = timeRange === 'Today' ? (stats?.today_revenue ?? 0) : (stats?.total_revenue ?? 0);
  const revenueValue = formatCurrency(rawRevenue, currencyCode);
  const salesValue = timeRange === 'Today' ? (stats?.today_orders ?? 0) : (stats?.total_orders ?? 0);
  const ordersValue = timeRange === 'Today' ? (stats?.today_orders ?? 0) : (stats?.total_orders ?? 0);
  const customersValue = stats?.total_customers ?? 0;
  const productsList = productsRes?.data ?? [];
  const productsValue = productsRes?.total ?? productsRes?.meta?.total ?? stats?.total_products ?? productsList.length;
  const outOfStockValue = productsList.filter((p: any) => p.stock === 0 || p.status === 'out_of_stock').length;

  const chartData: ChartDataPoint[] = stats?.revenue_chart && stats.revenue_chart.length > 0
    ? stats.revenue_chart
    : [
        { date: 'Mon', amount: 0, orders: 0 },
        { date: 'Tue', amount: 0, orders: 0 },
        { date: 'Wed', amount: 0, orders: 0 },
        { date: 'Thu', amount: 0, orders: 0 },
        { date: 'Fri', amount: 0, orders: 0 },
        { date: 'Sat', amount: 0, orders: 0 },
        { date: 'Today', amount: rawRevenue, orders: salesValue },
      ];

  const handleShareStore = async () => {
    haptics.success();
    await Clipboard.setStringAsync(storeUrl);
    toast.success('Store link copied to clipboard!');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: '#F8FAFC' }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#128C7E" />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.greetingRow}>
              <Text style={styles.greetingTitle} numberOfLines={1}>
                Hello <Text style={styles.greetingName}>{storeName}</Text>
              </Text>
              <View style={styles.onlineBadge}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            </View>
            <Text style={styles.greetingSubtitle}>Here's how your shop's doing today</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.bellButton}
              activeOpacity={0.7}
              onPress={() => {
                haptics.light();
                router.push('/(merchant)/more/notifications' as any);
              }}
            >
              <Bell size={19} color="#0F172A" strokeWidth={2.2} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerProfileBtn}
              activeOpacity={0.8}
              onPress={() => {
                haptics.selection();
                router.push('/(merchant)/more' as any);
              }}
            >
              <Avatar uri={storeRes?.data?.logo_url || user?.store?.logo_url} name={storeName} size={38} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Action Pills Row */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={handleShareStore}
            activeOpacity={0.8}
          >
            <Share2 size={15} color="#0F766E" strokeWidth={2.2} />
            <Text style={styles.quickActionLabel}>Share Store</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => {
              haptics.light();
              router.push('/(merchant)/products/add');
            }}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#0F766E" strokeWidth={2.5} />
            <Text style={styles.quickActionLabel}>Add Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => {
              haptics.light();
              router.push('/(merchant)/more/analytics' as any);
            }}
            activeOpacity={0.8}
          >
            <BarChart2 size={15} color="#0F766E" strokeWidth={2.2} />
            <Text style={styles.quickActionLabel}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* Filter & View Reports Row */}
        <View style={styles.controlsRow}>
          <View style={styles.segmentedToggle}>
            <TouchableOpacity
              style={[styles.segmentBtn, timeRange === 'Today' && styles.segmentBtnActive]}
              onPress={() => {
                haptics.selection();
                setTimeRange('Today');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentBtnText, timeRange === 'Today' && styles.segmentBtnTextActive]}>
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, timeRange === 'All Time' && styles.segmentBtnActive]}
              onPress={() => {
                haptics.selection();
                setTimeRange('All Time');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentBtnText, timeRange === 'All Time' && styles.segmentBtnTextActive]}>
                All Time
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              haptics.light();
              router.push('/(merchant)/more/analytics' as any);
            }}
          >
            <Text style={styles.viewReportsLink}>View reports →</Text>
          </TouchableOpacity>
        </View>

        {/* 2x3 Metric Cards Grid */}
        <View style={styles.gridContainer}>
          {/* Row 1: Revenue & Sales */}
          <View style={styles.gridRow}>
            {/* Card 1: Revenue */}
            <TouchableOpacity
              style={[styles.metricCard, Shadow.card as any]}
              activeOpacity={0.85}
              onPress={() => {
                haptics.light();
                router.push('/(merchant)/more/analytics' as any);
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <View style={[styles.cardIconBox, { backgroundColor: 'rgba(18, 140, 126, 0.1)' }]}>
                    <PieChart size={14} color="#0F766E" />
                  </View>
                  <Text style={styles.cardTitle}>Revenue</Text>
                </View>
                <ArrowUpRight size={15} color="#94A3B8" strokeWidth={2} />
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardValueCol}>
                  <Text style={styles.cardSublabel}>Total revenue</Text>
                  <Text style={styles.cardValue} numberOfLines={1}>
                    {revenueValue}
                  </Text>
                </View>

                {/* Progress Ring */}
                <View style={styles.progressRing}>
                  <Text style={styles.progressText}>0%</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Card 2: Sales */}
            <TouchableOpacity
              style={[styles.metricCard, Shadow.card as any]}
              activeOpacity={0.85}
              onPress={() => {
                haptics.light();
                router.push('/(merchant)/more/analytics' as any);
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <View style={[styles.cardIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <BadgePercent size={14} color="#10B981" />
                  </View>
                  <Text style={styles.cardTitle}>Sales</Text>
                </View>
                <ArrowUpRight size={15} color="#94A3B8" strokeWidth={2} />
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardValueCol}>
                  <Text style={styles.cardSublabel}>Total Sales</Text>
                  <Text style={styles.cardValue}>{salesValue}</Text>
                </View>

                {/* Progress Ring */}
                <View style={styles.progressRing}>
                  <Text style={styles.progressText}>0%</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 2: Orders & Customers */}
          <View style={styles.gridRow}>
            {/* Card 3: Orders */}
            <TouchableOpacity
              style={[styles.metricCard, Shadow.card as any]}
              activeOpacity={0.85}
              onPress={() => {
                haptics.light();
                router.push('/(merchant)/orders' as any);
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <View style={[styles.cardIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                    <FileText size={14} color="#3B82F6" />
                  </View>
                  <Text style={styles.cardTitle}>Orders</Text>
                </View>
                <ArrowUpRight size={15} color="#94A3B8" strokeWidth={2} />
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardValueCol}>
                  <Text style={styles.cardSublabel}>Total orders</Text>
                  <Text style={styles.cardValue}>{ordersValue}</Text>
                </View>

                {/* Progress Ring */}
                <View style={styles.progressRing}>
                  <Text style={styles.progressText}>0%</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Card 4: Customers */}
            <TouchableOpacity
              style={[styles.metricCard, Shadow.card as any]}
              activeOpacity={0.85}
              onPress={() => {
                haptics.light();
                router.push('/(merchant)/more/customers' as any);
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <View style={[styles.cardIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                    <PieChart size={14} color="#F59E0B" />
                  </View>
                  <Text style={styles.cardTitle}>Customers</Text>
                </View>
                <ArrowUpRight size={15} color="#94A3B8" strokeWidth={2} />
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardValueCol}>
                  <Text style={styles.cardSublabel}>Total customers</Text>
                  <Text style={styles.cardValue}>{customersValue}</Text>
                </View>

                {/* Progress Ring */}
                <View style={styles.progressRing}>
                  <Text style={styles.progressText}>0%</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 3: Total Products & Out of Stock */}
          <View style={styles.gridRow}>
            {/* Card 5: Total Products */}
            <TouchableOpacity
              style={[styles.metricCard, Shadow.card as any]}
              activeOpacity={0.85}
              onPress={() => {
                haptics.light();
                router.push('/(merchant)/products' as any);
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <View style={[styles.cardIconBox, { backgroundColor: 'rgba(14, 165, 233, 0.1)' }]}>
                    <Package size={14} color="#0EA5E9" />
                  </View>
                  <Text style={styles.cardTitle}>Total Products</Text>
                </View>
              </View>

              <View style={[styles.cardBody, { marginTop: 14 }]}>
                <Text style={styles.cardValueLarge}>{productsValue}</Text>
              </View>
            </TouchableOpacity>

            {/* Card 6: Out of stock */}
            <TouchableOpacity
              style={[styles.metricCard, Shadow.card as any]}
              activeOpacity={0.85}
              onPress={() => {
                haptics.light();
                router.push('/(merchant)/products' as any);
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <View style={[styles.cardIconBox, { backgroundColor: 'rgba(100, 116, 139, 0.1)' }]}>
                    <Inbox size={14} color="#64748B" />
                  </View>
                  <Text style={styles.cardTitle}>Out of stock</Text>
                </View>
              </View>

              <View style={[styles.cardBody, { marginTop: 14 }]}>
                <Text style={styles.cardValueLarge}>{outOfStockValue}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Sales Analytics */}
        <View style={styles.analyticsSection}>
          <Text style={styles.sectionTitle}>Sales analytics</Text>
          <View style={[styles.chartWrapper, Shadow.card as any]}>
            <RevenueChart data={chartData} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerLeft: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greetingTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bodyRegular,
    color: '#0F172A',
  },
  greetingName: {
    fontFamily: FontFamily.headingBold,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: '#ECFDF5',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  onlineText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 10,
    color: '#047857',
  },
  greetingSubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEFF5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  headerProfileBtn: {
    padding: 2,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(15, 118, 110, 0.2)',
  },

  /* Quick Actions Row */
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 16,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEFF5',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionLabel: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 12,
    color: '#0F172A',
  },

  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  segmentedToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 9999,
    padding: 3,
  },
  segmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  segmentBtnActive: {
    backgroundColor: '#0F172A',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  segmentBtnText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 12,
    color: '#64748B',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
  },
  viewReportsLink: {
    fontSize: 13,
    fontFamily: FontFamily.headingSemiBold,
    color: '#0F766E',
  },

  gridContainer: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAEFF5',
    padding: 15,
    minHeight: 104,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  cardIconBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: FontFamily.headingSemiBold,
    color: '#0F172A',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardValueCol: {
    flex: 1,
  },
  cardSublabel: {
    fontSize: 10.5,
    fontFamily: FontFamily.bodyRegular,
    color: '#94A3B8',
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 16,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  cardValueLarge: {
    fontSize: 22,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  progressRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#0F766E',
    borderRightColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 9.5,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
  },
  analyticsSection: {
    marginTop: 26,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  chartWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEFF5',
    padding: 16,
  },
});
