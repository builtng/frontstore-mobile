import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, ShoppingBag, Store, LogOut, ChevronRight, Package } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useBuyerStore } from '@/stores/buyerStore';
import { useAuthStore } from '@/stores/authStore';
import { buyerApi } from '@/services/buyerApi';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

export default function AccountScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { buyer, isAuthenticated, buyerLogout } = useBuyerStore();
  const { isAuthenticated: isMerchant } = useAuthStore();

  const handleBuyerLogout = () => {
    Alert.alert('Sign Out', 'Sign out of your buyer account?', [
      { text: 'Cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try { await buyerApi.logout(); } catch {}
          await buyerLogout();
        },
      },
    ]);
  };

  const handleMerchantPortal = () => {
    if (isMerchant) {
      router.push('/(merchant)');
    } else {
      router.push('/(auth)/welcome');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Account</Text>

        {isAuthenticated && buyer ? (
          <>
            {/* Buyer profile card */}
            <View style={[styles.profileCard, { backgroundColor: theme.card }, Shadow.md as any]}>
              <Avatar name={buyer.name} size={56} />
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: theme.text }]}>{buyer.name}</Text>
                <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{buyer.email}</Text>
                {buyer.phone && (
                  <Text style={[styles.profilePhone, { color: theme.textTertiary }]}>{buyer.phone}</Text>
                )}
              </View>
            </View>

            {/* Buyer menu */}
            <View style={[styles.menuGroup, { backgroundColor: theme.card }, Shadow.sm as any]}>
              {[
                { label: 'My Orders', Icon: ShoppingBag, route: '/(buyer)/orders' },
                { label: 'Track an Order', Icon: Package, route: '/(buyer)/track' },
              ].map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, i < 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={[styles.menuIcon, { backgroundColor: Colors.primaryDim }]}>
                    <item.Icon size={18} color={Colors.primary} strokeWidth={2} />
                  </View>
                  <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
                  <ChevronRight size={16} color={theme.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.logoutBtn, { borderColor: Colors.danger + '40' }]}
              onPress={handleBuyerLogout}
            >
              <LogOut size={18} color={Colors.danger} />
              <Text style={[styles.logoutText, { color: Colors.danger }]}>Sign Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Guest state */}
            <View style={[styles.guestCard, { backgroundColor: theme.card }, Shadow.md as any]}>
              <View style={[styles.guestIcon, { backgroundColor: Colors.primaryDim }]}>
                <User size={36} color={Colors.primary} strokeWidth={1.5} />
              </View>
              <Text style={[styles.guestTitle, { color: theme.text }]}>Sign in to your account</Text>
              <Text style={[styles.guestDesc, { color: theme.textSecondary }]}>
                Track orders, save your details, and get a faster checkout experience.
              </Text>
              <Button
                title="Continue with WhatsApp"
                onPress={() => router.push('/(buyer-auth)/phone')}
                size="lg"
              />
              <Button
                title="Continue as Guest"
                onPress={() => router.back()}
                variant="ghost"
                size="md"
              />
            </View>
          </>
        )}

        {/* Merchant section — always visible */}
        <View style={[styles.merchantSection, { backgroundColor: theme.card, borderColor: Colors.primaryDim }]}>
          <View style={styles.merchantSectionHeader}>
            <View style={[styles.merchantIcon, { backgroundColor: Colors.primaryDim }]}>
              <Store size={22} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.merchantSectionInfo}>
              <Text style={[styles.merchantSectionTitle, { color: theme.text }]}>
                {isMerchant ? 'Go to Merchant Dashboard' : 'Sell on FrontStore'}
              </Text>
              <Text style={[styles.merchantSectionDesc, { color: theme.textSecondary }]}>
                {isMerchant
                  ? 'Manage your store, orders, and products'
                  : 'Set up your store in minutes — completely free'}
              </Text>
            </View>
          </View>
          <Button
            title={isMerchant ? 'Open Dashboard' : 'Start Selling Free'}
            onPress={handleMerchantPortal}
            size="md"
            style={styles.merchantBtn}
          />
        </View>

        <Text style={[styles.version, { color: theme.textTertiary }]}>FrontStore v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: Spacing[6], paddingBottom: 120 },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], letterSpacing: -0.5, paddingTop: Spacing[5], marginBottom: Spacing[5] },

  profileCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing[4], padding: Spacing[5], borderRadius: Radius.xl, marginBottom: Spacing[5] },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl },
  profileEmail: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, marginTop: 2 },
  profilePhone: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, marginTop: 2 },

  menuGroup: { borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing[5] },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], gap: Spacing[4] },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.base },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[3], padding: Spacing[4], borderRadius: Radius.lg, borderWidth: 1.5, marginBottom: Spacing[6] },
  logoutText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.base },

  guestCard: { borderRadius: Radius.xl, padding: Spacing[6], alignItems: 'center', gap: Spacing[4], marginBottom: Spacing[5] },
  guestIcon: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  guestTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, textAlign: 'center' },
  guestDesc: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, textAlign: 'center', lineHeight: 24 },

  merchantSection: {
    borderRadius: Radius.xl, padding: Spacing[5], borderWidth: 2,
    gap: Spacing[4], marginBottom: Spacing[4],
  },
  merchantSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[4] },
  merchantIcon: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  merchantSectionInfo: { flex: 1 },
  merchantSectionTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize.md },
  merchantSectionDesc: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, marginTop: 3, lineHeight: 16 },
  merchantBtn: {},

  version: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, textAlign: 'center', marginTop: Spacing[4] },
});
