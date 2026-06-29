import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Dimensions, Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import {
  ArrowLeft, Share2, Star, CheckCircle, MessageCircle,
  ShoppingBag, MapPin, Clock,
} from 'lucide-react-native';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { publicApi } from '@/services/publicApi';
import { PublicProduct, PublicStore } from '@/types/buyer';
import { useCartStore } from '@/stores/cartStore';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { useToast } from '@/components/ui/Toast';

const { width } = Dimensions.get('window');

const formatCurrency = (n: number, currency = 'NGN') =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

function ProductCard({ product, storeUsername, onPress }: { product: PublicProduct; storeUsername: string; onPress: () => void }) {
  const { theme } = useTheme();
  const { addItem } = useCartStore();
  const toast = useToast();
  const haptics = useHaptics();
  const primaryImage = product.images?.find((i) => i.is_primary) ?? product.images?.[0];

  const handleAddToCart = () => {
    haptics.success();
    addItem({
      productId: product.id,
      storeUsername,
      storeName: product.store?.name ?? '',
      storeLogo: product.store?.logo_url,
      productName: product.name,
      productSlug: product.slug,
      productImage: primaryImage?.url,
      price: product.price,
      type: product.type,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: theme.card }, Shadow.sm as any]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.productImage}>
        {primaryImage ? (
          <Image source={{ uri: primaryImage.url }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.primaryDim, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 28 }}>📦</Text>
          </View>
        )}
        {product.compare_price && (
          <View style={styles.saleBadge}>
            <Text style={styles.saleBadgeText}>SALE</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.productPrice, { color: Colors.primary }]}>{formatCurrency(product.price)}</Text>
          {product.compare_price && (
            <Text style={[styles.comparePrice, { color: theme.textTertiary }]}>{formatCurrency(product.compare_price)}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: Colors.primaryDim }]}
          onPress={handleAddToCart}
        >
          <Text style={[styles.addBtnText, { color: Colors.primary }]}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function StoreScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'products' | 'about' | 'reviews'>('products');

  const { data: storeData, isLoading } = useQuery({
    queryKey: ['public-store', username],
    queryFn: () => publicApi.getStore(username),
    select: (r) => r.data,
    enabled: !!username,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['store-reviews', username],
    queryFn: () => publicApi.getStoreReviews(username),
    select: (r) => r.data ?? [],
    enabled: !!username && activeTab === 'reviews',
  });

  const store: PublicStore | undefined = storeData?.store;
  const products: PublicProduct[] = storeData?.products?.data ?? [];

  const handleShare = async () => {
    await Share.share({ message: `Shop at ${store?.name} on FrontStore!\nhttps://frontstore.app/${username}` });
  };

  const handleWhatsApp = () => {
    if (store?.whatsapp_number) {
      const phone = store.whatsapp_number.replace(/\D/g, '');
      // Could use Linking.openURL(`whatsapp://send?phone=${phone}`)
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.loadingHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.pad}>
          <Skeleton height={200} radius={0} style={{ marginHorizontal: -Spacing[6], marginBottom: Spacing[5] }} />
          <Skeleton height={56} radius={28} width={56} style={{ marginBottom: Spacing[4] }} />
          <Skeleton height={24} width="60%" style={{ marginBottom: 8 }} />
          <Skeleton height={14} width="80%" style={{ marginBottom: Spacing[5] }} />
          <Skeleton height={180} radius={16} />
        </View>
      </SafeAreaView>
    );
  }

  if (!store) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Floating back button */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity style={[styles.floatingBtn, { backgroundColor: 'rgba(255,255,255,0.92)' }]} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.navy} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.floatingBtn, { backgroundColor: 'rgba(255,255,255,0.92)' }]} onPress={handleShare}>
          <Share2 size={18} color={Colors.navy} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.banner}>
          {store.banner_url ? (
            <Image source={{ uri: store.banner_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? Colors.navyLight : Colors.primaryDim }]} />
          )}
        </View>

        <View style={styles.content}>
          {/* Store header */}
          <View style={styles.storeHeader}>
            <View style={styles.logoWrapper}>
              {store.logo_url ? (
                <Image source={{ uri: store.logo_url }} style={styles.logo} contentFit="cover" />
              ) : (
                <View style={[styles.logo, { backgroundColor: Colors.primaryDim, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 28 }}>🏪</Text>
                </View>
              )}
              {store.is_verified && (
                <View style={styles.verifiedBadge}>
                  <CheckCircle size={16} color={Colors.white} fill={Colors.info} />
                </View>
              )}
            </View>

            <View style={styles.storeInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.storeName, { color: theme.text }]}>{store.name}</Text>
              </View>
              <Text style={[styles.storeUsername, { color: theme.textTertiary }]}>@{store.username}</Text>
              {store.rating !== undefined && (
                <View style={styles.ratingRow}>
                  <Star size={13} color={Colors.amber} fill={Colors.amber} />
                  <Text style={[styles.ratingText, { color: theme.textSecondary }]}>
                    {store.rating.toFixed(1)} · {store.review_count ?? 0} reviews
                  </Text>
                </View>
              )}
            </View>
          </View>

          {store.description && (
            <Text style={[styles.description, { color: theme.textSecondary }]}>{store.description}</Text>
          )}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <Button
              title="Shop Now"
              onPress={() => setActiveTab('products')}
              size="md"
              icon={<ShoppingBag size={16} color={Colors.white} />}
              style={styles.shopBtn}
            />
            {store.whatsapp_number && (
              <TouchableOpacity
                style={[styles.waBtn, { backgroundColor: '#25D366' }]}
                onPress={handleWhatsApp}
              >
                <MessageCircle size={18} color={Colors.white} />
                <Text style={styles.waBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tabs */}
          <View style={[styles.tabs, { borderBottomColor: theme.border }]}>
            {(['products', 'about', 'reviews'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, activeTab === tab && { borderBottomColor: Colors.primary, borderBottomWidth: 2 }]}
              >
                <Text style={[styles.tabText, { color: activeTab === tab ? Colors.primary : theme.textTertiary }, activeTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'products' && products.length > 0 ? ` (${products.length})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab content */}
          {activeTab === 'products' && (
            products.length > 0 ? (
              <View style={styles.productsGrid}>
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    storeUsername={username}
                    onPress={() => router.push(`/(public)/store/${username}/${product.slug}` as any)}
                  />
                ))}
              </View>
            ) : (
              <EmptyState type="products" title="No products yet" description="This store hasn't added any products yet. Check back soon!" />
            )
          )}

          {activeTab === 'about' && (
            <View style={styles.aboutSection}>
              {store.description && (
                <View style={[styles.aboutCard, { backgroundColor: theme.card }]}>
                  <Text style={[styles.aboutLabel, { color: theme.textTertiary }]}>About</Text>
                  <Text style={[styles.aboutText, { color: theme.text }]}>{store.description}</Text>
                </View>
              )}
              <View style={[styles.aboutCard, { backgroundColor: theme.card }]}>
                <Text style={[styles.aboutLabel, { color: theme.textTertiary }]}>Store URL</Text>
                <Text style={[styles.aboutText, { color: Colors.primary }]}>frontstore.app/{store.username}</Text>
              </View>
            </View>
          )}

          {activeTab === 'reviews' && (
            <View style={styles.reviewsSection}>
              {(reviewsData ?? []).length > 0 ? (
                (reviewsData as any[]).map((review: any) => (
                  <View key={review.id} style={[styles.reviewCard, { backgroundColor: theme.card }]}>
                    <View style={styles.reviewHeader}>
                      <Text style={[styles.reviewCustomer, { color: theme.text }]}>{review.customer_name}</Text>
                      <View style={styles.reviewStars}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={12} color={i < review.rating ? Colors.amber : theme.border} fill={i < review.rating ? Colors.amber : 'none'} />
                        ))}
                      </View>
                    </View>
                    {review.comment && (
                      <Text style={[styles.reviewComment, { color: theme.textSecondary }]}>{review.comment}</Text>
                    )}
                  </View>
                ))
              ) : (
                <EmptyState type="reviews" />
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingHeader: { paddingHorizontal: Spacing[6], paddingTop: Spacing[5] },
  pad: { paddingHorizontal: Spacing[6] },
  floatingHeader: { position: 'absolute', top: 56, left: Spacing[6], right: Spacing[6], flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  floatingBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  banner: { height: 180, backgroundColor: Colors.gray100 },

  content: { paddingHorizontal: Spacing[6] },

  storeHeader: { flexDirection: 'row', gap: Spacing[4], marginTop: -28, marginBottom: Spacing[4] },
  logoWrapper: { position: 'relative' },
  logo: { width: 72, height: 72, borderRadius: Radius.xl, borderWidth: 3, borderColor: Colors.white },
  verifiedBadge: { position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  storeInfo: { flex: 1, paddingTop: Spacing[5], gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  storeName: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, letterSpacing: -0.3 },
  storeUsername: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1] },
  ratingText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs },

  description: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, lineHeight: 24, marginBottom: Spacing[5] },

  actionRow: { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[5] },
  shopBtn: { flex: 1 },
  waBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], borderRadius: Radius.lg },
  waBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.white },

  tabs: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: Spacing[5] },
  tab: { flex: 1, paddingVertical: Spacing[3], alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  tabTextActive: { color: Colors.primary },

  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[4] },
  productCard: { width: (width - Spacing[6] * 2 - Spacing[4]) / 2, borderRadius: Radius.lg, overflow: 'hidden' },
  productImage: { height: 140, position: 'relative' },
  saleBadge: { position: 'absolute', top: Spacing[2], left: Spacing[2], backgroundColor: Colors.danger, borderRadius: Radius.sm, paddingHorizontal: Spacing[2], paddingVertical: 2 },
  saleBadgeText: { fontFamily: FontFamily.headingBold, fontSize: 9, color: Colors.white },
  productInfo: { padding: Spacing[3], gap: Spacing[2] },
  productName: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, lineHeight: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing[2] },
  productPrice: { fontFamily: FontFamily.headingBold, fontSize: FontSize.base },
  comparePrice: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, textDecorationLine: 'line-through' },
  addBtn: { paddingVertical: Spacing[2], borderRadius: Radius.sm, alignItems: 'center' },
  addBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs },

  aboutSection: { gap: Spacing[3], paddingBottom: Spacing[8] },
  aboutCard: { borderRadius: Radius.lg, padding: Spacing[4], gap: Spacing[2] },
  aboutLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.8 },
  aboutText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, lineHeight: 24 },

  reviewsSection: { gap: Spacing[3], paddingBottom: Spacing[8] },
  reviewCard: { borderRadius: Radius.lg, padding: Spacing[4], gap: Spacing[2] },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewCustomer: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, lineHeight: 20 },
});
