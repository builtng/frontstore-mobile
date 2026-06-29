import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Store, AtSign, ChevronRight, Check } from 'lucide-react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay,
} from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { authApi } from '@/services/authApi';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

const BUSINESS_TYPES = [
  { value: 'fashion', label: 'Fashion & Apparel' },
  { value: 'food', label: 'Food & Beverage' },
  { value: 'beauty', label: 'Beauty & Wellness' },
  { value: 'electronics', label: 'Electronics & Gadgets' },
  { value: 'physical', label: 'Physical Products' },
  { value: 'digital', label: 'Digital Products' },
  { value: 'services', label: 'Services' },
  { value: 'creator', label: 'Creator & Media' },
  { value: 'barber-shop', label: 'Barbershop' },
  { value: 'home-services', label: 'Home Services' },
  { value: 'auto-repair', label: 'Auto Repair' },
  { value: 'cleaning-service', label: 'Cleaning Service' },
  { value: 'event-services', label: 'Events & Catering' },
  { value: 'other', label: 'Other' },
] as const;

const schema = z.object({
  name: z.string().min(2, 'Your name must be at least 2 characters'),
  store_name: z.string().min(2, 'Business name must be at least 2 characters').max(100),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
});

type FormData = z.infer<typeof schema>;

export default function SetupScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const toast = useToast();
  const haptics = useHaptics();
  const setAuth = useAuthStore((s) => s.setAuth);
  const params = useLocalSearchParams<{ setup_token: string; phone: string }>();

  const [businessType, setBusinessType] = useState('physical');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(20);

  useEffect(() => {
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 450 }));
    headerY.value = withDelay(100, withSpring(0, { damping: 16 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const watchedName = watch('store_name');

  useEffect(() => {
    if (watchedName) {
      const slug = watchedName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 30);
      setValue('username', slug);
    }
  }, [watchedName]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    haptics.light();
    try {
      const response = await authApi.completeSetup({
        setup_token: params.setup_token,
        name: data.name,
        store_name: data.store_name,
        username: data.username,
        business_persona: businessType,
      });
      await setAuth(response.data!.user, response.token!);
      haptics.success();
      router.replace('/(auth)/success');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Setup failed. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedType = BUSINESS_TYPES.find((t) => t.value === businessType);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
        <View style={styles.progressFill} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.header, headerStyle]}>
            <Text style={[styles.step, { color: Colors.primary }]}>Almost done</Text>
            <Text style={[styles.title, { color: theme.text }]}>Set up your store</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Your store will be live in seconds. You can change all this later.
            </Text>
          </Animated.View>

          {/* Name */}
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Your Full Name"
                placeholder="e.g. Chidi Emmanuel"
                autoCapitalize="words"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                leftIcon={<User size={18} color={theme.textTertiary} />}
              />
            )}
          />

          {/* Business name */}
          <Controller
            control={control}
            name="store_name"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Business / Store Name"
                placeholder="e.g. Chidi's Fashion Hub"
                autoCapitalize="words"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.store_name?.message}
                leftIcon={<Store size={18} color={theme.textTertiary} />}
              />
            )}
          />

          {/* Username */}
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Store Username"
                placeholder="your-store-name"
                autoCapitalize="none"
                value={value}
                onChangeText={(t) => onChange(t.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                onBlur={onBlur}
                error={errors.username?.message}
                hint="frontstore.app/your-username"
                leftIcon={<AtSign size={18} color={theme.textTertiary} />}
              />
            )}
          />

          {/* Business type */}
          <View style={styles.typeSection}>
            <Text style={[styles.typeLabel, { color: theme.textSecondary }]}>Business Type</Text>
            <TouchableOpacity
              style={[styles.typeBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setShowTypePicker(!showTypePicker)}
            >
              <Text style={[styles.typeBtnText, { color: theme.text }]}>
                {selectedType?.label ?? 'Select type'}
              </Text>
              <ChevronRight size={18} color={theme.textTertiary} style={{ transform: [{ rotate: showTypePicker ? '90deg' : '0deg' }] }} />
            </TouchableOpacity>

            {showTypePicker && (
              <View style={[styles.typePicker, { backgroundColor: theme.surface, borderColor: theme.border }, Shadow.lg as any]}>
                {BUSINESS_TYPES.map((bt) => (
                  <TouchableOpacity
                    key={bt.value}
                    style={[
                      styles.typeItem,
                      { borderBottomColor: theme.border },
                      bt.value === businessType && { backgroundColor: Colors.primaryDim },
                    ]}
                    onPress={() => {
                      setBusinessType(bt.value);
                      setShowTypePicker(false);
                      haptics.selection();
                    }}
                  >
                    <Text style={[styles.typeItemText, { color: bt.value === businessType ? Colors.primary : theme.text }]}>
                      {bt.label}
                    </Text>
                    {bt.value === businessType && <Check size={16} color={Colors.primary} strokeWidth={2.5} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Button
            title="Create My Store"
            onPress={handleSubmit(onSubmit)}
            isLoading={isLoading}
            size="xl"
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  progressTrack: { height: 3 },
  progressFill: { height: 3, width: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  scroll: { paddingHorizontal: Spacing[6], paddingBottom: Spacing[10] },

  header: { paddingTop: Spacing[7], marginBottom: Spacing[7], gap: Spacing[2] },
  step: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize['4xl'], letterSpacing: -1 },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, lineHeight: 24 },

  typeSection: { marginBottom: Spacing[5], position: 'relative' },
  typeLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, marginBottom: Spacing[2] },
  typeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing[4], borderRadius: Radius.md, borderWidth: 1.5, minHeight: 52,
  },
  typeBtnText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base },
  typePicker: {
    position: 'absolute', top: 80, left: 0, right: 0,
    borderRadius: Radius.lg, borderWidth: 1, zIndex: 100,
    maxHeight: 280, overflow: 'hidden',
  },
  typeItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[4],
    borderBottomWidth: 1,
  },
  typeItemText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.base },

  submitBtn: { marginTop: Spacing[6] },
});
