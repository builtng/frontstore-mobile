import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trash2 } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen, T } from '@/components/ui';
import { Grip, goBack } from '@/features/seller/parts';
import { getProduct, deleteProduct } from '@/api/products';

export default function DeleteProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      const name = product?.name || 'Product';
      router.dismissTo({ pathname: '/products', params: { deleted: name, deletedId: id } });
    },
  });

  const confirm = () => {
    if (submitting) return;
    setSubmitting(true);
    deleteMutation.mutate();
  };

  const keep = () => goBack(`/product/${id}`);
  const name = product?.name || 'Product';

  return (
    <Screen edges={[]}>
      <View style={{ paddingTop: insets.top + 12 }} className="gap-4 px-5" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <T className="font-display text-[32px]">Products</T>
        <View className="h-12 rounded-[14px] border border-line bg-surface" />
        <View className="gap-2.5">
          {[0, 1, 2].map((i) => (
            <View key={i} className="h-[82px] rounded-[18px] border border-line bg-surface" />
          ))}
        </View>
      </View>
      <Pressable accessibilityLabel="Keep product" onPress={keep} className="absolute inset-0 bg-[rgba(14,26,21,0.55)]" />

      <View
        accessibilityRole="alert"
        accessibilityViewIsModal
        accessibilityLabel="Delete product"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }}
        className="absolute bottom-0 left-0 right-0 gap-[18px] rounded-t-[28px] bg-surface px-5 pt-3"
      >
        <Grip />
        <View className="h-14 w-14 items-center justify-center rounded-[18px] bg-[#FBE7E2]">
          <Trash2 size={26} color="#A8321E" strokeWidth={2} />
        </View>
        <View className="gap-2">
          <T className="font-display text-2xl tracking-[-0.24px]">Delete "{name}"?</T>
          <T className="text-[15px] leading-[23px] text-muted-2">
            It will be removed from your store and its product link will stop working. Past orders keep their details.
          </T>
        </View>
        <View className="flex-row items-center gap-3 rounded-[14px] bg-bg p-3.5">
          <View className="h-11 w-11 items-center justify-center rounded-[10px] bg-[#E9A23B]">
            <T className="font-sans-bold text-white">{name[0]}</T>
          </View>
          <View className="flex-1">
            <T className="font-sans-bold text-[15px]">{name}</T>
            <T className="text-[13px] text-muted">In stock</T>
          </View>
        </View>
        <View className="rounded-[14px] border border-dashed border-line-2 px-3.5 py-3">
          <T className="text-sm leading-[21px] text-[#33403A]">
            Just out of stock?{' '}
            <T accessibilityRole="link" onPress={() => router.replace(`/product/${id}`)} className="font-sans-bold text-sm text-green">
              Hide it instead
            </T>{' '}
            - you can bring it back any time.
          </T>
        </View>
        <View className="gap-2.5">
          <Pressable accessibilityRole="button" onPress={confirm} disabled={submitting} className="h-[54px] flex-row items-center justify-center gap-2 rounded-full bg-danger">
            {submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
            <T className="font-sans-bold text-[17px] text-white">{submitting ? 'Deleting...' : 'Delete product'}</T>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={keep} className="h-[54px] items-center justify-center rounded-full bg-cream">
            <T className="font-sans-bold text-base">Keep it</T>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
