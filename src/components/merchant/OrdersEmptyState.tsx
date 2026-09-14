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
  Share2,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Search,
  X,
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

  // --- Default Clean Professional Orders Empty State ---
  return (
    <View style={styles.container}>
      {/* Clean Modern Icon */}
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: isDark ? 'rgba(15, 118, 110, 0.15)' : '#ECFDF5' },
        ]}
      >
        <ShoppingBag size={30} color="#0F766E" strokeWidth={2} />
      </View>

      {/* Headline & Subtitle */}
      <Text style={[styles.heroTitle, { color: theme.text }]}>
        No orders yet
      </Text>
      <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
        When customers place orders from your store link, they'll appear here with instant payment verification.
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[10],
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },

  // Titles
  heroTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 20,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  heroSubtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 300,
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
