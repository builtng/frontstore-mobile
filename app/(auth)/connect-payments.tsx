import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { merchantApi } from '@/services/merchantApi';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

type PaymentProvider = 'paystack' | 'flutterwave' | 'stripe' | 'manual';

const PROVIDER_INFO: Record<PaymentProvider, { name: string; tagline: string; logo: string; color: string; regions: string }> = {
  paystack: {
    name: 'Paystack',
    tagline: 'Cards, bank transfers, USSD, mobile money',
    logo: 'P',
    color: '#00C3F7',
    regions: 'Nigeria · Ghana · South Africa',
  },
  flutterwave: {
    name: 'Flutterwave',
    tagline: 'Pan-African payments in 150+ currencies',
    logo: 'F',
    color: '#F5A623',
    regions: '30+ African countries',
  },
  stripe: {
    name: 'Stripe',
    tagline: 'Global cards, Apple Pay, Google Pay',
    logo: 'S',
    color: '#635BFF',
    regions: 'Global · International',
  },
  manual: {
    name: 'Manual (Bank Transfer)',
    tagline: 'Customers pay by bank transfer, you confirm manually',
    logo: 'B',
    color: '#6B7280',
    regions: 'Everywhere',
  },
};

export default function ConnectPaymentsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const haptics = useHaptics();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<PaymentProvider[]>(['paystack', 'flutterwave', 'stripe', 'manual']);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await merchantApi.getStore();
        const store = res?.data;
        const available: PaymentProvider[] = [...(store?.available_payment_providers ?? []), 'manual'];
        setAvailableProviders(Array.from(new Set(available)));
        setSelectedProvider((store?.payment_provider as PaymentProvider) ?? null);
      } catch {
        // Keep the default provider list so the screen is still usable offline.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleContinue = async () => {
    if (selectedProvider) {
      try {
        setSaving(true);
        await merchantApi.updateStore({ payment_provider: selectedProvider });
      } catch {
        // Non-fatal — merchant can change this later in Settings.
      } finally {
        setSaving(false);
      }
    }
    router.push('/(auth)/delivery-setup');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
        <View style={[styles.progressFill, { width: '70%' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.step, { color: Colors.primary }]}>Step 5 of 8</Text>
          <Text style={[styles.title, { color: theme.text }]}>Connect payments</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Choose how you want to receive payments from customers
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing[8] }} />
        ) : (
          <View style={styles.list}>
            {availableProviders.map((id) => {
              const p = PROVIDER_INFO[id];
              const selected = selectedProvider === id;
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => { haptics.selection(); setSelectedProvider(id); }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.card,
                      { backgroundColor: theme.card, borderColor: selected ? Colors.primary : theme.border },
                      (Shadow.sm as any),
                    ]}
                  >
                    <View style={[styles.logoBox, { backgroundColor: p.color + '22' }]}>
                      <Text style={[styles.logoText, { color: p.color }]}>{p.logo}</Text>
                    </View>

                    <View style={styles.info}>
                      <Text style={[styles.name, { color: theme.text }]}>{p.name}</Text>
                      <Text style={[styles.tagline, { color: theme.textSecondary }]}>{p.tagline}</Text>
                      <Text style={[styles.regions, { color: theme.textTertiary }]}>{p.regions}</Text>
                    </View>

                    <View
                      style={[
                        styles.checkbox,
                        selected
                          ? { backgroundColor: Colors.primary, borderColor: Colors.primary }
                          : { backgroundColor: 'transparent', borderColor: theme.border },
                      ]}
                    >
                      {selected && <Check size={14} color={Colors.white} strokeWidth={3} />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={[styles.note, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.noteText, { color: theme.textSecondary }]}>
            💡 Only providers available in your country are shown. You can change this later in Settings.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <Button
          title="Continue"
          onPress={handleContinue}
          size="xl"
          isLoading={saving}
          icon={<ArrowRight size={20} color={Colors.white} />}
          iconPosition="right"
        />
        <Button
          title="Skip for now"
          onPress={() => router.push('/(auth)/delivery-setup')}
          variant="ghost"
          size="md"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  progressTrack: { height: 3 },
  progressFill: { height: 3, backgroundColor: Colors.primary, borderRadius: 2 },
  scroll: { paddingHorizontal: Spacing[6], paddingBottom: Spacing[4] },
  back: { marginTop: Spacing[4], marginBottom: Spacing[6], width: 40, height: 40, justifyContent: 'center' },
  header: { marginBottom: Spacing[6] },
  step: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, marginBottom: Spacing[2] },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], letterSpacing: -0.8, marginBottom: Spacing[2] },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, lineHeight: 24 },
  list: { gap: Spacing[3], marginBottom: Spacing[5] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    gap: Spacing[4],
  },
  logoBox: { width: 50, height: 50, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: FontFamily.headingBold, fontSize: FontSize['2xl'] },
  info: { flex: 1, gap: 3 },
  name: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.md },
  tagline: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, lineHeight: 16 },
  regions: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    borderRadius: Radius.md,
    padding: Spacing[4],
    borderWidth: 1,
  },
  noteText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, lineHeight: 20 },
  footer: { paddingHorizontal: Spacing[6], paddingVertical: Spacing[4], gap: Spacing[2] },
});
