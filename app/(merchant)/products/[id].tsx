import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { ArrowLeft, Edit2, Trash2, Eye, Share2 } from 'lucide-react-native';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { useToast } from '@/components/ui/Toast';
import { merchantApi } from '@/services/merchantApi';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const toast = useToast();
  const haptics = useHaptics();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => merchantApi.getProduct(Number(id)),
    select: (r) => r.data,
  });

  const { mutate: deleteProduct, isPending: isDeleting } = useMutation({
    mutationFn: () => merchantApi.deleteProduct(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted');
      haptics.success();
      router.back();
    },
    onError: () => toast.error('Failed to delete product'),
  });

  const { mutate: toggleStatus, isPending: isToggling } = useMutation({
    mutationFn: (status: 'active' | 'draft') => merchantApi.updateProduct(Number(id), { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const confirmDelete = () => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product?.name}"? This cannot be undone.`,
      [
        { text: 'Cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteProduct() },
      ]
    );
  };

  const images = product?.images ?? [];
  const primaryImage = images.find((i: any) => i.is_primary) ?? images[0];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.pad}>
          <Skeleton height={280} radius={0} style={{ marginHorizontal: -Spacing[6], marginBottom: Spacing[6] }} />
          <Skeleton height={24} width="70%" style={{ marginBottom: 12 }} />
          <Skeleton height={16} width="50%" style={{ marginBottom: 24 }} />
          <Skeleton height={60} radius={12} />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Floating header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.headerBtn, { backgroundColor: 'rgba(255,255,255,0.9)' }]} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.navy} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.headerBtn, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
            <Share2 size={18} color={Colors.navy} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerBtn, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
            <Eye size={18} color={Colors.navy} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <View style={styles.heroImage}>
          {primaryImage ? (
            <Image source={{ uri: primaryImage.url }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.primaryDim }]} />
          )}
          {/* Image thumbnails */}
          {images.length > 1 && (
            <View style={styles.thumbRow}>
              {images.slice(0, 5).map((img: any, i: number) => (
                <View key={i} style={[styles.thumb, i === 0 && styles.thumbActive]}>
                  <Image source={{ uri: img.url }} style={StyleSheet.absoluteFill} contentFit="cover" />
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Status & category */}
          <View style={styles.metaRow}>
            <Badge label={product.status} variant={product.status === 'active' ? 'success' : 'neutral'} dot />
            {product.category && (
              <Badge label={product.category.name} variant="neutral" size="sm" />
            )}
            <Badge label={product.type} variant="info" size="sm" />
          </View>

          {/* Name */}
          <Text style={[styles.name, { color: theme.text }]}>{product.name}</Text>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: Colors.primary }]}>{formatCurrency(product.price)}</Text>
            {product.compare_price && (
              <Text style={[styles.comparePrice, { color: theme.textTertiary }]}>
                {formatCurrency(product.compare_price)}
              </Text>
            )}
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, { backgroundColor: theme.card }, Shadow.sm as any]}>
            {[
              { label: 'In Stock', value: product.track_stock ? product.stock : '∞' },
              { label: 'Type', value: product.type },
              { label: 'Status', value: product.status },
            ].map((s, i) => (
              <View key={i} style={[styles.stat, i < 2 && { borderRightColor: theme.border, borderRightWidth: 1 }]}>
                <Text style={[styles.statVal, { color: theme.text }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: theme.textTertiary }]}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          {product.description && (
            <>
              <Text style={[styles.descTitle, { color: theme.text }]}>Description</Text>
              <Text style={[styles.desc, { color: theme.textSecondary }]}>{product.description}</Text>
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.actions, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <Button
          title={product.status === 'active' ? 'Unpublish' : 'Publish'}
          onPress={() => toggleStatus(product.status === 'active' ? 'draft' : 'active')}
          variant="secondary"
          isLoading={isToggling}
          size="md"
          style={styles.actionBtn}
        />
        <Button
          title="Edit"
          onPress={() => {}}
          size="md"
          icon={<Edit2 size={16} color={Colors.white} />}
          style={styles.actionBtn}
        />
        <Button
          title=""
          onPress={confirmDelete}
          variant="danger"
          isLoading={isDeleting}
          size="md"
          icon={<Trash2 size={18} color={Colors.white} />}
          fullWidth={false}
          style={styles.deleteBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  pad: { padding: Spacing[6] },
  header: { position: 'absolute', top: 56, left: Spacing[6], right: Spacing[6], flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', gap: Spacing[2] },
  heroImage: { height: 300, backgroundColor: Colors.gray100, position: 'relative' },
  thumbRow: { position: 'absolute', bottom: Spacing[4], left: Spacing[4], flexDirection: 'row', gap: Spacing[2] },
  thumb: { width: 44, height: 44, borderRadius: Radius.sm, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' },
  thumbActive: { borderColor: Colors.white, borderWidth: 2 },
  content: { padding: Spacing[6] },
  metaRow: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[4], flexWrap: 'wrap' },
  name: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], letterSpacing: -0.8, marginBottom: Spacing[3] },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing[3], marginBottom: Spacing[5] },
  price: { fontFamily: FontFamily.headingBold, fontSize: FontSize['4xl'], letterSpacing: -1 },
  comparePrice: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xl, textDecorationLine: 'line-through' },
  statsRow: { flexDirection: 'row', borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing[5] },
  stat: { flex: 1, alignItems: 'center', paddingVertical: Spacing[4] },
  statVal: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, textTransform: 'capitalize' },
  statLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, marginTop: 3 },
  descTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.lg, marginBottom: Spacing[3] },
  desc: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, lineHeight: 26 },
  actions: { flexDirection: 'row', padding: Spacing[4], gap: Spacing[3], borderTopWidth: 1 },
  actionBtn: { flex: 1 },
  deleteBtn: { width: 52, paddingHorizontal: 0 },
});
