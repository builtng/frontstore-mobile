import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import {
  Search,
  MessageSquare,
  Package,
} from 'lucide-react-native';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { buyerApi } from '@/services/buyerApi';
import { PublicOrder } from '@/types/buyer';
import { FontFamily } from '@/constants/typography';
import { useTheme } from '@/hooks/useTheme';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'returns', label: 'Returns' },
  { id: 'cancelled', label: 'Cancelled' },
];

interface OrderItemDisplay {
  id: number | string;
  reference: string;
  product_name?: string;
  variant?: string;
  image_url?: string;
  total: number;
  status: string;
  status_label?: string;
  items_count?: number;
  courier_name?: string;
  created_at: string;
  store?: { name?: string };
  items?: { product: { name: string; images: { url: string }[] }; quantity: number; price: number; total: number }[];
}

// Fallback sample data to showcase the design preview if API is empty
const DEMO_ORDERS: OrderItemDisplay[] = [
  {
    id: 1041,
    reference: 'BGS08975201',
    product_name: 'XT-04 OG Trail Runner',
    variant: 'Silver Reflective, 42',
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
    total: 85000,
    status: 'pending',
    status_label: 'Waiting',
    items_count: 1,
    courier_name: 'Ralph Edwards',
    created_at: new Date().toISOString(),
  },
  {
    id: 1042,
    reference: 'BGS08988673',
    product_name: 'ODYSSEY ELMT High',
    variant: 'Gray, 42',
    image_url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&q=80',
    total: 92000,
    status: 'shipped',
    status_label: 'Shipping',
    items_count: 1,
    courier_name: 'Ralph Edwards',
    created_at: new Date().toISOString(),
  },
  {
    id: 1043,
    reference: 'BGS08991204',
    product_name: 'SPEEDCROSS 3 Pro',
    variant: 'Black, 42',
    image_url: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&q=80',
    total: 110000,
    status: 'shipped',
    status_label: 'Shipping',
    items_count: 2,
    courier_name: 'David Adeleke',
    created_at: new Date().toISOString(),
  },
];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

