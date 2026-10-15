import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Screen, T } from '@/components/ui';
import { BottomBar, Heading, Progress, StepHeader } from '@/features/setup/parts';
import { AiProductFlow, useAiProduct } from '@/features/setup/AiProductFlow';
import { finishDraft, useDraft, toSlug } from '@/features/setup/draft';
import { completeStoreSetup, uploadStoreLogo } from '@/api/store';
import { createProduct } from '@/api/products';
import { getMe } from '@/api/auth';

export default function FirstProduct() {
  const draft = useDraft();
  const flow = useAiProduct();
  const filled = flow.stage === 'filled';
  const ready = filled && flow.product.name.trim().length > 0 && flow.product.price.length > 0;
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFinish = async (withProduct = false) => {
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      // The backend overwrites an existing store on this call, so never run it for one
      if (!draft.setup_token) {
        const me = await getMe();
        if (me?.store) {
          finishDraft();
          router.replace('/home');
          return;
        }
      }

      const { store } = await completeStoreSetup({
        setup_token: draft.setup_token,
        name: draft.owner_name || draft.name || 'Frontstore Merchant',
        store_name: draft.name || 'My Store',
        username: toSlug(draft.name || 'mystore'),
        store_color: draft.color || '#0B6E4F',
        primary_color: draft.color || '#0B6E4F',
        category: draft.category || 'Fashion',
        country_code: draft.country_code || 'NG',
        currency_code: draft.currency_code || 'NGN',
        location: draft.city || draft.country_name || 'Nigeria',
        bank_code: draft.payout?.bankCode,
        bank_name: draft.payout?.bank,
        account_number: draft.payout?.account,
        account_name: draft.payout?.accountName,
      });
      finishDraft({ username: store?.username });

      // The store exists now; anything below failing shouldn't undo that, but the merchant must know
      const problems: string[] = [];
      if (draft.logo_uri) {
        try {
          await uploadStoreLogo(draft.logo_uri);
        } catch (logoErr: any) {
          problems.push(`Your logo didn’t upload (${logoErr.message || 'network error'}). Add it again from Store → Edit.`);
        }
      }

      if (withProduct && ready) {
        try {
          const priceNum = parseFloat(flow.product.price.replace(/[^\d.]/g, '')) || 0;
          await createProduct({
            name: flow.product.name.trim(),
            price_kobo: Math.round(priceNum * 100),
            stock_count: parseInt(flow.product.stock, 10) || 1,
            status: 'live',
            description: flow.product.description || '',
            images: flow.photos.imageUrls,
            category_id: flow.product.categoryId || null,
            sizes: flow.product.sizes,
            colors: flow.product.colours,
          });
        } catch (prodErr: any) {
          problems.push(`“${flow.product.name.trim()}” wasn’t added (${prodErr.message || 'network error'}). Add it again with the + button.`);
        }
      }

      if (problems.length) {
        Alert.alert('Your store is ready, but…', problems.join('\n\n'), [{ text: 'OK', onPress: () => router.replace('/live') }]);
      } else {
        router.replace('/live');
      }
    } catch (err: any) {
      const msg = err.message || 'Could not complete store setup. Please check details and try again.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <StepHeader fallback="/payout" label="Step 5 of 5" right={{ title: 'Skip', onPress: () => handleFinish(false) }} />
        <Progress pct={100} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-3.5 px-5 pt-5 pb-6">
          <Heading title="Add your first product" sub="Snap a photo. Nina AI writes the name, price and description - you just check it." />
          {errorMsg ? (
            <View className="rounded-xl bg-red-100 p-3.5 border border-red-200">
              <T className="text-sm font-sans-medium text-red-800">{errorMsg}</T>
            </View>
          ) : null}
          <AiProductFlow flow={flow} />
        </ScrollView>
        <BottomBar className="border-t border-line bg-bg">
          {ready ? (
            <Button
              title={submitting ? 'Creating store...' : 'Add product and finish'}
              disabled={submitting}
              onPress={() => handleFinish(true)}
              left={submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : undefined}
            />
          ) : (
            <View
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              accessibilityLabel="Add product and finish"
              accessibilityHint={filled ? 'Add a name and price first' : 'Add a photo first'}
              className="h-14 items-center justify-center rounded-full bg-[#BFD3C8]"
            >
              <T className="font-sans-bold text-[17px] text-white">Add product and finish</T>
            </View>
          )}
        </BottomBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
