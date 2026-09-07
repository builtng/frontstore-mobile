import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, RefreshControl, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { Plus, LayoutGrid, List } from 'lucide-react-native';
import { SearchBar } from '@/components/ui/SearchBar';
import { ProductCard } from '@/components/merchant/ProductCard';
import { ProductsEmptyState } from '@/components/merchant/ProductsEmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { merchantApi } from '@/services/merchantApi';
import { Product } from '@/types/merchant';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { LinearGradient } from 'expo-linear-gradient';

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Archived', value: 'archived' },
];

export default function ProductsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const haptics = useHaptics();
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

  const products = (data?.data ?? []) as Product[];
  const totalCount = data?.meta?.total ?? products.length ?? 0;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? '#0B1120' : '#F8FAFC' }]}>
      {/* Executive Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>Products</Text>
          <View style={[styles.countBadge, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
            <Text style={[styles.countText, { color: isDark ? '#94A3B8' : '#475569' }]}>
              {totalCount} {totalCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Segmented View Mode Toggle */}
          <View style={[styles.viewToggleGroup, { backgroundColor: isDark ? '#1E293B' : '#EEF2F6' }]}>
            <TouchableOpacity
              style={[
                styles.viewToggleBtn,
                viewMode === 'list' && [styles.viewToggleBtnActive, { backgroundColor: isDark ? '#334155' : '#FFFFFF' }],
              ]}
              onPress={() => {
                haptics.selection();
                setViewMode('list');
              }}
              activeOpacity={0.8}
            >
              <List
                size={16}
                color={viewMode === 'list' ? (isDark ? '#F8FAFC' : '#0F172A') : (isDark ? '#64748B' : '#94A3B8')}
                strokeWidth={viewMode === 'list' ? 2.5 : 2}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewToggleBtn,
                viewMode === 'grid' && [styles.viewToggleBtnActive, { backgroundColor: isDark ? '#334155' : '#FFFFFF' }],
              ]}
              onPress={() => {
                haptics.selection();
                setViewMode('grid');
              }}
              activeOpacity={0.8}
            >
              <LayoutGrid
                size={16}
                color={viewMode === 'grid' ? (isDark ? '#F8FAFC' : '#0F172A') : (isDark ? '#64748B' : '#94A3B8')}
                strokeWidth={viewMode === 'grid' ? 2.5 : 2}
              />
            </TouchableOpacity>
          </View>

          {/* New Product CTA */}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              haptics.light();
              router.push('/(merchant)/products/add');
            }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#0F766E', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addBtnGradient}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.8} />
              <Text style={styles.addBtnText}>New</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search products by title or sku..." />
      </View>

      {/* Segmented Status filters */}
      <View style={styles.filtersWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
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
                    ? [styles.filterChipActive, { backgroundColor: isDark ? '#38BDF8' : '#0F172A' }]
                    : [styles.filterChipInactive, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }],
                ]}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    isActive
                      ? [styles.filterLabelActive, { color: isDark ? '#0F172A' : '#FFFFFF' }]
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

      {/* Products list */}
      {isLoading ? (
        <View style={styles.listPad}>
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} style={{ marginBottom: Spacing[3] }} />)}
        </View>
      ) : (
        <FlashList<Product>
          data={products}
          keyExtractor={(item) => String(item.id)}
          estimatedItemSize={viewMode === 'grid' ? 240 : 88}
          numColumns={viewMode === 'grid' ? 2 : 1}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#128C7E" />}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              viewMode={viewMode}
              onPress={() => {
                haptics.light();
                router.push(`/(merchant)/products/${item.id}` as any);
              }}
              onMorePress={() => {}}
            />
          )}
          ListEmptyComponent={
            <ProductsEmptyState
              onAddProduct={() => {
                haptics.light();
                router.push('/(merchant)/products/add');
              }}
              search={search}
              activeStatus={activeStatus}
              onClearFilters={() => {
                haptics.selection();
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[3],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 26,
    letterSpacing: -0.6,
  },
  countBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  countText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11.5,
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing[2],
    alignItems: 'center',
  },
  viewToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: Radius.full,
    gap: 2,
  },
  viewToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleBtnActive: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  addBtn: {
    height: 38,
    borderRadius: Radius.full,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  addBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: '100%',
    gap: 5,
  },
  addBtnText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  searchWrap: {
    paddingHorizontal: Spacing[5],
    marginBottom: Spacing[3],
  },
  filtersWrap: {
    marginBottom: Spacing[4],
  },
  filtersScroll: {
    paddingHorizontal: Spacing[5],
    gap: Spacing[2],
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6.5,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
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
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12.5,
  },
  filterLabelActive: {
    fontFamily: FontFamily.bodyBold,
  },
  filterLabelInactive: {},
  listPad: {
    paddingHorizontal: Spacing[5],
  },
  list: {
    paddingHorizontal: Spacing[5],
    paddingBottom: 120,
  },
});
