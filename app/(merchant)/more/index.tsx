import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Wallet, Calendar, Settings, LogOut, Star, HelpCircle, ExternalLink,
  ChevronRight, Shield, Bell, Globe, Users, BarChart2, Tag,
} from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/services/authApi';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

interface MenuItem {
  label: string;
  Icon: any;
  route?: string;
  color: string;
  badge?: string;
  action?: () => void;
  danger?: boolean;
}

export default function MoreScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const haptics = useHaptics();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel' },
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

  const storeUrl = user?.store?.username
    ? `https://frontstore.app/${user.store.username}`
    : 'https://frontstore.app';

  const sections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Business',
      items: [
        { label: 'Customers', Icon: Users, route: '/(merchant)/customers', color: Colors.info },
        { label: 'Analytics', Icon: BarChart2, route: '/(merchant)/analytics', color: Colors.success },
        { label: 'Discounts & Coupons', Icon: Tag, route: '/(merchant)/more/discounts', color: Colors.amber },
        { label: 'Wallet & Payouts', Icon: Wallet, route: '/(merchant)/more/wallet', color: '#0891B2' },
        { label: 'Bookings', Icon: Calendar, route: '/(merchant)/more/bookings', color: Colors.primary },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Notifications', Icon: Bell, route: '/(merchant)/more/notifications', color: Colors.warning },
        { label: 'Store Settings', Icon: Settings, route: '/(merchant)/more/settings', color: Colors.primary },
        {
          label: 'Reviews',
          Icon: Star,
          color: Colors.amber,
          action: () => Alert.alert('Reviews', 'Customer reviews are managed from the Orders section after delivery is confirmed.'),
        },
        {
          label: 'Privacy & Security',
          Icon: Shield,
          color: Colors.navy,
          action: () => Linking.openURL('https://frontstore.app/privacy'),
        },
        {
          label: 'Custom Domain',
          Icon: Globe,
          color: '#0891B2',
          badge: 'Pro',
          action: () => Alert.alert('Custom Domain', 'Upgrade to Pro to connect your own domain (e.g. shop.yourbrand.com).'),
        },
      ],
    },
    {
      title: 'Help',
      items: [
        {
          label: 'Help Center',
          Icon: HelpCircle,
          color: Colors.gray600,
          action: () => Linking.openURL('https://frontstore.app/help'),
        },
        {
          label: 'View Your Store',
          Icon: ExternalLink,
          color: Colors.gray600,
          action: () => Linking.openURL(storeUrl),
        },
        { label: 'Sign Out', Icon: LogOut, color: Colors.danger, danger: true, action: handleLogout },
      ],
    },
  ];

  const planConfig = {
    free: { label: 'Free Plan', color: Colors.gray600 },
    pro: { label: 'Pro Plan', color: Colors.primary },
    enterprise: { label: 'Enterprise', color: Colors.amber },
  };
  const plan = planConfig[user?.plan ?? 'free'];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>More</Text>

        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: theme.card }, Shadow.md as any]}>
          <Avatar uri={user?.store?.logo_url} name={user?.name ?? 'U'} size={60} />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>{user?.name}</Text>
            <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{user?.email}</Text>
            {user?.store?.username && (
              <Text style={[styles.profileStore, { color: Colors.primary }]}>
                frontstore.app/{user.store.username}
              </Text>
            )}
          </View>
          <View style={[styles.planBadge, { backgroundColor: plan.color + '18' }]}>
            <Text style={[styles.planLabel, { color: plan.color }]}>{plan.label}</Text>
          </View>
        </View>

        {/* Upgrade banner (free users) */}
        {user?.plan === 'free' && (
          <TouchableOpacity style={[styles.upgradeBanner, { backgroundColor: Colors.primaryDim }]} activeOpacity={0.85}>
            <View>
              <Text style={[styles.upgradeBannerTitle, { color: Colors.primary }]}>Upgrade to Pro</Text>
              <Text style={[styles.upgradeBannerSub, { color: Colors.primaryLight ?? Colors.primary }]}>
                Unlock custom domain, broadcasts & advanced analytics
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {/* Menu sections */}
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>{section.title.toUpperCase()}</Text>
            <View style={[styles.menuGroup, { backgroundColor: theme.card }, Shadow.sm as any]}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    i < section.items.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 },
                  ]}
                  onPress={() => {
                    haptics.light();
                    if (item.action) item.action();
                    else if (item.route) router.push(item.route as any);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.color + '18' }]}>
                    <item.Icon size={18} color={item.danger ? Colors.danger : item.color} strokeWidth={2} />
                  </View>
                  <Text style={[styles.menuLabel, { color: item.danger ? Colors.danger : theme.text }]}>
                    {item.label}
                  </Text>
                  {item.badge && (
                    <Badge label={item.badge} variant="primary" size="sm" style={{ marginRight: Spacing[2] }} />
                  )}
                  {!item.danger && <ChevronRight size={16} color={theme.textTertiary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={[styles.version, { color: theme.textTertiary }]}>FrontStore v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: Spacing[6], paddingBottom: 120 },
  pageTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], letterSpacing: -0.5, paddingTop: Spacing[5], marginBottom: Spacing[5] },

  profileCard: { borderRadius: Radius.xl, padding: Spacing[5], flexDirection: 'row', alignItems: 'center', gap: Spacing[4], marginBottom: Spacing[4] },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: FontFamily.headingBold, fontSize: FontSize.lg, letterSpacing: -0.3 },
  profileEmail: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, marginTop: 2 },
  profileStore: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs, marginTop: 4 },
  planBadge: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[1], borderRadius: Radius.full },
  planLabel: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xs },

  upgradeBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing[5], borderRadius: Radius.lg, marginBottom: Spacing[5],
  },
  upgradeBannerTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize.md, marginBottom: 3 },
  upgradeBannerSub: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, lineHeight: 16 },

  section: { marginBottom: Spacing[5] },
  sectionTitle: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, letterSpacing: 1, marginBottom: Spacing[3] },
  menuGroup: { borderRadius: Radius.lg, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], gap: Spacing[4] },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.base },

  version: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, textAlign: 'center', marginTop: Spacing[4] },
});
