import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  RefreshControl, Dimensions, Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import {
  Bell, Store, TrendingUp, ShoppingBag, Users, Wallet,
  Plus, ChevronRight, ArrowUpRight, Zap, Star, QrCode, Megaphone,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { SkeletonStatCard, Skeleton, SkeletonCard } from '@/components/ui/SkeletonLoader';
import { Badge } from '@/components/ui/Badge';
import { OrderCard } from '@/components/merchant/OrderCard';
import { RevenueChart } from '@/components/merchant/RevenueChart';
import { NinaCard } from '@/components/merchant/NinaCard';
import { merchantApi } from '@/services/merchantApi';
import { DashboardStats, TopProduct, Order } from '@/types/merchant';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function DashboardScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();
  const isPro = user?.plan === 'pro_monthly' || user?.plan === 'pro_yearly';
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, isLoading, refetch } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: merchantApi.getDashboardStats,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const storeUrl = user?.store?.username ? `https://frontstore.ng/${user.store.username}` : 'https://frontstore.ng';

  const shareStoreLink = async () => {
    await Share.share({ message: `Shop at ${user?.store?.name ?? 'my store'} on FrontStore!\n${storeUrl}` });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>{getGreeting()} 👋</Text>
            <Text style={[styles.name, { color: theme.text }]}>{firstName}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.card }, Shadow.sm as any]}>
              <Bell size={20} color={theme.text} strokeWidth={2} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.storeBtn, { backgroundColor: Colors.primaryDim }]}
              onPress={() => router.push('/(merchant)/more/settings')}
            >
              {user?.store?.logo_url ? (
                <Image source={{ uri: user.store.logo_url }} style={styles.storeLogo} contentFit="cover" />
              ) : (
                <Store size={18} color={Colors.primary} strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Revenue hero card */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={isDark ? ['#022C22', '#128C7E'] : ['#128C7E', '#25D366']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroLabel}>Today's Revenue</Text>
                {isLoading ? (
                  <Skeleton width={140} height={36} radius={8} style={{ marginTop: 4 }} />
                ) : (
                  <Text style={styles.heroAmount}>
                    {formatCurrency(stats?.today_revenue ?? 0)}
                  </Text>
                )}
              </View>
              <TouchableOpacity style={styles.heroBtn} onPress={() => router.push('/(merchant)/more/wallet')}>
                <Wallet size={18} color={Colors.white} />
                <Text style={styles.heroBtnText}>Wallet</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.heroStats}>
              {[
                { label: 'Orders Today', value: stats?.today_orders ?? 0 },
                { label: 'Pending', value: stats?.pending_orders ?? 0 },
                { label: 'Total Revenue', value: stats ? formatCurrency(stats.total_revenue) : '—' },
              ].map((s, i) => (
                <View key={i} style={styles.heroStat}>
                  <Text style={styles.heroStatVal}>
                    {typeof s.value === 'number' ? s.value : s.value}
                  </Text>
                  <Text style={styles.heroStatLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* Nina proactive card */}
        <NinaCard
          merchantName={firstName}
          hint={
            !stats?.total_products
              ? 'Your store needs products. Add a few items so customers can start ordering.'
              : !user?.store?.logo_url
              ? 'Add a store logo — customers trust stores with a clear identity.'
              : (stats?.pending_orders ?? 0) > 0
              ? `You have ${stats!.pending_orders} pending order${stats!.pending_orders > 1 ? 's' : ''}. Confirm them to keep customers happy.`
              : undefined
          }
        />

        {/* Quick actions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
          {[
            { label: 'Add Product', icon: <Plus size={20} color={Colors.white} />, color: Colors.primary, route: '/(merchant)/products/add' },
            { label: 'View Orders', icon: <ShoppingBag size={20} color={Colors.white} />, color: Colors.success, route: '/(merchant)/orders/index' },
            { label: 'Marketing', icon: <Megaphone size={20} color={Colors.white} />, color: '#D97706', route: '/(merchant)/marketing' },
            { label: 'Analytics', icon: <TrendingUp size={20} color={Colors.white} />, color: Colors.info, route: '/(merchant)/more/index' },
          ].map((action, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.quickAction, { backgroundColor: action.color }]}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIcon}>{action.icon}</View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stats grid */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Overview</Text>
        </View>
        <View style={styles.statsGrid}>
          {isLoading ? (
            <>
              <SkeletonStatCard />
              <SkeletonStatCard />
            </>
          ) : (
            <>
              <StatCard
                label="Total Orders"
                value={String(stats?.total_orders ?? 0)}
                icon={<ShoppingBag size={20} color={Colors.primary} strokeWidth={2} />}
                accentColor={Colors.primary}
              />
              <StatCard
                label="Customers"
                value={String(stats?.total_customers ?? 0)}
                icon={<Users size={20} color={Colors.success} strokeWidth={2} />}
                accentColor={Colors.success}
              />
            </>
          )}
        </View>

        {/* Revenue chart */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Revenue Trend</Text>
          <TouchableOpacity>
            <Text style={[styles.sectionLink, { color: Colors.primary }]}>7 days</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.chartCard, { backgroundColor: theme.card }, Shadow.md as any]}>
          {isLoading ? (
            <Skeleton width="100%" height={160} radius={12} />
          ) : (
            <RevenueChart data={stats?.revenue_chart ?? []} />
          )}
        </View>

        {/* Top products */}
        {(stats?.top_products?.length ?? 0) > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Top Products</Text>
              <TouchableOpacity onPress={() => router.push('/(merchant)/products/index')}>
                <Text style={[styles.sectionLink, { color: Colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.topProductsCard, { backgroundColor: theme.card }, Shadow.sm as any]}>
              {stats!.top_products.slice(0, 4).map((tp: TopProduct, i: number) => (
                <View key={i} style={[styles.topProductRow, i < 3 && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
                  <View style={[styles.rankBadge, { backgroundColor: Colors.primaryDim }]}>
                    <Text style={[styles.rank, { color: Colors.primary }]}>#{i + 1}</Text>
                  </View>
                  <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>
                    {tp.product.name}
                  </Text>
                  <Text style={[styles.productRevenue, { color: Colors.primary }]}>
                    {formatCurrency(tp.revenue)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Recent orders */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Orders</Text>
          <TouchableOpacity onPress={() => router.push('/(merchant)/orders/index')}>
            <Text style={[styles.sectionLink, { color: Colors.primary }]}>View all</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          [1, 2, 3].map((i) => <SkeletonCard key={i} style={{ marginBottom: Spacing[3] }} />)
        ) : stats?.recent_orders?.length ? (
          stats.recent_orders.slice(0, 5).map((order: Order) => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() => router.push(`/(merchant)/orders/${order.id}` as any)}
            />
          ))
        ) : (
          <View style={[styles.emptyOrders, { backgroundColor: theme.card }]}>
            <ShoppingBag size={32} color={theme.textTertiary} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No orders yet. Share your store to start selling!
            </Text>
          </View>
        )}

        {/* QR Code card */}
        {user?.store?.username && (
          <TouchableOpacity
            style={[styles.qrCard, { backgroundColor: theme.card }, Shadow.md as any]}
            onPress={() => router.push('/(merchant)/qr-code' as any)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#128C7E18', '#128C7E08']}
              style={styles.qrCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.qrCardLeft}>
                <View style={[styles.qrIconWrap, { backgroundColor: Colors.primaryDim }]}>
                  <QrCode size={24} color={Colors.primary} strokeWidth={2} />
                </View>
                <View style={styles.qrCardInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
                    <Text style={[styles.qrCardTitle, { color: theme.text }]}>My Store QR Code</Text>
                    {!isPro && <Badge label="Pro" variant="primary" size="sm" />}
                  </View>
                  <Text style={[styles.qrCardSub, { color: theme.textSecondary }]}>
                    Customers scan to visit your store
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color={theme.textTertiary} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Store health */}
        <View style={[styles.healthCard, { backgroundColor: theme.card }, Shadow.md as any]}>
          <View style={styles.healthHeader}>
            <Star size={18} color={Colors.amber} fill={Colors.amber} />
            <Text style={[styles.healthTitle, { color: theme.text }]}>Store Health</Text>
            <Badge label="Good" variant="success" size="sm" />
          </View>
          {[
            { label: 'Products added', done: (stats?.total_products ?? 0) > 0 },
            { label: 'Payment connected', done: true },
            { label: 'Store logo uploaded', done: !!user?.store?.logo_url },
            { label: 'First order received', done: (stats?.total_orders ?? 0) > 0 },
          ].map((item, i) => (
            <View key={i} style={styles.healthRow}>
              <View style={[styles.healthDot, { backgroundColor: item.done ? Colors.success : theme.border }]} />
              <Text style={[styles.healthItem, { color: item.done ? theme.text : theme.textTertiary }]}>
                {item.label}
              </Text>
              {item.done && <Text style={styles.healthCheck}>✓</Text>}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, Shadow.xl as any]}
        onPress={() => router.push('/(merchant)/products/add')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryLight ?? '#25D366']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Plus size={26} color={Colors.white} strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: Spacing[6], paddingBottom: 120 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing[5],
    marginBottom: Spacing[5],
  },
  greeting: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm },
  name: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', gap: Spacing[3] },
  iconBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notifDot: { position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger, borderWidth: 1.5, borderColor: Colors.white },
  storeBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  storeLogo: { width: 42, height: 42 },

  heroCard: { borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing[6] },
  heroGradient: { padding: Spacing[5], gap: Spacing[5] },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)' },
  heroAmount: { fontFamily: FontFamily.headingBold, fontSize: FontSize['4xl'], color: Colors.white, letterSpacing: -1, marginTop: 4 },
  heroBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], borderRadius: Radius.full },
  heroBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.white },
  heroStats: { flexDirection: 'row', justifyContent: 'space-between' },
  heroStat: { alignItems: 'center' },
  heroStatVal: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, color: Colors.white },
  heroStatLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  quickActions: { paddingBottom: Spacing[2], gap: Spacing[3], paddingRight: Spacing[6] },
  quickAction: { width: 88, height: 88, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', gap: Spacing[2] },
  quickActionIcon: {},
  quickActionLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, color: Colors.white, textAlign: 'center' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing[6], marginBottom: Spacing[4] },
  sectionTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.lg },
  sectionLink: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },

  statsGrid: { flexDirection: 'row', gap: Spacing[4] },

  chartCard: { borderRadius: Radius.lg, padding: Spacing[5], marginBottom: Spacing[2] },

  topProductsCard: { borderRadius: Radius.lg, overflow: 'hidden' },
  topProductRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[4], paddingVertical: Spacing[4], gap: Spacing[3] },
  rankBadge: { width: 28, height: 28, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  rank: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs },
  productName: { flex: 1, fontFamily: FontFamily.bodyMedium, fontSize: FontSize.sm },
  productRevenue: { fontFamily: FontFamily.headingBold, fontSize: FontSize.sm },

  emptyOrders: { borderRadius: Radius.lg, padding: Spacing[8], alignItems: 'center', gap: Spacing[3] },
  emptyText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },

  healthCard: { borderRadius: Radius.lg, padding: Spacing[5], marginTop: Spacing[5], gap: Spacing[3] },
  healthHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: Spacing[2] },
  healthTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.md, flex: 1 },
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  healthItem: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm },
  healthCheck: { color: Colors.success, fontFamily: FontFamily.bodySemiBold },

  qrCard: { borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing[5] },
  qrCardGradient: { flexDirection: 'row', alignItems: 'center', padding: Spacing[4], gap: Spacing[3] },
  qrCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  qrIconWrap: { width: 46, height: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  qrCardInfo: { flex: 1 },
  qrCardTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.base },
  qrCardSub: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, marginTop: 2 },

  fab: {
    position: 'absolute',
    bottom: 100,
    right: Spacing[6],
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
  },
  fabGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
