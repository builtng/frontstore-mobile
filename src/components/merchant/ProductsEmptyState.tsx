import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  Sparkles,
  Search,
  Camera,
  QrCode,
  MessageCircle,
  X,
  Package,
} from 'lucide-react-native';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';

interface ProductsEmptyStateProps {
  onAddProduct: () => void;
  search?: string;
  activeStatus?: string;
  onClearFilters?: () => void;
}

export const ProductsEmptyState: React.FC<ProductsEmptyStateProps> = ({
  onAddProduct,
  search = '',
  activeStatus = 'all',
  onClearFilters,
}) => {
  const { theme, isDark } = useTheme();
  const isFiltered = search.trim().length > 0 || activeStatus !== 'all';

  if (isFiltered) {
    return (
      <View style={styles.filteredContainer}>
        <View style={[styles.filteredIconWrap, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
          <Search size={32} color={Colors.primaryLight} strokeWidth={2} />
        </View>
        <Text style={[styles.filteredTitle, { color: theme.text }]}>No products found</Text>
        <Text style={[styles.filteredSubtitle, { color: theme.textSecondary }]}>
          {search
            ? `No results match "${search}". Check for typos or search for a different term.`
            : `There are currently no products under the "${activeStatus}" filter.`}
        </Text>
        {onClearFilters && (
          <TouchableOpacity
            style={[styles.clearBtn, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}
            onPress={onClearFilters}
            activeOpacity={0.8}
          >
            <X size={15} color={theme.text} strokeWidth={2} />
            <Text style={[styles.clearBtnText, { color: theme.text }]}>Reset Filters & Search</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Ambient Glow */}
      <View style={styles.glowOrb} />

      {/* Modern Product Mockup Preview Card */}
      <View style={styles.mockupWrapper}>
        <View style={[styles.mockupCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
          {/* Mock image area */}
          <LinearGradient
            colors={isDark ? ['#334155', '#1E293B'] : ['#F8FAFC', '#EEF2F6']}
            style={styles.mockupImage}
          >
            <View style={styles.mockupIconCircle}>
              <Package size={22} color={Colors.primaryLight} strokeWidth={1.8} />
            </View>
            <View style={styles.mockupBadge}>
              <View style={styles.mockupBadgeDot} />
              <Text style={styles.mockupBadgeText}>Active</Text>
            </View>
          </LinearGradient>

          {/* Mock content */}
          <View style={styles.mockupContent}>
            <View style={styles.mockupTitleRow}>
              <View style={[styles.mockupBarWide, { backgroundColor: isDark ? '#475569' : '#E2E8F0' }]} />
              <View style={[styles.mockupBarShort, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]} />
            </View>
            <View style={styles.mockupFooter}>
              <View style={styles.mockupPricePill}>
                <Text style={styles.mockupPriceText}>₦ 18,500</Text>
              </View>
              <View style={[styles.mockupStockPill, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                <Text style={[styles.mockupStockText, { color: theme.textTertiary }]}>12 in stock</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Floating Sparkle Badge */}
        <View style={styles.floatingSparkleBadge}>
          <Sparkles size={13} color="#059669" strokeWidth={2.5} />
          <Text style={styles.floatingSparkleText}>Ready to sell</Text>
        </View>
      </View>

      {/* Copy */}
      <Text style={[styles.heroTitle, { color: theme.text }]}>Start Your Catalog</Text>
      <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
        Add items with photos, prices, and descriptions. They will be immediately live on your store link.
      </Text>

      {/* Quick Value Points */}
      <View style={styles.valueRow}>
        <View style={[styles.valueItem, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#F1F5F9' }]}>
          <Camera size={15} color={Colors.primaryLight} strokeWidth={2} />
          <Text style={[styles.valueItemText, { color: theme.text }]}>Photos & Variants</Text>
        </View>
        <View style={[styles.valueItem, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#F1F5F9' }]}>
          <QrCode size={15} color={Colors.primaryLight} strokeWidth={2} />
          <Text style={[styles.valueItemText, { color: theme.text }]}>Instant QR Link</Text>
        </View>
        <View style={[styles.valueItem, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#F1F5F9' }]}>
          <MessageCircle size={15} color={Colors.primaryLight} strokeWidth={2} />
          <Text style={[styles.valueItemText, { color: theme.text }]}>WhatsApp Orders</Text>
        </View>
      </View>

      {/* Primary CTA Button */}
      <TouchableOpacity
        style={styles.primaryCta}
        onPress={onAddProduct}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#0F766E', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.ctaText}>Add First Product</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[10],
    position: 'relative',
  },
  glowOrb: {
    position: 'absolute',
    top: 20,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  mockupWrapper: {
    position: 'relative',
    marginBottom: Spacing[6],
    marginTop: Spacing[2],
  },
  mockupCard: {
    width: 200,
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  mockupImage: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mockupIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  mockupBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  mockupBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  mockupBadgeText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: '#0F766E',
  },
  mockupContent: {
    padding: Spacing[3],
    gap: Spacing[2],
  },
  mockupTitleRow: {
    gap: 4,
  },
  mockupBarWide: {
    height: 8,
    width: '75%',
    borderRadius: 4,
  },
  mockupBarShort: {
    height: 6,
    width: '45%',
    borderRadius: 3,
  },
  mockupFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  mockupPricePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  mockupPriceText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    color: '#0F766E',
  },
  mockupStockPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  mockupStockText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 10,
  },
  floatingSparkleBadge: {
    position: 'absolute',
    bottom: -8,
    right: -10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.full,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  floatingSparkleText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10.5,
    color: '#047857',
  },
  heroTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  heroSubtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 290,
    marginBottom: Spacing[5],
  },
  valueRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginBottom: Spacing[6],
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing[3],
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  valueItemText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
  },
  primaryCta: {
    width: '100%',
    maxWidth: 240,
    height: 48,
    borderRadius: Radius.full,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.base,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  // Filtered/Search empty state
  filteredContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[10],
  },
  filteredIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },
  filteredTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.lg,
    marginBottom: Spacing[2],
  },
  filteredSubtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: Spacing[5],
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing[4],
    paddingVertical: 9,
    borderRadius: Radius.full,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  clearBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
  },
});
