import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { ArrowLeft, ShoppingCart, Plus, Minus, Check, Share2 } from 'lucide-react-native';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { useToast } from '@/components/ui/Toast';
import { publicApi } from '@/services/publicApi';
import { PublicProduct } from '@/types/buyer';
import { useCartStore } from '@/stores/cartStore';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

const { width } = Dimensions.get('window');

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

export default function ProductDetailScreen() {
  const { username, slug } = useLocalSearchParams<{ username: string; slug: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const toast = useToast();
  const haptics = useHaptics();
  const { addItem, items } = useCartStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [added, setAdded] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['public-product', username, slug],
    queryFn: () => publicApi.getProduct(username, slug),
    select: (r) => r.data as PublicProduct,
    enabled: !!username && !!slug,
  });

  const cartItem = items.find((i) => i.productId === product?.id);
  const inCart = !!cartItem;

  const handleAddToCart = () => {
    if (!product) return;
    haptics.success();
    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        storeUsername: username,
        storeName: product.store?.name ?? '',
        storeLogo: product.store?.logo_url,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.images?.[selectedImageIndex]?.url,
        price: product.price,
        type: product.type,
      });
    }
    setAdded(true);
    toast.success(`${product.name} added to cart`);
    setTimeout(() => setAdded(false), 2500);
  };

  const images = product?.images ?? [];
  const isOutOfStock = product?.track_stock && (product.stock ?? 0) === 0;
  const discount = product?.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : null;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.loadingPad}>
          <Skeleton height={320} radius={0} style={{ marginHorizontal: -Spacing[6], marginBottom: Spacing[6] }} />
          <Skeleton height={28} width="70%" style={{ marginBottom: 10 }} />
          <Skeleton height={20} width="40%" style={{ marginBottom: Spacing[5] }} />
          <Skeleton height={100} radius={14} />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Floating header */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity style={styles.floatingBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.navy} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.floatingBtn} onPress={() => router.push(`/(public)/cart`)}>
          <ShoppingCart size={18} color={Colors.navy} />
          {inCart && <View style={styles.cartDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Main image */}
        <View style={styles.mainImage}>
          {images[selectedImageIndex] ? (
            <Image source={{ uri: images[selectedImageIndex].url }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.primaryDim, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 60 }}>📦</Text>
            </View>
          )}
          {discount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}
        </View>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
            {images.map((img, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setSelectedImageIndex(i)}
                style={[styles.thumb, i === selectedImageIndex && { borderColor: Colors.primary, borderWidth: 2.5 }]}
              >
                <Image source={{ uri: img.url }} style={StyleSheet.absoluteFill} contentFit="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.content}>
          {/* Category & type */}
          <View style={styles.metaRow}>
            {product.category && <Badge label={product.category.name} variant="neutral" size="sm" />}
            <Badge label={product.type} variant="info" size="sm" />
            {isOutOfStock && <Badge label="Out of Stock" variant="danger" size="sm" />}
          </View>

          {/* Name */}
          <Text style={[styles.productName, { color: theme.text }]}>{product.name}</Text>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: Colors.primary }]}>{formatCurrency(product.price)}</Text>
            {product.compare_price && (
              <Text style={[styles.comparePrice, { color: theme.textTertiary }]}>{formatCurrency(product.compare_price)}</Text>
            )}
          </View>

          {/* Store info */}
          <TouchableOpacity
            style={[styles.storeRow, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push(`/(public)/store/${username}` as any)}
          >
            {product.store?.logo_url ? (
              <Image source={{ uri: product.store.logo_url }} style={styles.storeLogo} contentFit="cover" />
            ) : (
              <View style={[styles.storeLogo, { backgroundColor: Colors.primaryDim, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 14 }}>🏪</Text>
              </View>
            )}
            <View style={styles.storeInfo}>
              <Text style={[styles.storeLabel, { color: theme.textTertiary }]}>Sold by</Text>
              <Text style={[styles.storeName, { color: Colors.primary }]}>{product.store?.name ?? username}</Text>
            </View>
            <Text style={[styles.viewStore, { color: Colors.primary }]}>View Store →</Text>
          </TouchableOpacity>

          {/* Description */}
          {product.description && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Description</Text>
              <Text style={[styles.description, { color: theme.textSecondary }]}>{product.description}</Text>
            </>
          )}

          {/* Stock info */}
          {product.track_stock && !isOutOfStock && (product.stock ?? 0) <= 10 && (
            <View style={[styles.stockWarning, { backgroundColor: Colors.warningLight }]}>
              <Text style={styles.stockWarningText}>⚠️ Only {product.stock} left in stock</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        {/* Quantity selector */}
        <View style={[styles.qtySelector, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity onPress={() => setQuantity((q) => Math.max(1, q - 1))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Minus size={16} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.qty, { color: theme.text }]}>{quantity}</Text>
          <TouchableOpacity onPress={() => setQuantity((q) => Math.min((product.stock ?? 99), q + 1))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Plus size={16} color={theme.text} />
          </TouchableOpacity>
        </View>

        <Button
          title={added ? '✓ Added to Cart' : `Add to Cart — ${formatCurrency(product.price * quantity)}`}
          onPress={handleAddToCart}
          disabled={isOutOfStock || added}
          size="lg"
          style={[styles.addBtn, added && { backgroundColor: Colors.success }]}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingPad: { padding: Spacing[6] },
  floatingHeader: { position: 'absolute', top: 56, left: Spacing[6], right: Spacing[6], flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  floatingBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cartDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger, borderWidth: 1, borderColor: Colors.white },

  mainImage: { height: 320, backgroundColor: Colors.gray100 },
  discountBadge: { position: 'absolute', top: Spacing[4], left: Spacing[4], backgroundColor: Colors.danger, borderRadius: Radius.sm, paddingHorizontal: Spacing[3], paddingVertical: Spacing[1] },
  discountText: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xs, color: Colors.white },

  thumbRow: { paddingHorizontal: Spacing[6], paddingVertical: Spacing[3], gap: Spacing[2] },
  thumb: { width: 60, height: 60, borderRadius: Radius.sm, overflow: 'hidden', borderWidth: 1, borderColor: 'transparent' },

  content: { paddingHorizontal: Spacing[6], paddingBottom: Spacing[4] },
  metaRow: { flexDirection: 'row', gap: Spacing[2], flexWrap: 'wrap', marginTop: Spacing[4], marginBottom: Spacing[3] },
  productName: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], letterSpacing: -0.8, marginBottom: Spacing[3] },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing[3], marginBottom: Spacing[5] },
  price: { fontFamily: FontFamily.headingBold, fontSize: FontSize['4xl'], letterSpacing: -1 },
  comparePrice: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xl, textDecorationLine: 'line-through' },

  storeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[4], borderRadius: Radius.lg, borderWidth: 1.5, marginBottom: Spacing[5] },
  storeLogo: { width: 36, height: 36, borderRadius: Radius.sm, overflow: 'hidden' },
  storeInfo: { flex: 1 },
  storeLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },
  storeName: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.sm },
  viewStore: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs },

  sectionTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.lg, marginBottom: Spacing[3] },
  description: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, lineHeight: 26 },

  stockWarning: { borderRadius: Radius.md, padding: Spacing[3], marginTop: Spacing[4] },
  stockWarningText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: '#D97706' },

  footer: { flexDirection: 'row', padding: Spacing[4], gap: Spacing[3], borderTopWidth: 1 },
  qtySelector: { flexDirection: 'row', alignItems: 'center', gap: Spacing[4], paddingHorizontal: Spacing[4], borderRadius: Radius.lg, borderWidth: 1.5 },
  qty: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, minWidth: 24, textAlign: 'center' },
  addBtn: { flex: 1 },
});
