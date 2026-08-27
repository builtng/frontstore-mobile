import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, RefreshControl, ScrollView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { SearchBar } from '@/components/ui/SearchBar';
import { OrderCard } from '@/components/merchant/OrderCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { merchantApi } from '@/services/merchantApi';
import { Order, OrderStatus } from '@/types/merchant';
import { FontFamily, FontSize } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

const STATUS_FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function OrdersScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<OrderStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', activeStatus, search],
    queryFn: () =>
      merchantApi.getOrders({
        status: activeStatus === 'all' ? undefined : activeStatus,
        search: search || undefined,
      }),
  });

  const orders: Order[] = data?.data ?? [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: '#FFFFFF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: '#0F172A' }]}>Orders</Text>
        {data?.meta?.total !== undefined && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{data.meta.total}</Text>
          </View>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by order #, customer name..."
        />
      </View>

      {/* Status filters */}
      <View style={styles.filterScrollContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {STATUS_FILTERS.map((f) => {
            const isActive = activeStatus === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                onPress={() => setActiveStatus(f.value)}
                activeOpacity={0.8}
                style={[
                  styles.filterChip,
                  isActive ? styles.filterChipActive : styles.filterChipInactive,
                ]}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    isActive ? styles.filterLabelActive : styles.filterLabelInactive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders list */}
      {isLoading ? (
        <View style={styles.listPad}>
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} style={{ marginBottom: Spacing[3] }} />)}
        </View>
      ) : (
        <FlashList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          estimatedItemSize={100}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#128C7E" />}
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={() => router.push(`/(merchant)/orders/${item.id}` as any)} />
          )}
          ListEmptyComponent={
            <EmptyState
              type="orders"
              title="No orders yet"
              description="When customers place orders, they'll appear here. Share your store to start selling."
              actionLabel="Share Store"
              onAction={() => {}}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Spacing[4],
    paddingBottom: Spacing[3],
    gap: 10,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize['2xl'],
    letterSpacing: -0.5,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: 'rgba(18, 140, 126, 0.12)',
  },
  countText: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xs,
    color: '#128C7E',
  },
  searchWrap: {
    paddingHorizontal: 20,
    marginBottom: Spacing[2],
  },
  filterScrollContainer: {
    height: 48,
    marginVertical: 4,
  },
  filters: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 18,
    height: 36,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
  },
  filterChipInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterLabel: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.xs,
  },
  filterLabelActive: {
    color: '#FFFFFF',
  },
  filterLabelInactive: {
    color: '#64748B',
  },
  listPad: { paddingHorizontal: 20 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
});
