import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet, Settings, LogOut, Star, HelpCircle, ExternalLink,
  ChevronRight, Shield, Bell, Globe, Users, BarChart2, Tag, MessageCircle, QrCode,
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
  const isPro = user?.plan === 'pro_monthly' || user?.plan === 'pro_yearly';

  // Fetch real store data
  const { data: storeRes } = useQuery({
    queryKey: ['merchant-store'],
    queryFn: merchantApi.getStore,
  });

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

  const store = storeRes?.data || user?.store;
  const displayName = store?.name || user?.name || 'Musa Stores';
  const displayEmail = user?.email || 'musa@frontstore.ng';
  const displayUsername = store?.username || 'musa-stores';
  const logoUrl = store?.logo_url || user?.store?.logo_url;
  const storeUrl = `https://${displayUsername}.frontstore.ng`;

  const sections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'BUSINESS & SALES',
      items: [
        { label: 'Customers', Icon: Users, route: '/(merchant)/more/customers', color: Colors.info },
        { label: 'Analytics', Icon: BarChart2, route: '/(merchant)/more/analytics', color: Colors.success },
        { label: 'Wallet & Payouts', Icon: Wallet, route: '/(merchant)/more/wallet', color: '#0891B2' },
        { label: 'Discounts & Coupons', Icon: Tag, route: '/(merchant)/more/discounts', color: Colors.amber },
        { label: 'My QR Code', Icon: QrCode, route: '/(merchant)/more/qr-code', color: '#128C7E', badge: isPro ? undefined : 'Pro' },
        { label: 'WhatsApp & Growth', Icon: MessageCircle, route: '/(merchant)/more/whatsapp-inbox', color: '#25D366' },
      ],
    },
    {
      title: 'ACCOUNT & SETTINGS',
      items: [
        { label: 'Notifications', Icon: Bell, route: '/(merchant)/more/notifications', color: Colors.warning },
        { label: 'Store Settings', Icon: Settings, route: '/(merchant)/more/settings', color: Colors.primaryLight },
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
          action: () => Linking.openURL('https://frontstore.ng/privacy'),
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
      title: 'HELP & SUPPORT',
      items: [
        {
          label: 'Help Center',
          Icon: HelpCircle,
          color: Colors.gray600,
          action: () => Linking.openURL('https://frontstore.ng/help'),
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
    pro_monthly: { label: 'Pro Plan', color: Colors.primaryLight },
    pro_yearly: { label: 'Pro Plan', color: Colors.primaryLight },
  };
  const plan = planConfig[user?.plan ?? 'free'];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: '#F8FAFC' }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: '#0F172A' }]}>More</Text>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: '#FFFFFF' }, Shadow.md as any]}>
          <Avatar uri={logoUrl} name={displayName} size={54} />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: '#0F172A' }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.profileEmail, { color: '#64748B' }]} numberOfLines={1}>
              {displayEmail}
            </Text>
            {displayUsername && (
              <Text style={[styles.profileStore, { color: '#128C7E' }]} numberOfLines={1}>
                {displayUsername}.frontstore.ng
              </Text>
            )}
          </View>
          <View style={[styles.planBadge, { backgroundColor: 'rgba(18, 140, 126, 0.12)' }]}>
            <Text style={[styles.planLabel, { color: '#128C7E' }]}>{plan.label}</Text>
          </View>
        </View>

        {/* Menu Sections */}
        {sections.map((sec) => (
          <View key={sec.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#64748B' }]}>{sec.title}</Text>
            <View style={[styles.menuGroup, { backgroundColor: '#FFFFFF' }]}>
              {sec.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    idx < sec.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
                  ]}
                  onPress={() => {
                    haptics.selection();
                    if (item.action) item.action();
                    else if (item.route) router.push(item.route as any);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                    <item.Icon size={20} color={item.color} />
                  </View>
                  <Text style={[styles.menuLabel, { color: item.danger ? Colors.danger : '#0F172A' }]}>
                    {item.label}
                  </Text>
                  {item.badge && (
                    <Badge label={item.badge} variant="primary" size="sm" style={{ marginRight: Spacing[2] }} />
                  )}
                  {!item.danger && <ChevronRight size={16} color="#94A3B8" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  pageTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], letterSpacing: -0.5, paddingTop: Spacing[4], marginBottom: Spacing[4] },

  profileCard: { borderRadius: Radius.xl, padding: Spacing[4], flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginBottom: Spacing[5] },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: FontFamily.headingBold, fontSize: FontSize.md, letterSpacing: -0.3 },
  profileEmail: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, marginTop: 2 },
  profileStore: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs, marginTop: 3 },
  planBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  planLabel: { fontFamily: FontFamily.headingBold, fontSize: 11 },

  section: { marginBottom: Spacing[5] },
  sectionTitle: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, letterSpacing: 0.8, marginBottom: Spacing[2] },
  menuGroup: { borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[4], paddingVertical: 14, gap: Spacing[3] },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.base },

  version: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, textAlign: 'center', marginTop: Spacing[2] },
});
