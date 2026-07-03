import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { FontFamily, FontSize } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useModuleStatus } from '@/hooks/useModuleStatus';
import { EmptyState } from '@/components/ui/EmptyState';

export default function WhatsAppOrderAlertsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const moduleStatus = useModuleStatus('whatsapp_order_alerts');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>WhatsApp Order Alerts</Text>
        <View style={{ width: 22 }} />
      </View>

      {moduleStatus === 'coming_soon' ? (
        <EmptyState
          type="coming-soon"
          title="WhatsApp Order Alerts"
          description="Get an instant WhatsApp message the moment a new order comes in. Coming soon."
        />
      ) : (
        <EmptyState
          type="generic"
          title="No alerts yet"
          description="You'll get a WhatsApp message here whenever a new order comes in."
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
