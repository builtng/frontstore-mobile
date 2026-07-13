import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, RefreshControl, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Search, Sparkles, ChevronRight, Store, Shirt, UtensilsCrossed, Package, Smartphone, Download, Wrench, Palette, LayoutGrid, LucideIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { StoreCard } from '@/components/buyer/StoreCard';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { publicApi } from '@/services/publicApi';
import { PublicStore } from '@/types/buyer';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');

const CATEGORIES: { label: string; Icon: LucideIcon; type: string }[] = [
  { label: 'Fashion', Icon: Shirt, type: 'fashion' },
  { label: 'Food', Icon: UtensilsCrossed, type: 'food' },
  { label: 'Beauty', Icon: Sparkles, type: 'beauty' },
  { label: 'Electronics', Icon: Smartphone, type: 'electronics' },
  { label: 'Digital', Icon: Download, type: 'digital' },
  { label: 'Services', Icon: Wrench, type: 'services' },
  { label: 'Creator', Icon: Palette, type: 'creator' },
  { label: 'More', Icon: LayoutGrid, type: '' },
];

export default function MarketplaceHome() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');

  const { data: publicSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: publicApi.getPublicSettings,
    staleTime: 1000 * 60 * 10,
  });

  const { data: marketplaceData, isLoading, refetch } = useQuery<any>({
    queryKey: ['marketplace'],
    queryFn: () => publicApi.getMarketplace(),
  });

  const { data: storesData, isLoading: storesLoading, refetch: refetchStores } = useQuery({
    queryKey: ['stores', activeCategory],
    queryFn: () => publicApi.getStores({ business_type: activeCategory || undefined }),
  });

  const featured: PublicStore[] = marketplaceData?.featured ?? [];
  const stores: PublicStore[] = storesData?.data ?? [];

  const hero = (() => {
    try { return publicSettings?.mobile_hero ? JSON.parse(publicSettings.mobile_hero) : {}; }
    catch { return {}; }
  })();
  const heroBadge: string = hero.badge || '10,000+ merchants';
  const heroTitle: string = hero.title || "Africa's Commerce\nPlatform";
  const heroSubtitle: string = hero.subtitle || 'Browse thousands of verified stores';
  const heroGradientStart: string = hero.gradient_start || (isDark ? '#022C22' : '#128C7E');
  const heroGradientEnd: string = hero.gradient_end || (isDark ? '#128C7E' : '#25D366');

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchStores()]);
    setRefreshing(false);
  };

  const goToStore = (username: string) => router.push(`/(public)/store/${username}` as any);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTagline, { color: theme.textSecondary }]}>Discover & Shop</Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>frontstore</Text>
          </View>
          <TouchableOpacity
            style={[styles.searchBtn, { backgroundColor: theme.card }, Shadow.sm as any]}
            onPress={() => router.push('/(public)/search')}
          >
            <Search size={20} color={theme.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Hero banner */}
        <TouchableOpacity activeOpacity={0.9} style={styles.heroBanner}>
          <LinearGradient
            colors={[heroGradientStart, heroGradientEnd]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Sparkles size={12} color={Colors.white} />
                <Text style={styles.heroBadgeText}>{heroBadge}</Text>
              </View>
              <Text style={styles.heroTitle}>{heroTitle}</Text>
              <Text style={styles.heroSub}>{heroSubtitle}</Text>
            </View>
            <View style={styles.heroShapes}>
              <View style={[styles.heroCircle, { backgroundColor: 'rgba(255,255,255,0.08)', width: 120, height: 120, borderRadius: 60, top: -20, right: -20 }]} />
              <View style={[styles.heroCircle, { backgroundColor: 'rgba(100,255,218,0.1)', width: 80, height: 80, borderRadius: 40, bottom: -10, right: 60 }]} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Browse by Category</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.type}
              onPress={() => setActiveCategory(cat.type)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: activeCategory === cat.type ? Colors.primary : theme.card,
                  borderColor: activeCategory === cat.type ? Colors.primary : theme.border,
                },
                Shadow.sm as any,
              ]}
            >
              <cat.Icon size={14} color={activeCategory === cat.type ? Colors.white : theme.textSecondary} strokeWidth={1.8} />
              <Text style={[styles.categoryLabel, { color: activeCategory === cat.type ? Colors.white : theme.text }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured stores */}
        {featured.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Featured Stores</Text>
              <TouchableOpacity onPress={() => router.push('/(public)/search')}>
                <Text style={[styles.seeAll, { color: Colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
              {featured.map((store) => (
                <StoreCard key={store.id} store={store} onPress={() => goToStore(store.username)} />
              ))}
            </ScrollView>
          </>
        )}

        {/* All / filtered stores */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {activeCategory ? `${CATEGORIES.find((c) => c.type === activeCategory)?.label} Stores` : 'All Stores'}
          </Text>
          <Text style={[styles.storeCount, { color: theme.textTertiary }]}>
            {stores.length} store{stores.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {storesLoading ? (
          [1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.skeletonRow, { backgroundColor: theme.card }]}>
              <Skeleton width={52} height={52} radius={12} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton height={14} width="60%" />
                <Skeleton height={10} width="40%" />
              </View>
            </View>
          ))
        ) : stores.length > 0 ? (
          stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              horizontal
              onPress={() => goToStore(store.username)}
            />
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
            <Store size={40} color={theme.textTertiary} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No stores found</Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              Try a different category or check back later.
            </Text>
          </View>
        )}

        {/* Merchant CTA */}
        <TouchableOpacity
          style={[styles.merchantCta, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.push('/(auth)/welcome')}
          activeOpacity={0.85}
        >
          <View style={[styles.merchantCtaIcon, { backgroundColor: Colors.primaryDim }]}>
            <Store size={20} color={Colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.merchantCtaText}>
            <Text style={[styles.merchantCtaTitle, { color: theme.text }]}>Sell on FrontStore</Text>
            <Text style={[styles.merchantCtaSub, { color: theme.textSecondary }]}>
              Set up your store in minutes — free
            </Text>
          </View>
          <ChevronRight size={18} color={theme.textTertiary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: Spacing[6], paddingBottom: 100 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingTop: Spacing[5], marginBottom: Spacing[5],
  },
  headerTagline: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], letterSpacing: -0.8 },
  searchBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  heroBanner: { borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing[6] },
  heroGradient: { padding: Spacing[6], minHeight: 140, position: 'relative', overflow: 'hidden' },
  heroContent: { gap: Spacing[2] },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1], paddingHorizontal: Spacing[3], paddingVertical: Spacing[1], borderRadius: Radius.full, alignSelf: 'flex-start', marginBottom: Spacing[1] },
  heroBadgeText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs, color: Colors.white },
  heroTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], color: Colors.white, letterSpacing: -0.8, lineHeight: 36 },
  heroSub: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)' },
  heroShapes: { ...StyleSheet.absoluteFillObject },
  heroCircle: { position: 'absolute' },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing[4],
  },
  sectionTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.lg },
  seeAll: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  storeCount: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm },

  categoryRow: { gap: Spacing[3], paddingBottom: Spacing[5] },
  categoryChip: {
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    borderRadius: Radius.full, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
  },

  categoryLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },

  featuredRow: { gap: Spacing[4], paddingBottom: Spacing[5] },

  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[4], borderRadius: Radius.lg, marginBottom: Spacing[3] },

  emptyState: { borderRadius: Radius.xl, padding: Spacing[8], alignItems: 'center', gap: Spacing[3] },
  emptyTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.lg },
  emptyDesc: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, textAlign: 'center' },

  merchantCta: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[4],
    padding: Spacing[5], borderRadius: Radius.xl, borderWidth: 1.5,
    marginTop: Spacing[6],
  },
  merchantCtaIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  merchantCtaText: { flex: 1 },
  merchantCtaTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.base },
  merchantCtaSub: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, marginTop: 2 },
});
