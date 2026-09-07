import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MoreHorizontal } from 'lucide-react-native';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { Product } from '@/types/merchant';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onMorePress?: () => void;
  viewMode?: 'grid' | 'list';
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onMorePress,
  viewMode = 'list',
}) => {
  const { theme } = useTheme();
  const primaryImage = product.images?.find((i) => i.is_primary) ?? product.images?.[0];
  const isLowStock = product.track_stock && product.stock <= 5;
  const isOutOfStock = product.track_stock && product.stock === 0;

  if (viewMode === 'grid') {
    return (
      <TouchableOpacity
        style={[styles.gridCard, { backgroundColor: theme.card, borderColor: theme.border }, Shadow.sm]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <View style={styles.gridImage}>
          {primaryImage ? (
            <Image
              source={{ uri: primaryImage.url }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.imagePlaceholder, { backgroundColor: Colors.glow.primarySoft, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 24 }}>📦</Text>
            </View>
          )}
          <View style={styles.gridBadgeRow}>
            <Badge
              label={product.status}
              variant={product.status === 'active' ? 'success' : 'neutral'}
              size="sm"
            />
          </View>
        </View>
        <View style={styles.gridInfo}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={[styles.price, { color: Colors.primaryLight }]}>
            {formatCurrency(product.price)}
          </Text>
          {product.track_stock && (
            <View style={styles.stockRow}>
              <View
                style={[
                  styles.stockDot,
                  { backgroundColor: isOutOfStock ? Colors.danger : isLowStock ? Colors.warning : Colors.success },
                ]}
              />
              <Text
                style={[
                  styles.stock,
                  { color: isOutOfStock ? Colors.danger : isLowStock ? '#D97706' : theme.textTertiary },
                ]}
              >
                {isOutOfStock ? 'Out of stock' : `${product.stock} in stock`}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border }, Shadow.sm]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.listImage}>
        {primaryImage ? (
          <Image
            source={{ uri: primaryImage.url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.glow.primarySoft, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 22 }}>📦</Text>
          </View>
        )}
      </View>

      <View style={styles.listInfo}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {product.name}
        </Text>
        {product.category && (
          <Text style={[styles.category, { color: theme.textTertiary }]}>
            {product.category.name}
          </Text>
        )}
        <View style={styles.listBottom}>
          <Text style={[styles.price, { color: Colors.primaryLight }]}>
            {formatCurrency(product.price)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
            {product.track_stock && (
              <View style={styles.stockRow}>
                <View
                  style={[
                    styles.stockDot,
                    { backgroundColor: isOutOfStock ? Colors.danger : isLowStock ? Colors.warning : Colors.success },
                  ]}
                />
                <Text
                  style={[
                    styles.stock,
                    { color: isOutOfStock ? Colors.danger : isLowStock ? '#D97706' : theme.textTertiary },
                  ]}
                >
                  {isOutOfStock ? 'Out' : `${product.stock}`}
                </Text>
              </View>
            )}
            <Badge
              label={product.status}
              variant={product.status === 'active' ? 'success' : 'neutral'}
              size="sm"
            />
          </View>
        </View>
      </View>

      {onMorePress && (
        <TouchableOpacity
          onPress={onMorePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MoreHorizontal size={18} color={theme.textTertiary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Grid
  gridCard: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    flex: 1,
    marginHorizontal: Spacing[2],
    marginBottom: Spacing[4],
    borderWidth: 1,
  },
  gridImage: {
    height: 140,
    position: 'relative',
  },
  imagePlaceholder: {},
  gridBadgeRow: {
    position: 'absolute',
    top: Spacing[2],
    left: Spacing[2],
  },
  gridInfo: {
    padding: Spacing[3],
  },

  // List
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing[3],
    gap: Spacing[3],
    marginBottom: Spacing[3],
    borderWidth: 1,
  },
  listImage: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.dark.surface,
  },
  listInfo: {
    flex: 1,
    gap: 3,
  },
  listBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing[1],
  },

  // Shared
  name: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
  },
  category: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
  },
  price: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.md,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stock: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
  },
});
