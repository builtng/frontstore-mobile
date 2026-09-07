import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Wallet,
  Settings,
  LogOut,
  Star,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Shield,
  Bell,
  Globe,
  Users,
  BarChart2,
  Tag,
  MessageCircle,
  QrCode,
  Copy,
  Check,
  Share2,
  Edit3,
  Store,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/services/authApi';
import { merchantApi } from '@/services/merchantApi';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import * as Clipboard from 'expo-clipboard';

interface MenuItem {
  label: string;
  subtitle?: string;
  Icon: any;
  route?: string;
  color: string;
  bgColor?: string;
  badge?: string;
  action?: () => void;
  danger?: boolean;
}

export default function MoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const haptics = useHaptics();
  const { user, updateUser, logout } = useAuthStore();
  const [copied, setCopied] = useState(false);

  // Fetch real user & store data
  const { data: meRes } = useQuery({
    queryKey: ['auth-me'],
    queryFn: authApi.me,
    staleTime: 1000 * 60 * 2,
  });

  const { data: storeRes } = useQuery({
    queryKey: ['merchant-store'],
    queryFn: merchantApi.getStore,
    staleTime: 1000 * 60 * 2,
  });

  // Sync auth store with live backend user
  useEffect(() => {
    if (meRes?.data?.user) {
      updateUser({
        ...meRes.data.user,
        store: meRes.data.store ?? meRes.data.user.store ?? user?.store,
      });
    }
  }, [meRes]);

  const liveUser = meRes?.data?.user || user;
  const store = storeRes?.data || liveUser?.store || user?.store;
  const displayName = store?.name || liveUser?.name || 'My Store';
  const displayEmail = liveUser?.email || liveUser?.phone || liveUser?.phone_number || '';
  const displayUsername = store?.username || user?.store?.username || '';
  const logoUrl = store?.logo_url || user?.store?.logo_url;
  const storeUrl = displayUsername ? `https://${displayUsername}.frontstore.ng` : 'https://frontstore.ng';

  const isPro = !!(
    liveUser?.is_pro ||
    liveUser?.is_legend ||
    liveUser?.plan?.includes('pro') ||
    liveUser?.plan?.includes('legend')
  );

  const getPlanBadge = (planKey?: string) => {
    const p = (planKey ?? '').toLowerCase();
    if (p.includes('legend') || p.includes('business')) {
      return {
        label: 'Business Tier',
        color: '#0F766E',
        bg: '#ECFDF5',
        border: 'rgba(15, 118, 110, 0.2)',
      };
    }
    if (p.includes('pro')) {
      return {
        label: 'Pro Tier',
        color: '#0F766E',
        bg: '#ECFDF5',
        border: 'rgba(15, 118, 110, 0.2)',
      };
    }
    return {
      label: 'Free Plan',
      color: '#475569',
      bg: '#F1F5F9',
      border: '#E2E8F0',
    };
  };

  const plan = getPlanBadge(liveUser?.plan);

  const handleCopyLink = async () => {
    haptics.success();
    await Clipboard.setStringAsync(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShareStore = async () => {
    haptics.selection();
    if (Platform.OS === 'web') {
      await handleCopyLink();
    } else {
      try {
        const { Share } = await import('react-native');
        await Share.share({
          title: displayName,
          message: `Visit ${displayName} on FrontStore: ${storeUrl}`,
          url: storeUrl,
        });
      } catch {
        await handleCopyLink();
      }
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your merchant account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try { await authApi.logout(); } catch {}
          await logout();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  const sections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'BUSINESS & SALES',
      items: [
        {
          label: 'Customers CRM',
          subtitle: 'Manage client list & insights',
          Icon: Users,
          route: '/(merchant)/more/customers',
          color: '#2563EB',
          bgColor: '#EFF6FF',
        },
        {
          label: 'Analytics & Revenue',
          subtitle: 'Orders, sales & performance',
          Icon: BarChart2,
          route: '/(merchant)/more/analytics',
          color: '#10B981',
          bgColor: '#ECFDF5',
        },
        {
          label: 'Wallet & Payouts',
          subtitle: 'Balances & direct bank transfers',
          Icon: Wallet,
          route: '/(merchant)/more/wallet',
          color: '#0891B2',
          bgColor: '#ECFEFF',
        },
        {
          label: 'Refer & Earn',
          subtitle: 'Earn up to ₦1,000 per merchant',
          Icon: Sparkles,
          route: '/(merchant)/more/referrals',
          color: '#059669',
          bgColor: '#ECFDF5',
          badge: '₦1,000',
        },
        {
          label: 'Discounts & Promo Codes',
          subtitle: 'Create coupons & flash sales',
          Icon: Tag,
          route: '/(merchant)/more/discounts',
          color: '#D97706',
          bgColor: '#FFFBEB',
        },
        {
          label: 'My Store QR Code',
          subtitle: 'Print or display to customers',
          Icon: QrCode,
          route: '/(merchant)/more/qr-code',
          color: '#0F766E',
          bgColor: '#F0FDFA',
          badge: isPro ? undefined : 'Pro',
        },
        {
          label: 'WhatsApp Inbox & Growth',
          subtitle: 'Automated order notifications',
          Icon: MessageCircle,
          route: '/(merchant)/more/whatsapp-inbox',
          color: '#16A34A',
          bgColor: '#F0FDF4',
        },
      ],
    },
    {
      title: 'ACCOUNT & PREFERENCES',
      items: [
        {
          label: 'Store Settings & Profile',
          subtitle: 'Logo, bio, WhatsApp & branding',
          Icon: Settings,
          route: '/(merchant)/more/settings',
          color: '#4F46E5',
          bgColor: '#EEF2FF',
        },
        {
          label: 'Referral & Partner Program',
          subtitle: 'Your referral code & ₦1,000 rewards',
          Icon: Sparkles,
          route: '/(merchant)/more/referrals',
          color: '#059669',
          bgColor: '#ECFDF5',
          badge: '₦1,000',
        },
        {
          label: 'Push & SMS Notifications',
          subtitle: 'Order alerts and daily digest',
          Icon: Bell,
          route: '/(merchant)/more/notifications',
          color: '#EA580C',
          bgColor: '#FFF7ED',
        },
        {
          label: 'Reviews & Reputation',
          subtitle: 'Buyer ratings and feedback',
          Icon: Star,
          color: '#CA8A04',
          bgColor: '#FEFCE8',
          action: () => Alert.alert('Reviews', 'Customer reviews are verified and displayed from delivered orders.'),
        },
        {
          label: 'Custom Domain',
          subtitle: 'Connect your own .com or .ng domain',
          Icon: Globe,
          color: '#0284C7',
          bgColor: '#F0F9FF',
          badge: isPro ? undefined : 'Pro',
          action: () => Alert.alert('Custom Domain', 'Upgrade your store to Pro to connect your personal domain (e.g. shop.yourbrand.com).'),
        },
        {
          label: 'Privacy & Security',
          subtitle: 'Data protection and policies',
          Icon: Shield,
          color: '#475569',
          bgColor: '#F1F5F9',
          action: () => Linking.openURL('https://frontstore.ng/privacy'),
        },
      ],
    },
    {
      title: 'HELP & SUPPORT',
      items: [
        {
          label: 'Help Center & Guides',
          subtitle: 'Frequently asked questions',
          Icon: HelpCircle,
          color: '#64748B',
          bgColor: '#F8FAFC',
          action: () => Linking.openURL('https://frontstore.ng/help'),
        },
        {
          label: 'View Live Storefront',
          subtitle: 'Open how buyers see your store',
          Icon: ExternalLink,
          color: '#0F766E',
          bgColor: '#F0FDFA',
          action: () => Linking.openURL(storeUrl),
        },
        {
          label: 'Sign Out',
          subtitle: 'Sign out of this merchant session',
          Icon: LogOut,
          color: '#DC2626',
          bgColor: '#FEF2F2',
          danger: true,
          action: handleLogout,
        },
      ],
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: '#F8FAFC' }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top > 0 ? insets.top + 8 : Spacing[4],
            paddingBottom: 110,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your store & business account</Text>
          </View>

          <TouchableOpacity
            style={styles.headerViewStoreBtn}
            onPress={() => Linking.openURL(storeUrl)}
            activeOpacity={0.8}
          >
            <Store size={14} color="#0F766E" strokeWidth={2.2} />
            <Text style={styles.headerViewStoreText}>Live Shop</Text>
            <ArrowUpRight size={13} color="#0F766E" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Hero Merchant Identity Card */}
        <View style={[styles.heroCard, Shadow.card as any]}>
          {/* Top Row: Avatar + Identity + Tier Badge */}
          <TouchableOpacity
            style={styles.heroTopRow}
            activeOpacity={0.85}
            onPress={() => {
              haptics.selection();
              router.push('/(merchant)/more/settings' as any);
            }}
          >
            <View style={styles.avatarContainer}>
              <Avatar uri={logoUrl} name={displayName} size={58} />
              <View style={styles.avatarVerifiedBadge}>
                <Check size={11} color="#FFFFFF" strokeWidth={3} />
              </View>
            </View>

            <View style={styles.heroInfo}>
              <View style={styles.heroNameRow}>
                <Text style={styles.heroStoreName} numberOfLines={1}>
                  {displayName}
                </Text>
              </View>

              {displayEmail ? (
                <Text style={styles.heroEmail} numberOfLines={1}>
                  {displayEmail}
                </Text>
              ) : null}

              <View style={styles.heroBadgeRow}>
                <View
                  style={[
                    styles.tierBadge,
                    {
                      backgroundColor: plan.bg,
                      borderColor: plan.border,
                    },
                  ]}
                >
                  <Sparkles size={11} color={plan.color} strokeWidth={2.5} />
                  <Text style={[styles.tierBadgeLabel, { color: plan.color }]}>{plan.label}</Text>
                </View>

                {store?.is_active !== false && (
                  <View style={styles.activePill}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeText}>Active</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.heroEditArrow}>
              <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
            </View>
          </TouchableOpacity>

          {/* Sub-bar: Store Link & Copy */}
          {displayUsername ? (
            <View style={styles.storeLinkPill}>
              <View style={styles.storeLinkLeft}>
                <Globe size={13} color="#0F766E" strokeWidth={2.2} />
                <Text style={styles.storeLinkText} numberOfLines={1}>
                  {displayUsername}.frontstore.ng
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
                onPress={handleCopyLink}
                activeOpacity={0.7}
              >
                {copied ? (
                  <>
                    <Check size={12} color="#047857" strokeWidth={2.6} />
                    <Text style={[styles.copyBtnText, { color: '#047857' }]}>Copied</Text>
                  </>
                ) : (
                  <>
                    <Copy size={12} color="#0F766E" strokeWidth={2.2} />
                    <Text style={styles.copyBtnText}>Copy</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Quick Action Buttons Row */}
          <View style={styles.heroActionRow}>
            <TouchableOpacity
              style={styles.heroActionBtn}
              onPress={() => {
                haptics.selection();
                router.push('/(merchant)/more/settings' as any);
              }}
              activeOpacity={0.8}
            >
              <Edit3 size={15} color="#0F766E" strokeWidth={2.2} />
              <Text style={styles.heroActionText}>Edit Store</Text>
            </TouchableOpacity>

            <View style={styles.heroActionDivider} />

            <TouchableOpacity
              style={styles.heroActionBtn}
              onPress={() => {
                haptics.selection();
                router.push('/(merchant)/more/qr-code' as any);
              }}
              activeOpacity={0.8}
            >
              <QrCode size={15} color="#0F766E" strokeWidth={2.2} />
              <Text style={styles.heroActionText}>My QR Code</Text>
            </TouchableOpacity>

            <View style={styles.heroActionDivider} />

            <TouchableOpacity
              style={styles.heroActionBtn}
              onPress={handleShareStore}
              activeOpacity={0.8}
            >
              <Share2 size={15} color="#0F766E" strokeWidth={2.2} />
              <Text style={styles.heroActionText}>Share Shop</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Refer & Earn Promo Banner */}
        <TouchableOpacity
          style={[styles.referralBanner, Shadow.sm as any]}
          activeOpacity={0.85}
          onPress={() => {
            haptics.selection();
            router.push('/(merchant)/more/referrals' as any);
          }}
        >
          <View style={styles.referralBannerLeft}>
            <View style={styles.referralIconContainer}>
              <Sparkles size={20} color="#059669" strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.referralTitleRow}>
                <Text style={styles.referralBannerTitle}>Refer & Earn</Text>
                <View style={styles.referralPill}>
                  <Text style={styles.referralPillText}>Earn ₦1,000</Text>
                </View>
              </View>
              <Text style={styles.referralBannerSub}>
                Invite fellow merchants & earn rewards when they list & upgrade
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color="#059669" strokeWidth={2.2} />
        </TouchableOpacity>

        {/* Menu Sections */}
        {sections.map((sec) => (
          <View key={sec.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <View style={[styles.menuGroup, Shadow.sm as any]}>
              {sec.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    idx < sec.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={() => {
                    haptics.selection();
                    if (item.action) item.action();
                    else if (item.route) router.push(item.route as any);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconContainer, { backgroundColor: item.bgColor ?? '#F1F5F9' }]}>
                    <item.Icon size={18} color={item.color} strokeWidth={2.2} />
                  </View>

                  <View style={styles.menuLabelContainer}>
                    <Text
                      style={[
                        styles.menuLabel,
                        item.danger && { color: '#DC2626' },
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    {item.subtitle ? (
                      <Text style={styles.menuSubtitle} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>

                  {item.badge ? (
                    <Badge label={item.badge} variant="primary" size="sm" style={{ marginRight: Spacing[1] }} />
                  ) : null}

                  {!item.danger && (
                    <ChevronRight size={16} color="#CBD5E1" strokeWidth={2.2} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Brand Footnote */}
        <View style={styles.footerBranding}>
          <Text style={styles.footerText}>FrontStore Commerce Engine</Text>
          <Text style={styles.footerSubText}>v1.0.4 · Built for Modern Merchants</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 18,
  },

  // Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  headerTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 26,
    letterSpacing: -0.6,
    color: '#0F172A',
  },
  headerSubtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  headerViewStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  headerViewStoreText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 12,
    color: '#0F766E',
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 22,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0F766E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: {
    flex: 1,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroStoreName: {
    fontFamily: FontFamily.headingBold,
    fontSize: 17,
    letterSpacing: -0.3,
    color: '#0F172A',
  },
  heroEmail: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  tierBadgeLabel: {
    fontFamily: FontFamily.headingBold,
    fontSize: 10.5,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 9999,
    backgroundColor: '#ECFDF5',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  activeText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 10,
    color: '#047857',
  },
  heroEditArrow: {
    paddingLeft: 4,
  },

  // Store Link Bar
  storeLinkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    marginTop: 14,
  },
  storeLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    marginRight: 8,
  },
  storeLinkText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: '#0F766E',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  copyBtnSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  copyBtnText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 11,
    color: '#0F766E',
  },

  // Hero Quick Actions
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 14,
    paddingTop: 12,
  },
  heroActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  heroActionText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 12,
    color: '#0F766E',
  },
  heroActionDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E2E8F0',
  },

  // Section & Menu Items
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 11,
    letterSpacing: 1,
    color: '#94A3B8',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  menuGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEFF5',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 13,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabelContainer: {
    flex: 1,
  },
  menuLabel: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 14.5,
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  menuSubtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1.5,
  },

  // Referral Banner
  referralBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  referralBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  referralIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  referralBannerTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 15,
    letterSpacing: -0.2,
    color: '#0F172A',
  },
  referralPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  referralPillText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 10,
    color: '#059669',
  },
  referralBannerSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },

  // Footer
  footerBranding: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 3,
  },
  footerText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 11.5,
    color: '#94A3B8',
    letterSpacing: 0.2,
  },
  footerSubText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 10.5,
    color: '#CBD5E1',
  },
});

