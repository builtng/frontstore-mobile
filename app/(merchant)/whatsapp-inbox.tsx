import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { FontFamily, FontSize } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useModuleStatus } from '@/hooks/useModuleStatus';
import { useAuthStore } from '@/stores/authStore';
import { EmptyState } from '@/components/ui/EmptyState';

export default function WhatsAppInboxScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const moduleStatus = useModuleStatus('whatsapp_inbox');
  const isPro = user?.plan === 'pro_monthly' || user?.plan === 'pro_yearly';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>WhatsApp Inbox</Text>
        <View style={{ width: 22 }} />
      </View>

      {moduleStatus === 'coming_soon' ? (
        <EmptyState
          type="coming-soon"
          title="WhatsApp Inbox"
          description="Chat with your customers on WhatsApp, right inside FrontStore. Coming soon."
        />
      ) : !isPro ? (
        <EmptyState
          type="generic"
          title="WhatsApp Inbox is a Pro feature"
          description="Manage every WhatsApp order and conversation from one inbox. Upgrade to Pro to unlock it."
          actionLabel="Upgrade to Pro"
          onAction={() => Linking.openURL('https://frontstore.app/dashboard?tab=billing')}
        />
      ) : (
        <EmptyState
          type="generic"
          title="No conversations yet"
          description="Customer messages from WhatsApp will appear here."
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[6], paddingTop: Spacing[5], paddingBottom: Spacing[4] },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, letterSpacing: -0.3 },
});
