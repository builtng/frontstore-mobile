import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import {
  ShoppingBag,
  Sparkles,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Search,
  X,
  TrendingUp,
  Package,
  ArrowRight,
  MessageCircle,
} from 'lucide-react-native';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { useToast } from '@/components/ui/Toast';

interface OrdersEmptyStateProps {
  storeUsername?: string;
  storeName?: string;
  search?: string;
  activeStatus?: string;
  onClearFilters?: () => void;
}

export const OrdersEmptyState: React.FC<OrdersEmptyStateProps> = ({
  storeUsername = 'store',
  storeName = 'Your Store',
  search = '',
  activeStatus = 'all',
  onClearFilters,
}) => {
  const { theme, isDark } = useTheme();
  const haptics = useHaptics();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const isFiltered = search.trim().length > 0 || activeStatus !== 'all';
  const storeUrl = `https://${storeUsername}.frontstore.ng`;

  const handleCopyLink = async () => {
    haptics.success();
    await Clipboard.setStringAsync(storeUrl);
    setCopied(true);
    toast.success('Store link copied to clipboard!');
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShareWhatsApp = async () => {
    haptics.selection();
    const msg = encodeURIComponent(
      `Hello! You can now browse our catalog and place orders directly on our online store: ${storeUrl}`
    );
    const waNativeUrl = `whatsapp://send?text=${msg}`;
    const waWebUrl = `https://wa.me/?text=${msg}`;

    try {
      const canOpen = await Linking.canOpenURL(waNativeUrl);
      if (canOpen) {
        await Linking.openURL(waNativeUrl);
      } else {
        await Linking.openURL(waWebUrl);
      }
    } catch {
      await Linking.openURL(waWebUrl);
    }
  };

  const handleNativeShare = async () => {
    haptics.selection();
    try {
      await Share.share({
        title: `${storeName} on Frontstore`,
        message: `Browse products and order from ${storeName}: ${storeUrl}`,
        url: storeUrl,
      });
    } catch {}
  };

  const handlePreviewStore = async () => {
    haptics.light();
    try {
      await Linking.openURL(storeUrl);
    } catch {}
  };

  // --- Filtered Search Empty State ---
  if (isFiltered) {
    return (
      <View style={styles.filteredContainer}>
        <View
          style={[
            styles.filteredIconWrap,
            { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
          ]}
        >
          <Search size={30} color={Colors.primaryLight} strokeWidth={2} />
        </View>
        <Text style={[styles.filteredTitle, { color: theme.text }]}>
          No matching orders
        </Text>
        <Text style={[styles.filteredSubtitle, { color: theme.textSecondary }]}>
          {search
            ? `No orders match "${search}". Try searching with a different order number or customer name.`
            : `There are currently no orders in the "${activeStatus}" category.`}
        </Text>
        {onClearFilters && (
          <TouchableOpacity
            style={[
              styles.clearBtn,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
            onPress={onClearFilters}
            activeOpacity={0.8}
          >
            <X size={15} color={theme.text} strokeWidth={2} />
            <Text style={[styles.clearBtnText, { color: theme.text }]}>
              Clear Search & Filters
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // --- Default Rich Commerce Launchpad Empty State ---
  return (
    <View style={styles.container}>
      {/* Background Soft Glow */}
      <View style={styles.glowOrb} />

      {/* Hero Visual Mockup: Realistic Order Preview with Depth */}
      <View style={styles.mockupWrapper}>
        <View
          style={[
            styles.mockupCard,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          {/* Card Top Row: Ref & Paid Badge */}
          <View style={styles.mockupTopRow}>
            <View style={styles.mockupRefGroup}>
              <View style={styles.mockupIconBadge}>
                <ShoppingBag size={14} color="#0F766E" strokeWidth={2.2} />
              </View>
              <Text style={[styles.mockupRefText, { color: theme.text }]}>
                #ORD-8421
              </Text>
            </View>
            <View style={styles.mockupStatusPill}>
              <View style={styles.mockupStatusDot} />
              <Text style={styles.mockupStatusText}>PAID</Text>
            </View>
          </View>

          {/* Card Middle: Customer & Items */}
          <View style={styles.mockupBody}>
            <View style={styles.mockupCustomerRow}>
              <Text style={[styles.mockupCustomerName, { color: theme.text }]}>
                Amara Okon
              </Text>
              <Text style={styles.mockupPrice}>₦ 34,500</Text>
            </View>
            <Text style={[styles.mockupItemDesc, { color: theme.textTertiary }]}>
              2 items • Standard Delivery (Lagos)
            </Text>
          </View>

          {/* Card Bottom: Milestone Progress Bar */}
          <View
            style={[
              styles.mockupFooterBar,
              { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
            ]}
          >
            <View style={styles.mockupStepIndicator}>
              <View style={[styles.stepDot, styles.stepDotActive]} />
              <View style={[styles.stepLine, styles.stepLineActive]} />
              <View style={[styles.stepDot, styles.stepDotActive]} />
              <View style={styles.stepLine} />
              <View style={styles.stepDot} />
            </View>
            <Text style={styles.mockupFooterStatus}>Confirmed & Escrow Held</Text>
          </View>
        </View>

        {/* Floating Sparkle Pill */}
        <View style={styles.floatingReadyBadge}>
          <Sparkles size={13} color="#059669" strokeWidth={2.5} />
          <Text style={styles.floatingReadyText}>Ready for orders</Text>
        </View>
      </View>

      {/* Headline & Value Proposition */}
      <Text style={[styles.heroTitle, { color: theme.text }]}>
        Start Receiving Orders
      </Text>
      <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
        Share your store link with customers. When orders are placed, they'll
        appear here with instant payment verification.
      </Text>

      {/* Live Storefront Quick Share Card */}
      <View
        style={[
          styles.shareCard,
          {
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderColor: isDark ? '#334155' : '#E2E8F0',
          },
        ]}
      >
        <View style={styles.shareCardHeader}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Your Store is Live</Text>
          </View>
          <TouchableOpacity
            onPress={handlePreviewStore}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.previewLink}
          >
            <Text style={styles.previewLinkText}>Visit</Text>
            <ExternalLink size={12} color="#0F766E" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* URL Pill & Copy Button */}
        <View
          style={[
            styles.urlContainer,
            { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
          ]}
        >
          <Globe size={14} color="#0F766E" strokeWidth={2} />
          <Text
            style={[styles.urlText, { color: theme.text }]}
            numberOfLines={1}
          >
            {storeUsername}.frontstore.ng
          </Text>
          <TouchableOpacity
            onPress={handleCopyLink}
            activeOpacity={0.7}
            style={[
              styles.copyBadgeBtn,
              copied && styles.copyBadgeBtnCopied,
            ]}
          >
            {copied ? (
              <>
                <Check size={12} color="#15803d" strokeWidth={2.5} />
                <Text style={styles.copyBadgeTextCopied}>Copied</Text>
              </>
            ) : (
              <>
                <Copy size={12} color="#475569" strokeWidth={2} />
                <Text style={styles.copyBadgeText}>Copy</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Primary Action Button: WhatsApp Share */}
        <TouchableOpacity
          style={styles.whatsAppBtn}
          onPress={handleShareWhatsApp}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#0F766E', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.whatsAppBtnGradient}
          >
            <WhatsAppIcon size={18} color="#FFFFFF" />
            <Text style={styles.whatsAppBtnText}>Share Store on WhatsApp</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Secondary Action: Native Share Sheet */}
        <TouchableOpacity
          style={[
            styles.secondaryShareBtn,
            { borderColor: isDark ? '#334155' : '#E2E8F0' },
          ]}
          onPress={handleNativeShare}
          activeOpacity={0.75}
        >
          <Share2 size={14} color={theme.text} strokeWidth={2} />
          <Text style={[styles.secondaryShareText, { color: theme.text }]}>
            Share via Other Apps
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pro Tips: 3-step Quick Commerce Guide */}
      <View
        style={[
          styles.tipsCard,
          {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#F8FAFC',
            borderColor: isDark ? '#334155' : '#E2E8F0',
          },
        ]}
      >
        <Text style={[styles.tipsTitle, { color: theme.text }]}>
          How to get your first sales today
        </Text>

        <View style={styles.tipRow}>
          <View style={styles.tipIconBadge}>
            <Text style={styles.tipEmoji}>📱</Text>
          </View>
          <View style={styles.tipContent}>
            <Text style={[styles.tipHeadline, { color: theme.text }]}>
              Post to WhatsApp Status
            </Text>
            <Text style={[styles.tipBody, { color: theme.textSecondary }]}>
              80% of Nigerian merchant sales come from WhatsApp contacts.
            </Text>
          </View>
        </View>

        <View style={styles.tipRow}>
          <View style={styles.tipIconBadge}>
            <Text style={styles.tipEmoji}>🛍️</Text>
          </View>
          <View style={styles.tipContent}>
            <Text style={[styles.tipHeadline, { color: theme.text }]}>
              Showcase 3+ Products
            </Text>
            <Text style={[styles.tipBody, { color: theme.textSecondary }]}>
              Add clear pictures, descriptions, and sizes to your catalog.
            </Text>
          </View>
        </View>

        <View style={styles.tipRow}>
          <View style={styles.tipIconBadge}>
            <Text style={styles.tipEmoji}>🛡️</Text>
          </View>
          <View style={styles.tipContent}>
            <Text style={[styles.tipHeadline, { color: theme.text }]}>
              Instant Buyer Protection
            </Text>
            <Text style={[styles.tipBody, { color: theme.textSecondary }]}>
              Customers buy with confidence via Bank Transfer and Card payments.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[10],
    position: 'relative',
  },
  glowOrb: {
    position: 'absolute',
    top: 20,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },

  // Mockup card styling
  mockupWrapper: {
    position: 'relative',
    marginBottom: Spacing[5],
    marginTop: Spacing[2],
  },
  mockupCard: {
    width: 260,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  mockupTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  mockupRefGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mockupIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockupRefText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13,
    letterSpacing: -0.2,
  },
  mockupStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  mockupStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  mockupStatusText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 10,
    color: '#15803D',
    letterSpacing: 0.5,
  },
  mockupBody: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  mockupCustomerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  mockupCustomerName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13.5,
  },
  mockupPrice: {
    fontFamily: FontFamily.headingBold,
    fontSize: 14,
    color: '#0F766E',
  },
  mockupItemDesc: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
  },
  mockupFooterBar: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mockupStepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  stepDotActive: {
    backgroundColor: '#0F766E',
  },
  stepLine: {
    width: 10,
    height: 2,
    backgroundColor: '#CBD5E1',
  },
  stepLineActive: {
    backgroundColor: '#0F766E',
  },
  mockupFooterStatus: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: '#0F766E',
  },
  floatingReadyBadge: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  floatingReadyText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10.5,
    color: '#047857',
  },

  // Titles
  heroTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  heroSubtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 310,
    marginBottom: Spacing[5],
  },

  // Storefront Share Card
  shareCard: {
    width: '100%',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing[4],
    marginBottom: Spacing[4],
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  shareCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: '#047857',
  },
  previewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  previewLinkText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: '#0F766E',
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    gap: 8,
    marginBottom: 12,
  },
  urlText: {
    flex: 1,
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12.5,
  },
  copyBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  copyBadgeBtnCopied: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  copyBadgeText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: '#475569',
  },
  copyBadgeTextCopied: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: '#15803D',
  },
  whatsAppBtn: {
    width: '100%',
    height: 48,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 10,
  },
  whatsAppBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  whatsAppBtnText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.base,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  secondaryShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  secondaryShareText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
  },

  // Tips Card
  tipsCard: {
    width: '100%',
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing[4],
    gap: 12,
  },
  tipsTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 13,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tipEmoji: {
    fontSize: 14,
  },
  tipContent: {
    flex: 1,
  },
  tipHeadline: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12.5,
  },
  tipBody: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 1,
  },

  // Filtered empty state
  filteredContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[10],
  },
  filteredIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
