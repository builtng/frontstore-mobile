import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { CheckCircle, Star, ShoppingBag } from 'lucide-react-native';
import { PublicStore } from '@/types/buyer';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

interface StoreCardProps {
  store: PublicStore;
  onPress: () => void;
  horizontal?: boolean;
}

const BUSINESS_EMOJI: Record<string, string> = {
  fashion: '👗',
  food: '🍜',
  beauty: '💅',
  electronics: '📱',
  digital: '💾',
  services: '🛠️',
  creator: '🎨',
  physical: '📦',
  'barber-shop': '💈',
  'home-services': '🏠',
  'auto-repair': '🔧',
  'cleaning-service': '🧹',
  'event-services': '🎉',
  other: '✨',
};

export const StoreCard: React.FC<StoreCardProps> = ({ store, onPress, horizontal = false }) => {
  const { theme } = useTheme();
  const emoji = BUSINESS_EMOJI[store.business_type ?? 'other'] ?? '🛍️';

  if (horizontal) {
    return (
      <TouchableOpacity
        style={[styles.horizontalCard, { backgroundColor: theme.card }, Shadow.sm as any]}
        onPress={onPress}
        activeOpacity={0.82}
      >
        <View style={styles.horizontalLogo}>
          {store.logo_url ? (
            <Image source={{ uri: store.logo_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.logoFallback, { backgroundColor: Colors.primaryDim }]}>
              <Text style={styles.logoEmoji}>{emoji}</Text>
            </View>
          )}
          {store.is_verified && (
            <View style={styles.verifiedBadge}>
              <CheckCircle size={12} color={Colors.white} fill={Colors.info} />
            </View>
          )}
        </View>
        <View style={styles.horizontalInfo}>
          <Text style={[styles.storeName, { color: theme.text }]} numberOfLines={1}>{store.name}</Text>
          {store.description && (
            <Text style={[styles.storeDesc, { color: theme.textSecondary }]} numberOfLines={1}>
              {store.description}
            </Text>
          )}
          <View style={styles.metaRow}>
            {store.rating !== undefined && (
              <View style={styles.ratingRow}>
                <Star size={11} color={Colors.amber} fill={Colors.amber} />
                <Text style={[styles.metaText, { color: theme.textSecondary }]}>{store.rating.toFixed(1)}</Text>
              </View>
            )}
            {store.product_count !== undefined && (
              <View style={styles.ratingRow}>
                <ShoppingBag size={11} color={theme.textTertiary} />
                <Text style={[styles.metaText, { color: theme.textTertiary }]}>{store.product_count} products</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card }, Shadow.md as any]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={styles.cardLogo}>
        {store.logo_url ? (
          <Image source={{ uri: store.logo_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.logoFallback, { backgroundColor: Colors.primaryDim }]}>
            <Text style={styles.logoEmojiLarge}>{emoji}</Text>
          </View>
        )}
        {store.is_verified && (
          <View style={[styles.verifiedBadge, styles.verifiedBadgeLarge]}>
            <CheckCircle size={14} color={Colors.white} fill={Colors.info} />
          </View>
        )}
      </View>
      <View style={styles.cardInfo}>
        <Text style={[styles.storeName, { color: theme.text }]} numberOfLines={1}>{store.name}</Text>
        {store.description && (
          <Text style={[styles.storeDesc, { color: theme.textSecondary }]} numberOfLines={2}>
            {store.description}
          </Text>
        )}
        <View style={styles.metaRow}>
          {store.rating !== undefined && (
            <View style={styles.ratingRow}>
              <Star size={11} color={Colors.amber} fill={Colors.amber} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>{store.rating.toFixed(1)}</Text>
            </View>
          )}
          {store.product_count !== undefined && (
            <Text style={[styles.metaText, { color: theme.textTertiary }]}>
              · {store.product_count} products
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Vertical card (grid)
  card: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    width: 160,
  },
  cardLogo: {
    height: 120,
    position: 'relative',
  },
  cardInfo: {
    padding: Spacing[3],
    gap: 3,
  },

  // Horizontal card (list)
  horizontalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing[4],
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  horizontalLogo: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  horizontalInfo: { flex: 1, gap: 3 },

  // Shared
  logoFallback: { alignItems: 'center', justifyContent: 'center' },
  logoEmoji: { fontSize: 24 },
  logoEmojiLarge: { fontSize: 40 },
  verifiedBadge: {
    position: 'absolute', bottom: 3, right: 3,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  verifiedBadgeLarge: { width: 20, height: 20, borderRadius: 10 },
  storeName: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.base },
  storeDesc: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, lineHeight: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },
});
