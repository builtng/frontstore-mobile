import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, TouchableOpacity, ScrollView, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming,
} from 'react-native-reanimated';
import { ArrowLeft, Phone, Mail, ChevronDown, Check, MessageSquare } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useToast } from '@/components/ui/Toast';
import { authApi } from '@/services/authApi';
import { useOnboardingStore } from '@/stores/onboardingStore';
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

export default function OtpLoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const toast = useToast();
  const haptics = useHaptics();
  const setUserData = useOnboardingStore((s) => s.setUserData);

  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [dialCode, setDialCode] = useState(DIAL_CODES[0]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [secondaryEmail, setSecondaryEmail] = useState('');

  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(24);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.96);

  React.useEffect(() => {
    titleOpacity.value = withDelay(150, withTiming(1, { duration: 450 }));
    titleY.value = withDelay(150, withSpring(0, { damping: 16 }));
    cardOpacity.value = withDelay(350, withTiming(1, { duration: 400 }));
    cardScale.value = withDelay(350, withSpring(1, { damping: 16 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const cleanPhone = phone.replace(/\D/g, '');
  const isValidPhone = cleanPhone.length >= 7;
  const cleanEmail = email.trim().toLowerCase();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
  const isValidSecondaryEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(secondaryEmail.trim());

  const isValid = method === 'phone'
    ? (isValidPhone && (!needsEmail || isValidSecondaryEmail))
    : isValidEmail;

  const handleSend = async () => {
    if (method === 'phone' && !isValidPhone) return;
    if (method === 'email' && !isValidEmail) return;
    if (method === 'phone' && needsEmail && !isValidSecondaryEmail) return;

    setIsLoading(true);
    haptics.light();

    try {
      if (method === 'phone') {
        const result = await authApi.sendOtp({
          phone_number: cleanPhone,
          country_dial_code: dialCode.code,
          email: needsEmail ? secondaryEmail.trim() : undefined,
        });

        if (result.needs_email) {
          setNeedsEmail(true);
          return;
        }

        setUserData({ phone: result.phone, email: result.email ?? '' });
        router.push({
          pathname: '/(auth)/verify',
          params: {
            method: 'phone',
            phone: cleanPhone,
            dial_code: dialCode.code,
            formatted: result.phone,
            email: result.email ?? '',
            is_new_user: result.is_new_user ? '1' : '0',
          },
        });
      } else {
        const result = await authApi.sendEmailOtp({
          email: cleanEmail,
        });

        setUserData({ email: cleanEmail, phone: '' });
        router.push({
          pathname: '/(auth)/verify',
          params: {
            method: 'email',
            email: cleanEmail,
            is_new_user: result.is_new_user ? '1' : '0',
          },
        });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to send verification code. Please check your details.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMethod = (newMethod: 'phone' | 'email') => {
    setMethod(newMethod);
    setNeedsEmail(false);
    setSecondaryEmail('');
    haptics.selection();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <ArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>

          {/* Header */}
          <Animated.View style={[styles.header, titleStyle]}>
            <View style={[styles.iconWrap, { backgroundColor: Colors.primary + '20' }]}>
              {method === 'phone' ? (
                <Phone size={28} color={Colors.primary} strokeWidth={2} />
              ) : (
                <Mail size={28} color={Colors.primary} strokeWidth={2} />
              )}
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              {method === 'phone' ? 'Enter WhatsApp\nnumber' : 'Enter email\naddress'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              We'll send a 6-digit verification code to log you in. No password required.
            </Text>
          </Animated.View>

          {/* Tab Switcher (just like the web app) */}
          <View style={[styles.switcherContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity
              style={[
                styles.switcherBtn,
                method === 'phone' && { backgroundColor: theme.background, borderColor: theme.border },
              ]}
              onPress={() => toggleMethod('phone')}
              activeOpacity={0.8}
            >
              <MessageSquare size={14} color={method === 'phone' ? Colors.primary : theme.textSecondary} />
              <Text style={[styles.switcherLabel, { color: method === 'phone' ? Colors.primary : theme.textSecondary }]}>
                WhatsApp Phone
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.switcherBtn,
                method === 'email' && { backgroundColor: theme.background, borderColor: theme.border },
              ]}
              onPress={() => toggleMethod('email')}
              activeOpacity={0.8}
            >
              <Mail size={14} color={method === 'email' ? Colors.primary : theme.textSecondary} />
              <Text style={[styles.switcherLabel, { color: method === 'email' ? Colors.primary : theme.textSecondary }]}>
                Email Address
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dynamic input card based on chosen method */}
          <Animated.View style={[styles.card, { backgroundColor: theme.card }, Shadow.md as any, cardStyle]}>
            {method === 'phone' ? (
              <>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>WhatsApp Number</Text>
                <View style={styles.inputRow}>
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
              </>
            ) : (
              <>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Email Address</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.emailInput, { color: theme.text, fontFamily: FontFamily.bodySemiBold }]}
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
                  Make sure this email is active and accessible on this device
                </Text>
              </>
            )}
          </Animated.View>

          {/* Prompt for secondary email (only in phone flow if backend requires email validation) */}
          {method === 'phone' && needsEmail && (
            <Animated.View style={[styles.card, { backgroundColor: theme.card }, Shadow.md as any, cardStyle]}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Email Address</Text>
              <View style={styles.inputRow}>
                <Mail size={18} color={theme.textTertiary} />
                <TextInput
                  style={[styles.emailInput, { color: theme.text, fontFamily: FontFamily.bodySemiBold }]}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={secondaryEmail}
                  onChangeText={setSecondaryEmail}
                  autoFocus
                />
              </View>
              <Text style={[styles.note, { color: theme.textTertiary }]}>
                We couldn't find an email on this account — enter one to receive your verification code
              </Text>
            </Animated.View>
          )}

          <Button
            title={needsEmail ? 'Send verification code' : 'Continue'}
            onPress={handleSend}
            isLoading={isLoading}
            disabled={!isValid}
            size="xl"
            style={styles.sendBtn}
          />

          <Text style={[styles.terms, { color: theme.textTertiary }]}>
            By continuing you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Dial code Picker Sheet */}
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
  back: { marginTop: Spacing[4], marginBottom: Spacing[6], width: 40, height: 40, justifyContent: 'center' },

  header: { marginBottom: Spacing[6], gap: Spacing[4] },
  iconWrap: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize['4xl'], letterSpacing: -1, lineHeight: 44 },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, lineHeight: 24 },

  // Switcher
  switcherContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing[6],
    gap: 4,
  },
  switcherBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[2] + 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  switcherLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
  },

  card: { borderRadius: Radius.xl, padding: Spacing[5], gap: Spacing[4], marginBottom: Spacing[5] },
  inputLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  dialBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[3],
    borderRadius: Radius.md, borderWidth: 1.5, minWidth: 86,
  },
  dialCode: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.md },
  phoneInput: { flex: 1, fontSize: FontSize['2xl'], paddingVertical: Spacing[3], letterSpacing: 1 },
  emailInput: { flex: 1, fontSize: FontSize.lg, paddingVertical: Spacing[3], letterSpacing: 0.2 },
  note: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },

  sendBtn: {},
  terms: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, textAlign: 'center', marginTop: Spacing[5], lineHeight: 18 },

  pickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[4],
    paddingVertical: Spacing[4], borderBottomWidth: 1,
  },
  pickerCode: { fontFamily: FontFamily.headingBold, fontSize: FontSize.base, minWidth: 52 },
  pickerCountry: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base },
});
