import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { FontFamily, FontSize } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useModuleStatus } from '@/hooks/useModuleStatus';
import { EmptyState } from '@/components/ui/EmptyState';

export default function WhatsAppOrderScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const moduleStatus = useModuleStatus('whatsapp_order');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>WhatsApp Order</Text>
        <View style={{ width: 22 }} />
      </View>

      {moduleStatus === 'coming_soon' ? (
        <EmptyState
          type="coming-soon"
          title="WhatsApp Order"
          description="Let customers order and check out with you directly inside WhatsApp. Coming soon."
        />
      ) : (
        <EmptyState
          type="orders"
          title="No WhatsApp orders yet"
          description="Orders placed by customers through WhatsApp will appear here."
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
