import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Store, AtSign, FileText } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

const schema = z.object({
  storeName: z.string().min(2, 'Store name must be at least 2 characters').max(50),
  storeUsername: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
  storeDescription: z.string().max(200).optional(),
});

type FormData = z.infer<typeof schema>;

export default function StoreSetupScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { storeName, storeUsername, storeDescription, setStoreData } = useOnboardingStore();
  const previewOpacity = useSharedValue(0);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeName: storeName,
      storeUsername: storeUsername,
      storeDescription: storeDescription,
    },
  });

  const watchedName = watch('storeName');
  const watchedUsername = watch('storeUsername');

  useEffect(() => {
    if (watchedName) {
      const slug = watchedName
        .toLowerCase()
        .replace(/_/g, '-')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 30);
      setValue('storeUsername', slug);
    }
  }, [watchedName]);

  useEffect(() => {
    previewOpacity.value = withTiming(watchedUsername ? 1 : 0, { duration: 300 });
  }, [watchedUsername]);

  const previewStyle = useAnimatedStyle(() => ({ opacity: previewOpacity.value }));

  const onSubmit = (data: FormData) => {
    setStoreData({
      storeName: data.storeName,
      storeUsername: data.storeUsername,
      storeDescription: data.storeDescription ?? '',
    });
    router.push('/(auth)/upload-logo');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
        <View style={[styles.progressFill, { width: '40%' }]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <ArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.step, { color: Colors.primary }]}>Step 2 of 8</Text>
            <Text style={[styles.title, { color: theme.text }]}>Name your store</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              This is how customers will find and remember you
            </Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="storeName"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Store Name"
                  placeholder="e.g. Chidi's Fashion Hub"
                  autoCapitalize="words"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.storeName?.message}
                  leftIcon={<Store size={18} color={theme.textTertiary} />}
                />
              )}
            />

            <Controller
              control={control}
              name="storeUsername"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Store Username"
                  placeholder="your-store-name"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={(t) => onChange(t.toLowerCase().replace(/_/g, '-').replace(/[^a-z0-9-]/g, ''))}
                  onBlur={onBlur}
                  error={errors.storeUsername?.message}
                  hint="Only lowercase letters, numbers, and hyphens"
                  leftIcon={<AtSign size={18} color={theme.textTertiary} />}
                />
              )}
            />

            {/* Live preview */}
            <Animated.View style={[styles.preview, { backgroundColor: Colors.primaryDim, borderRadius: Radius.lg }, previewStyle]}>
              <Text style={[styles.previewLabel, { color: Colors.primary }]}>Your store URL</Text>
              <Text style={[styles.previewUrl, { color: Colors.primaryLight }]}>
                frontstore.ng/<Text style={{ fontFamily: FontFamily.headingBold }}>{watchedUsername || 'your-store'}</Text>
              </Text>
            </Animated.View>

            <Controller
              control={control}
              name="storeDescription"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Store Description"
                  placeholder="Briefly describe what you sell..."
                  multiline
                  numberOfLines={3}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.storeDescription?.message}
                  optional
                  leftIcon={<FileText size={18} color={theme.textTertiary} />}
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                />
              )}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <Button
          title="Continue"
          onPress={handleSubmit(onSubmit)}
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
  flex: { flex: 1 },
  progressTrack: { height: 3 },
  progressFill: { height: 3, backgroundColor: Colors.primary, borderRadius: 2 },
  scroll: { paddingHorizontal: Spacing[6], paddingBottom: Spacing[4] },
  back: { marginTop: Spacing[4], marginBottom: Spacing[6], width: 40, height: 40, justifyContent: 'center' },
  header: { marginBottom: Spacing[7] },
  step: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, marginBottom: Spacing[2] },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], letterSpacing: -0.8, marginBottom: Spacing[2] },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, lineHeight: 24 },
  form: { gap: 0 },
  preview: {
    padding: Spacing[4],
    marginBottom: Spacing[5],
    marginTop: -Spacing[2],
  },
  previewLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, marginBottom: 4 },
  previewUrl: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base },
  footer: {
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[5],
  },
});
