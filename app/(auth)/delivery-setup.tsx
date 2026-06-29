import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Check, MapPin, Truck, Globe, Download } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { useOnboardingStore, DeliveryOption } from '@/stores/onboardingStore';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

const OPTIONS: {
  id: DeliveryOption;
  label: string;
  desc: string;
  Icon: any;
  color: string;
}[] = [
  { id: 'pickup', label: 'Pickup', desc: 'Customers collect from your location', Icon: MapPin, color: Colors.primary },
  { id: 'delivery', label: 'Local Delivery', desc: 'You deliver to customers in your area', Icon: Truck, color: Colors.success },
  { id: 'shipping', label: 'Nationwide Shipping', desc: 'Ship via courier services', Icon: Globe, color: Colors.info },
  { id: 'digital', label: 'Digital Delivery', desc: 'Instant download or email delivery', Icon: Download, color: Colors.amber },
];

export default function DeliverySetupScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const haptics = useHaptics();
  const { deliveryOptions, toggleDeliveryOption } = useOnboardingStore();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
        <View style={[styles.progressFill, { width: '80%' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.step, { color: Colors.primary }]}>Step 6 of 8</Text>
          <Text style={[styles.title, { color: theme.text }]}>How will you deliver?</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Select all delivery methods you offer. You can change this later.
          </Text>
        </View>

        <View style={styles.list}>
          {OPTIONS.map(({ id, label, desc, Icon, color }) => {
            const selected = deliveryOptions.includes(id);
            return (
              <TouchableOpacity
                key={id}
                onPress={() => { haptics.selection(); toggleDeliveryOption(id); }}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: selected ? color + '12' : theme.card,
                      borderColor: selected ? color : theme.border,
                    },
                    Shadow.sm as any,
                  ]}
                >
                  <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                    <Icon size={22} color={color} strokeWidth={2} />
                  </View>
                  <View style={styles.info}>
                    <Text style={[styles.label, { color: selected ? color : theme.text }]}>{label}</Text>
                    <Text style={[styles.desc, { color: theme.textSecondary }]}>{desc}</Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      selected
                        ? { backgroundColor: color, borderColor: color }
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
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <Button
          title="Continue"
          onPress={() => router.push('/(auth)/add-product')}
          disabled={deliveryOptions.length === 0}
          size="xl"
          icon={<ArrowRight size={20} color={Colors.white} />}
          iconPosition="right"
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
  list: { gap: Spacing[3] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    gap: Spacing[4],
  },
  iconBox: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  label: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.md, marginBottom: 3 },
  desc: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, lineHeight: 18 },
  checkbox: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  footer: { paddingHorizontal: Spacing[6], paddingVertical: Spacing[5] },
});
