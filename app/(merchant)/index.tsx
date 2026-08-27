import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  PieChart,
  BadgePercent,
  FileText,
  Package,
  Inbox,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react-native';
import { RevenueChart } from '@/components/merchant/RevenueChart';
import { merchantApi } from '@/services/merchantApi';
import { DashboardStats, ChartDataPoint } from '@/types/merchant';
import { useAuthStore } from '@/stores/authStore';
import { FontFamily } from '@/constants/typography';
import { useTheme } from '@/hooks/useTheme';

const formatCurrency = (amount: number, currency = 'NGN') =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);

export default function MerchantDashboardScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [timeRange, setTimeRange] = useState('Today');
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

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStore(), refetchStats()]);
    setRefreshing(false);
  };

  // Name priority: cached store (instant) → API store (after fetch) → user name → fallback
  const cachedStoreName = user?.store?.name;
  const apiStoreName = storeRes?.data?.name;
  const storeName = apiStoreName || cachedStoreName || user?.name || 'My Store';
  const currencyCode = storeRes?.data?.currency || user?.store?.currency || 'NGN';

  // Real metric values from API
  const rawRevenue = timeRange === 'Today' ? (stats?.today_revenue ?? 0) : (stats?.total_revenue ?? 0);
  const revenueValue = formatCurrency(rawRevenue, currencyCode);
  const salesValue = timeRange === 'Today' ? (stats?.today_orders ?? 0) : (stats?.total_orders ?? 0);
  const ordersValue = timeRange === 'Today' ? (stats?.today_orders ?? 0) : (stats?.total_orders ?? 0);
  const customersValue = stats?.total_customers ?? 0;
  const productsValue = stats?.total_products ?? 0;
  const outOfStockValue = 0;

  const chartData: ChartDataPoint[] = stats?.revenue_chart && stats.revenue_chart.length > 0
    ? stats.revenue_chart
    : [
        { date: '2026-08-20', amount: 0, orders: 0 },
        { date: '2026-08-21', amount: 0, orders: 0 },
        { date: '2026-08-22', amount: 0, orders: 0 },
        { date: '2026-08-23', amount: 0, orders: 0 },
        { date: '2026-08-24', amount: 0, orders: 0 },
        { date: '2026-08-25', amount: rawRevenue, orders: salesValue },
      ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: '#FFFFFF' }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#128C7E" />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingTitle}>
              Hello <Text style={styles.greetingName}>{storeName}</Text>,
            </Text>
            <Text style={styles.greetingSubtitle}>Here's how your shop's doing</Text>
          </View>

          <TouchableOpacity
            style={styles.bellButton}
            activeOpacity={0.7}
            onPress={() => router.push('/(merchant)/more/notifications' as any)}
          >
            <Bell size={20} color="#128C7E" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Filter & View Reports Row */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.timeDropdown}
            activeOpacity={0.8}
            onPress={() => setTimeRange(timeRange === 'Today' ? 'All Time' : 'Today')}
          >
            <Text style={styles.timeDropdownText}>{timeRange}</Text>
            <ChevronDown size={14} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(merchant)/more/analytics' as any)}
          >
            <Text style={styles.viewReportsLink}>View reports</Text>
          </TouchableOpacity>
        </View>

        {/* 2x3 Metric Cards Grid */}
        <View style={styles.gridContainer}>
          {/* Row 1: Revenue & Sales */}
          <View style={styles.gridRow}>
            {/* Card 1: Revenue */}
            <TouchableOpacity
              style={styles.metricCard}
              activeOpacity={0.85}
              onPress={() => router.push('/(merchant)/more/analytics' as any)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <PieChart size={16} color="#128C7E" fill="#128C7E" />
                  <Text style={styles.cardTitle}>Revenue</Text>
                </View>
                <ArrowUpRight size={16} color="#0F172A" />
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
              style={styles.metricCard}
              activeOpacity={0.85}
              onPress={() => router.push('/(merchant)/more/analytics' as any)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <BadgePercent size={16} color="#128C7E" />
                  <Text style={styles.cardTitle}>Sales</Text>
                </View>
                <ArrowUpRight size={16} color="#0F172A" />
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
              style={styles.metricCard}
              activeOpacity={0.85}
              onPress={() => router.push('/(merchant)/orders' as any)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <FileText size={16} color="#128C7E" />
                  <Text style={styles.cardTitle}>Orders</Text>
                </View>
                <ArrowUpRight size={16} color="#0F172A" />
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
              style={styles.metricCard}
              activeOpacity={0.85}
              onPress={() => router.push('/(merchant)/more/customers' as any)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <PieChart size={16} color="#128C7E" fill="#128C7E" />
                  <Text style={styles.cardTitle}>Customers</Text>
                </View>
                <ArrowUpRight size={16} color="#0F172A" />
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
              style={styles.metricCard}
              activeOpacity={0.85}
              onPress={() => router.push('/(merchant)/products' as any)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Package size={16} color="#128C7E" />
                  <Text style={styles.cardTitle}>Total Products</Text>
                </View>
              </View>

              <View style={[styles.cardBody, { marginTop: 14 }]}>
                <Text style={styles.cardValueLarge}>{productsValue}</Text>
              </View>
            </TouchableOpacity>

            {/* Card 6: Out of stock */}
            <TouchableOpacity
              style={styles.metricCard}
              activeOpacity={0.85}
              onPress={() => router.push('/(merchant)/products' as any)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Inbox size={16} color="#128C7E" />
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
          <View style={styles.chartWrapper}>
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
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
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
  greetingTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bodyRegular,
    color: '#0F172A',
  },
  greetingName: {
    fontFamily: FontFamily.headingBold,
  },
  greetingSubtitle: {
    fontSize: 13.5,
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
    marginTop: 2,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 16,
  },
  timeDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  timeDropdownText: {
    fontSize: 13,
    fontFamily: FontFamily.headingSemiBold,
    color: '#0F172A',
  },
  viewReportsLink: {
    fontSize: 13.5,
    fontFamily: FontFamily.headingBold,
    color: '#128C7E',
  },
  gridContainer: {
    gap: 14,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
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
    gap: 6,
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
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
  },
  cardValueLarge: {
    fontSize: 20,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
  },
  progressRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#0F172A',
    borderRightColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 9.5,
    fontFamily: FontFamily.headingSemiBold,
    color: '#0F172A',
  },
  analyticsSection: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
    marginBottom: 12,
  },
  chartWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
});
