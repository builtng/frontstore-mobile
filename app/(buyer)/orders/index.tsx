import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { ArrowLeft, Package } from 'lucide-react-native';
import { Badge, getOrderStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { buyerApi } from '@/services/buyerApi';
import { PublicOrder } from '@/types/buyer';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { format } from 'date-fns';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

export default function BuyerOrdersScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['buyer-orders'],
    queryFn: buyerApi.getOrders,
    select: (r) => r.data ?? [],
  });

  const orders: PublicOrder[] = data ?? [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>My Orders</Text>
        <View style={{ width: 22 }} />
      </View>

      {isLoading ? (
        <View style={styles.list}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} style={{ marginBottom: Spacing[3] }} />)}
        </View>
      ) : (
        <FlashList
          data={orders}
          keyExtractor={(o) => String(o.id)}
          estimatedItemSize={100}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          renderItem={({ item: order }) => (
            <TouchableOpacity
              style={[styles.orderCard, { backgroundColor: theme.card }, Shadow.sm as any]}
              onPress={() => router.push(`/(buyer)/orders/${order.id}` as any)}
              activeOpacity={0.8}
            >
              <View style={styles.orderTop}>
                <View style={[styles.orderIcon, { backgroundColor: Colors.primaryDim }]}>
                  <Package size={18} color={Colors.primary} strokeWidth={2} />
                </View>
                <View style={styles.orderInfo}>
                  <Text style={[styles.orderRef, { color: theme.text }]}>#{order.reference}</Text>
                  <Text style={[styles.orderStore, { color: theme.textSecondary }]}>{order.store?.name}</Text>
                </View>
                <Text style={[styles.orderTotal, { color: Colors.primary }]}>{formatCurrency(order.total)}</Text>
              </View>
              <View style={styles.orderBottom}>
                <Badge label={order.status.replace(/_/g, ' ')} variant={getOrderStatusBadge(order.status)} size="sm" dot />
                <Text style={[styles.orderDate, { color: theme.textTertiary }]}>
                  {format(new Date(order.created_at), 'MMM d, yyyy')}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState
              type="orders"
              title="No orders yet"
              description="Your orders from FrontStore merchants will appear here."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[6], paddingTop: Spacing[5], paddingBottom: Spacing[4] },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, letterSpacing: -0.3 },
  list: { paddingHorizontal: Spacing[6], paddingBottom: 100 },
  orderCard: { borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[3], gap: Spacing[3] },
  orderTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  orderIcon: { width: 40, height: 40, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  orderInfo: { flex: 1 },
  orderRef: { fontFamily: FontFamily.headingBold, fontSize: FontSize.base },
  orderStore: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, marginTop: 2 },
  orderTotal: { fontFamily: FontFamily.headingBold, fontSize: FontSize.md },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderDate: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },
});
