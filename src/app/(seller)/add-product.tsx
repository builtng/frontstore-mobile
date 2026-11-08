import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, T, cx } from '@/components/ui';
import { BackHeader } from '@/features/seller/parts';
import { AiProductFlow, useAiProduct } from '@/features/setup/AiProductFlow';
import { createProduct } from '@/api/products';
import { queryClient } from '@/api/queryClient';

/** New product: snap a photo, Nina reads it and fills the form, the seller checks and publishes. */
export default function AddProduct() {
  const insets = useSafeAreaInsets();
  const flow = useAiProduct();
  const { stage, product: p, photos } = flow;
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filled = stage === 'filled';
  const priceKobo = Math.round((parseFloat(p.price.replace(/[^\d.]/g, '')) || 0) * 100);
  const ready = filled && !!p.name.trim() && priceKobo > 0 && !photos.uploading;
  // Three steps, as in the design: photo, Nina reading, check and publish.
  const step = filled ? 3 : stage === 'reading' ? 2 : 1;

  const onPublish = async () => {
    if (!ready || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await createProduct({
        name: p.name.trim(),
        price_kobo: priceKobo,
        category_id: p.categoryId || null,
        description: p.description,
        stock_count: parseInt(p.stock, 10) || 1,
        status: 'live',
        images: photos.imageUrls,
        sizes: p.sizes,
        colors: p.colours,
      });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      router.dismissTo('/products');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not publish the product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <BackHeader title="New product" fallback="/products" />
        <View accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 3, now: step }} className="flex-row gap-1.5 px-5">
          {[1, 2, 3].map((k) => <View key={k} className={cx('h-1 flex-1 rounded-full', k <= step ? 'bg-green' : 'bg-line-2')} />)}
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-3.5 px-5 pb-6 pt-4" showsVerticalScrollIndicator={false}>
          {errorMsg ? (
            <View className="rounded-2xl border border-danger/20 bg-danger-bg p-3.5">
              <T className="font-sans-medium text-sm text-danger">{errorMsg}</T>
            </View>
          ) : null}
          <AiProductFlow flow={flow} />
        </ScrollView>
        {filled ? (
          <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }} className="px-5 pt-3">
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !ready || submitting }}
              accessibilityHint={ready ? undefined : 'Add a name and price first'}
              disabled={!ready || submitting}
              onPress={onPublish}
              className={cx('h-[54px] flex-row items-center justify-center gap-2 rounded-2xl', ready ? 'bg-green' : 'bg-disabled')}
            >
              {submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
              <T className="font-sans-bold text-base text-white">{submitting ? 'Publishing…' : 'Publish'}</T>
            </Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}
