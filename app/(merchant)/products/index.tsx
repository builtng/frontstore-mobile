import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { Plus, LayoutGrid, List } from 'lucide-react-native';
import { SearchBar } from '@/components/ui/SearchBar';
import { ProductCard } from '@/components/merchant/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { merchantApi } from '@/services/merchantApi';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';

const STATUS_FILTERS = ['all', 'active', 'draft', 'archived'];

export default function ProductsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['products', activeStatus, search],
    queryFn: () =>
      merchantApi.getProducts({
        status: activeStatus === 'all' ? undefined : activeStatus,
        search: search || undefined,
      }),
  });

  const products = data?.data ?? [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Products</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {data?.meta?.total ?? 0} products
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.card }]}
            onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            {viewMode === 'list' ? (
              <LayoutGrid size={18} color={theme.textSecondary} />
            ) : (
              <List size={18} color={theme.textSecondary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(merchant)/products/add')}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryLight ?? '#7C3AED']}
              style={styles.addBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Plus size={20} color={Colors.white} strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search products..." />
      </View>

      {/* Status filters */}
      <View style={styles.filtersWrap}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setActiveStatus(f)}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeStatus === f ? Colors.primary : theme.card,
                borderColor: activeStatus === f ? Colors.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterLabel,
                { color: activeStatus === f ? Colors.white : theme.textSecondary },
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Products list */}
      {isLoading ? (
        <View style={styles.listPad}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} style={{ marginBottom: Spacing[3] }} />)}
        </View>
      ) : (
        <FlashList
          data={products}
          keyExtractor={(item) => String(item.id)}
          estimatedItemSize={viewMode === 'grid' ? 240 : 88}
          numColumns={viewMode === 'grid' ? 2 : 1}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              viewMode={viewMode}
              onPress={() => router.push(`/(merchant)/products/${item.id}` as any)}
              onMorePress={() => {}}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              type="products"
              actionLabel="Add Product"
              onAction={() => router.push('/(merchant)/products/add')}
            />
          }
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: Spacing[6], paddingTop: Spacing[5], paddingBottom: Spacing[3],
  },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], letterSpacing: -0.5 },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: Spacing[3], alignItems: 'center' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  addBtnGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { paddingHorizontal: Spacing[6], marginBottom: Spacing[3] },
  filtersWrap: { flexDirection: 'row', paddingHorizontal: Spacing[6], gap: Spacing[2], marginBottom: Spacing[4] },
  filterChip: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], borderRadius: 20, borderWidth: 1.5 },
  filterLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs },
  listPad: { paddingHorizontal: Spacing[6] },
  list: { paddingHorizontal: Spacing[6], paddingBottom: 120 },
  gridRow: { gap: Spacing[4], marginBottom: Spacing[4] },
});
