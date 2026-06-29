import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, RefreshControl,
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
import { Colors } from '@/constants/colors';
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

import { ScrollView, TouchableOpacity } from 'react-native';

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
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Orders</Text>
        {data?.meta?.total !== undefined && (
          <View style={[styles.countBadge, { backgroundColor: Colors.primaryDim }]}>
            <Text style={[styles.countText, { color: Colors.primary }]}>{data.meta.total}</Text>
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            onPress={() => setActiveStatus(f.value)}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeStatus === f.value ? Colors.primary : theme.card,
                borderColor: activeStatus === f.value ? Colors.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterLabel,
                { color: activeStatus === f.value ? Colors.white : theme.textSecondary },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders list */}
      {isLoading ? (
        <View style={styles.listPad}>
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} style={{ marginBottom: Spacing[3] }} />)}
        </View>
      ) : (
        <FlashList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          estimatedItemSize={90}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={() => router.push(`/(merchant)/orders/${item.id}` as any)} />
          )}
          ListEmptyComponent={
            <EmptyState
              type="orders"
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[6], paddingTop: Spacing[5], paddingBottom: Spacing[3], gap: Spacing[3] },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], letterSpacing: -0.5 },
  countBadge: { paddingHorizontal: Spacing[3], paddingVertical: 3, borderRadius: 12 },
  countText: { fontFamily: FontFamily.headingBold, fontSize: FontSize.sm },
  searchWrap: { paddingHorizontal: Spacing[6], marginBottom: Spacing[3] },
  filters: { paddingHorizontal: Spacing[6], paddingBottom: Spacing[4], gap: Spacing[2] },
  filterChip: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], borderRadius: 20, borderWidth: 1.5 },
  filterLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs },
  listPad: { paddingHorizontal: Spacing[6] },
  list: { paddingHorizontal: Spacing[6], paddingBottom: 100 },
});