export default function BuyerOrdersScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [activeFilter, setActiveFilter] = useState('shipped');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['buyer-orders'],
    queryFn: buyerApi.getOrders,
    select: (r) => (r.data ?? []) as unknown as OrderItemDisplay[],
  });

  const rawOrders: OrderItemDisplay[] = data && data.length > 0 ? data : DEMO_ORDERS;

  const filteredOrders = useMemo(() => {
    return rawOrders.filter((order) => {
      const matchesSearch =
        !searchQuery ||
        (order.reference && order.reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.product_name && order.product_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.store?.name && order.store.name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (activeFilter === 'all') return matchesSearch;
      if (activeFilter === 'processing') return matchesSearch && (order.status === 'processing' || order.status === 'pending');
      if (activeFilter === 'shipped') return matchesSearch && (order.status === 'shipped' || order.status_label === 'Shipping');
      if (activeFilter === 'returns') return matchesSearch && order.status === 'returned';
      if (activeFilter === 'cancelled') return matchesSearch && order.status === 'cancelled';
      return matchesSearch;
    });
  }, [rawOrders, activeFilter, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusBadgeStyle = (status: string) => {
    if (status === 'shipped' || status === 'Shipping') {
      return {
        bg: 'rgba(18, 140, 126, 0.12)',
        text: '#128C7E',
        label: 'Shipping',
      };
    }
    if (status === 'pending' || status === 'Waiting') {
      return {
        bg: 'rgba(245, 158, 11, 0.12)',
        text: '#D97706',
        label: 'Waiting',
      };
    }
    if (status === 'delivered') {
      return {
        bg: 'rgba(37, 211, 102, 0.15)',
        text: '#059669',
        label: 'Delivered',
      };
    }
    return {
      bg: 'rgba(100, 116, 139, 0.12)',
      text: '#475569',
      label: status,
    };
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: '#F8FAFC' }]}>
      {/* Top Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search shoes or orders..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Horizontal Status Filter Pills */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {STATUS_FILTERS.map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setActiveFilter(f.id)}
                activeOpacity={0.8}
                style={[
                  styles.filterPill,
                  isActive ? styles.filterPillActive : styles.filterPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive ? styles.filterTextActive : styles.filterTextInactive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      {isLoading ? (
        <View style={styles.listContainer}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} style={{ marginBottom: 16 }} />
          ))}
        </View>
      ) : (
        <FlashList
          data={filteredOrders}
          keyExtractor={(item) => String(item.id || item.reference)}
          estimatedItemSize={210}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#128C7E"
            />
          }
          renderItem={({ item }) => {
            const statusConfig = getStatusBadgeStyle(item.status_label || item.status);
            const firstItem = item.items && item.items[0];
            const displayTitle = item.product_name || firstItem?.product?.name || `Order #${item.reference}`;
            const displayVariant = item.variant || item.store?.name || 'Standard Delivery';
            const imageUrl = item.image_url || firstItem?.product?.images?.[0]?.url;
            const totalCount = item.items_count || (item.items ? item.items.reduce((acc, it) => acc + (it.quantity || 1), 0) : 1);

            return (
              <View style={styles.orderCard}>
                {/* Top Row: Thumbnail + Title + Status Badge */}
                <View style={styles.cardHeader}>
                  <View style={styles.thumbnailContainer}>
                    {imageUrl ? (
                      <Image source={{ uri: imageUrl }} style={styles.thumbnailImage} />
                    ) : (
                      <View style={styles.thumbnailFallback}>
                        <Package size={24} color="#128C7E" />
                      </View>
                    )}
                  </View>

                  <View style={styles.titleColumn}>
                    <View style={styles.titleRow}>
                      <Text style={styles.productTitle} numberOfLines={1}>
                        {displayTitle}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: statusConfig.text }]}>
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.productVariant} numberOfLines={1}>
                      {displayVariant}
                    </Text>

                    <Text style={styles.priceText}>{formatCurrency(item.total || 0)}</Text>
                  </View>
                </View>

                {/* Metadata Row: ID Order + Total Items */}
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>
                    ID Order <Text style={styles.metaValue}>{item.reference}</Text>
                  </Text>
                  <Text style={styles.metaLabel}>
                    Total Items <Text style={styles.metaValue}>{totalCount}</Text>
                  </Text>
                </View>

                {/* Divider */}
                <View style={styles.cardDivider} />

                {/* Action Buttons Row */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.chatIconButton}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/(buyer)/tracking/chat?id=${item.id || item.reference}` as any)}
                  >
                    <MessageSquare size={18} color="#128C7E" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/(buyer)/orders/${item.id || 1042}` as any)}
                  >
                    <Text style={styles.secondaryButtonText}>View Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/(buyer)/tracking/live?id=${item.id || item.reference}` as any)}
                  >
                    <Text style={styles.primaryButtonText}>Track Order</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.bodyRegular,
    color: '#0F172A',
  },
  filterWrapper: {
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
  },
  filterPillInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterText: {
    fontSize: 13.5,
    fontFamily: FontFamily.headingSemiBold,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  filterTextInactive: {
    color: '#64748B',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 6,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 14,
  },
  thumbnailContainer: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18, 140, 126, 0.08)',
  },
  titleColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  productTitle: {
    fontSize: 16,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontFamily: FontFamily.headingBold,
  },
  productVariant: {
    fontSize: 12.5,
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
    marginTop: 2,
  },
  priceText: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  metaLabel: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
  },
  metaValue: {
    fontFamily: FontFamily.headingSemiBold,
    color: '#0F172A',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chatIconButton: {
    width: 42,
    height: 42,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    height: 42,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 13.5,
    fontFamily: FontFamily.headingSemiBold,
    color: '#0F172A',
  },
  primaryButton: {
    flex: 1.1,
    height: 42,
    borderRadius: 9999,
    backgroundColor: '#128C7E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#128C7E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 13.5,
    fontFamily: FontFamily.headingSemiBold,
    color: '#FFFFFF',
  },
});
