import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, TouchableOpacity, ScrollView, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Phone, Mail, ChevronDown, Check } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useToast } from '@/components/ui/Toast';
import { buyerApi } from '@/services/buyerApi';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

const DIAL_CODES = [
  { country: 'Nigeria', code: '+234' },
  { country: 'Kenya', code: '+254' },
  { country: 'Ghana', code: '+233' },
  { country: 'South Africa', code: '+27' },
  { country: 'Uganda', code: '+256' },
  { country: 'Tanzania', code: '+255' },
  { country: 'Rwanda', code: '+250' },
  { country: 'Ethiopia', code: '+251' },
  { country: 'Senegal', code: '+221' },
  { country: 'Ivory Coast', code: '+225' },
  { country: 'United Kingdom', code: '+44' },
  { country: 'United States', code: '+1' },
];

export default function BuyerPhoneScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const toast = useToast();
  const haptics = useHaptics();

  const [phone, setPhone] = useState('');
  const [dialCode, setDialCode] = useState(DIAL_CODES[0]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [email, setEmail] = useState('');

  const cleanPhone = phone.replace(/\D/g, '');
  const isValidPhone = cleanPhone.length >= 7;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValid = isValidPhone && (!needsEmail || isValidEmail);

  const handleSend = async () => {
    if (!isValidPhone) return;
    if (needsEmail && !isValidEmail) return;
    setIsLoading(true);
    haptics.light();
    try {
      const result = await buyerApi.sendOtp({
        phone_number: cleanPhone,
        country_dial_code: dialCode.code,
        email: needsEmail ? email.trim() : undefined,
      });

      if (result.needs_email) {
        setNeedsEmail(true);
        return;
      }

      router.push({
        pathname: '/(buyer-auth)/verify',
        params: {
          phone: cleanPhone,
          dial_code: dialCode.code,
          formatted: result.phone ?? `${dialCode.code}${cleanPhone}`,
          email: result.email ?? '',
        },
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.close} onPress={() => router.back()}>
            <X size={22} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.icon, { backgroundColor: '#25D366' + '20' }]}>
              <Phone size={28} color="#25D366" strokeWidth={2} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Enter your{'\n'}WhatsApp number</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              We'll send a code to your email to verify your identity. No password needed.
            </Text>
          </View>

          {/* Input card */}
          <View style={[styles.card, { backgroundColor: theme.card }, Shadow.md as any]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>WhatsApp Number</Text>
            <View style={styles.inputRow}>
              {/* Dial code selector — opens BottomSheet, no overlap */}
              <TouchableOpacity
                style={[styles.dialBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => { setPickerOpen(true); haptics.light(); }}
                activeOpacity={0.75}
              >
                <Text style={[styles.dialCode, { color: theme.text }]}>{dialCode.code}</Text>
                <ChevronDown size={14} color={theme.textTertiary} />
              </TouchableOpacity>

              <TextInput
                style={[styles.phoneInput, { color: theme.text, fontFamily: FontFamily.headingBold }]}
                placeholder="800 000 0000"
                placeholderTextColor={theme.textTertiary}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                value={phone}
                onChangeText={setPhone}
                maxLength={15}
                editable={!needsEmail}
                autoFocus
              />
            </View>
            <Text style={[styles.note, { color: theme.textTertiary }]}>
              Make sure this number is active on WhatsApp
            </Text>
          </View>

          {needsEmail && (
            <View style={[styles.card, { backgroundColor: theme.card }, Shadow.md as any]}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
              <View style={styles.inputRow}>
                <Mail size={18} color={theme.textTertiary} />
                <TextInput
                  style={[styles.phoneInput, { color: theme.text, fontFamily: FontFamily.headingBold, fontSize: FontSize.lg }]}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  autoFocus
                />
              </View>
              <Text style={[styles.note, { color: theme.textTertiary }]}>
                We couldn't find an email on this account — enter one to receive your code
              </Text>
            </View>
          )}

          <Button
            title={needsEmail ? 'Send verification code' : 'Continue'}
            onPress={handleSend}
            isLoading={isLoading}
            disabled={!isValid}
            size="xl"
            style={styles.btn}
          />

          <TouchableOpacity style={styles.guestBtn} onPress={() => router.back()}>
            <Text style={[styles.guestText, { color: theme.textTertiary }]}>Continue without an account</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country picker — rendered as BottomSheet, above everything */}
      <BottomSheet
        isVisible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Select Country"
        snapPoint={0.6}
        scrollable
      >
        {DIAL_CODES.map((dc) => (
          <TouchableOpacity
            key={dc.code + dc.country}
            style={[styles.pickerItem, { borderBottomColor: theme.border }]}
            onPress={() => {
              setDialCode(dc);
              setPickerOpen(false);
              haptics.selection();
            }}
          >
            <Text style={[styles.pickerCode, { color: Colors.primary }]}>{dc.code}</Text>
            <Text style={[styles.pickerCountry, { color: theme.text }]}>{dc.country}</Text>
            {dialCode.code === dc.code && (
              <Check size={16} color={Colors.primary} strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        ))}
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing[6], paddingBottom: Spacing[10] },
  close: { marginTop: Spacing[4], marginBottom: Spacing[6], width: 40, height: 40, justifyContent: 'center' },

  header: { marginBottom: Spacing[8], gap: Spacing[4] },
  icon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize['4xl'], letterSpacing: -1, lineHeight: 44 },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, lineHeight: 24 },

  card: { borderRadius: Radius.xl, padding: Spacing[5], gap: Spacing[4], marginBottom: Spacing[5] },
  label: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  dialBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[3],
    borderRadius: Radius.md, borderWidth: 1.5, minWidth: 86,
  },
  dialCode: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.md },
  phoneInput: { flex: 1, fontSize: FontSize['2xl'], paddingVertical: Spacing[3], letterSpacing: 1 },
  note: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },

  btn: {},
  guestBtn: { alignItems: 'center', paddingVertical: Spacing[5] },
  guestText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm },

  pickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[4],
    paddingVertical: Spacing[4], borderBottomWidth: 1,
  },
  pickerCode: { fontFamily: FontFamily.headingBold, fontSize: FontSize.base, minWidth: 52 },
  pickerCountry: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base },
});
