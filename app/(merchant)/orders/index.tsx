import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import * as Clipboard from 'expo-clipboard';
import { Share2 } from 'lucide-react-native';
import { SearchBar } from '@/components/ui/SearchBar';
import { OrderCard } from '@/components/merchant/OrderCard';
import { OrdersEmptyState } from '@/components/merchant/OrdersEmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { merchantApi } from '@/services/merchantApi';
import { Order, OrderStatus } from '@/types/merchant';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';

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
  const { theme, isDark } = useTheme();
  const haptics = useHaptics();
  const toast = useToast();
  const { user } = useAuthStore();
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

  const handleShareStore = async () => {
    haptics.success();
    const username = user?.store?.username || 'store';
    const url = `https://${username}.frontstore.ng`;
    await Clipboard.setStringAsync(url);
    toast.success('Store link copied to clipboard!');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? '#0B0F17' : '#F8FAFC' }]}>
      {/* Executive Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>Orders</Text>
          <View style={[styles.countBadge, { backgroundColor: isDark ? 'rgba(15, 118, 110, 0.2)' : '#ECFDF5' }]}>
            <View style={styles.statusDot} />
            <Text style={styles.countText}>
              {data?.meta?.total ?? 0} {data?.meta?.total === 1 ? 'order' : 'orders'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.shareHeaderBtn,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
          onPress={handleShareStore}
          activeOpacity={0.75}
        >
          <Share2 size={13} color="#0F766E" strokeWidth={2.2} />
          <Text style={styles.shareHeaderText}>Share Store</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by order #, customer name..."
        />
      </View>

      {/* Status Filter Chips */}
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
                onPress={() => {
                  haptics.selection();
                  setActiveStatus(f.value);
                }}
                activeOpacity={0.8}
                style={[
                  styles.filterChip,
                  isActive
                    ? styles.filterChipActive
                    : [
                        styles.filterChipInactive,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                          borderColor: isDark ? '#334155' : '#E2E8F0',
                        },
                      ],
                ]}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    isActive
                      ? styles.filterLabelActive
                      : [styles.filterLabelInactive, { color: isDark ? '#94A3B8' : '#64748B' }],
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List / Rich Empty State */}
      {isLoading ? (
        <View style={styles.listPad}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} style={{ marginBottom: Spacing[3] }} />
          ))}
        </View>
      ) : (
        <FlashList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          estimatedItemSize={120}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F766E" />
          }
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => {
                haptics.light();
                router.push(`/(merchant)/orders/${item.id}` as any);
              }}
            />
          )}
          ListEmptyComponent={
            <OrdersEmptyState
              storeUsername={user?.store?.username || 'store'}
              storeName={user?.store?.name || 'Your Store'}
              search={search}
              activeStatus={activeStatus}
              onClearFilters={() => {
                setSearch('');
                setActiveStatus('all');
              }}
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[3],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    letterSpacing: -0.6,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: Radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  countText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    color: '#0F766E',
  },
  shareHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: Radius.full,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  shareHeaderText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 12,
    color: '#0F766E',
  },
  searchWrap: {
    paddingHorizontal: Spacing[5],
    marginBottom: Spacing[2],
  },
  filterScrollContainer: {
    height: 46,
    marginVertical: 4,
  },
  filters: {
    paddingHorizontal: Spacing[5],
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 15,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipInactive: {
    borderWidth: 1,
  },
  filterLabel: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 12,
  },
  filterLabelActive: {
    color: '#FFFFFF',
  },
  filterLabelInactive: {},
  listPad: { paddingHorizontal: Spacing[5] },
  list: { paddingHorizontal: Spacing[5], paddingBottom: 120 },
});
