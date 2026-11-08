import { useState } from 'react';
import { Pressable, Share as RNShare, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ban, Check, Copy, CopyPlus, EyeOff, Pencil, Share, Trash2, type LucideIcon } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton, T, cx } from '@/components/ui';
import { formatNaira } from '@/lib/format';
import { Grip, goBack } from '@/features/seller/parts';
import { createProduct, updateProduct } from '@/api/products';
import { useSellerProduct } from '@/features/products/useSellerProduct';
import { ProductImage, productPhoto } from '@/features/products/ProductImage';
import { getMe } from '@/api/auth';

function Row({ Icon, label, onPress, danger, className }: { Icon: LucideIcon; label: string; onPress: () => void; danger?: boolean; className?: string }) {
  const color = danger ? '#9A2C14' : '#0E1A15';
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className={cx('min-h-[52px] flex-row items-center gap-3.5 px-1.5 py-3.5', className)}>
      <Icon size={20} color={color} strokeWidth={2} />
      <T style={{ color }} className="font-sans-bold text-base">{label}</T>
    </Pressable>
  );
}

export default function ProductActions() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  const { data: product } = useSellerProduct(id);

  const updateMutation = useMutation({
    mutationFn: (patch: any) => updateProduct(id!, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
  });

  const close = () => goBack('/products');

  const name = product?.name || '';
  const priceKobo = product?.price_kobo ?? 0;
  const isHidden = product?.status === 'hidden';
  const isOut = (product?.stock_count ?? 10) === 0;

  const storeSlug = me?.store?.username || me?.store?.slug || 'store';
  const productSlug = product?.slug || id;
  const productUrl = (product as any)?.public_url || `https://frontstore.app/${storeSlug}/${productSlug}`;

  const shareProduct = () => {
    RNShare.share({
      message: `${name}: ${productUrl}`,
      url: productUrl,
      title: name,
    }).catch(() => {});
  };

  const copyProductLink = async () => {
    await Clipboard.setStringAsync(productUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      close();
    }, 1200);
  };

  // Sold out is one tap. Back in stock opens the editor so the seller enters the real count.
  const toggleSoldOut = () => {
    if (isOut) router.replace(`/product/${id}/edit`);
    else updateMutation.mutate({ stock_count: 0 });
  };

  // A hidden copy with the same photos, price, sizes and colours, opened in the editor to rename.
  const duplicate = useMutation({
    mutationFn: () => createProduct({
      name: `${name} (copy)`,
      price_kobo: priceKobo,
      compare_at_price_kobo: product?.compare_at_price_kobo ?? null,
      description: product?.description ?? '',
      images: product?.images ?? [],
      stock_count: product?.stock_count ?? 0,
      sizes: product?.sizes ?? [],
      colors: product?.colors ?? [],
      category_id: product?.category_id ?? null,
      status: 'hidden',
    }),
    onSuccess: (created: any) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      const newId = created?.id ?? created?.data?.id;
      if (newId) router.replace(`/product/${newId}/edit`);
      else close();
    },
  });

  const toggleHide = () => {
    updateMutation.mutate({ status: isHidden ? 'live' : 'hidden' });
  };

  return (
    <View className="flex-1 justify-end">
      <Stack.Screen options={{ contentStyle: { backgroundColor: 'transparent' } }} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close menu"
        onPress={close}
        className="absolute inset-0 bg-[rgba(14,26,21,0.45)]"
      />
      <View
        accessibilityViewIsModal
        accessibilityLabel="Product options"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }}
        className="gap-1.5 rounded-t-[28px] bg-surface px-4 pt-2.5"
      >
        <Grip className="mb-2" />
        <View className="flex-row items-center gap-3 border-b border-line px-1 pb-3.5 pt-1">
          <ProductImage uri={productPhoto(product)} name={name} className="h-[52px] w-[52px] rounded-xl" />
          <View className="flex-1 gap-0.5">
            {product ? (
              <>
                <T className="font-sans-bold text-base">{name}</T>
                    <T className="text-[13px] text-muted">{formatNaira(priceKobo / 100)} · {isHidden ? 'hidden' : isOut ? 'sold out' : (product?.stock_count ?? 0) <= 3 ? `only ${product?.stock_count} left` : `${product?.stock_count} in stock`}</T>
              </>
            ) : (
              <>
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="mt-1.5 h-3.5 w-2/5" />
              </>
            )}
          </View>
        </View>
        <Row Icon={Pencil} label="Edit product" onPress={() => router.replace(`/product/${id}/edit`)} />
        <Row Icon={Share} label="Share this product" onPress={shareProduct} />
        <Row Icon={copied ? Check : Copy} label={copied ? 'Link copied!' : 'Copy product link'} onPress={copyProductLink} />
        <Row Icon={Ban} label={isOut ? 'Mark as in stock' : 'Mark as sold out'} onPress={toggleSoldOut} />
        <Row Icon={EyeOff} label={isHidden ? 'Show on store' : 'Hide from store'} onPress={toggleHide} />
        <Row Icon={CopyPlus} label={duplicate.isPending ? 'Duplicating…' : 'Duplicate'} onPress={() => !duplicate.isPending && product && duplicate.mutate()} />
        {duplicate.error || updateMutation.error ? <T className="px-1.5 text-sm text-danger">That didn’t save. Check your connection and try again.</T> : null}
        <Row Icon={Trash2} label="Delete" danger className="border-t border-line" onPress={() => router.replace(`/product/${id}/delete`)} />
        <Pressable accessibilityRole="button" onPress={close} className="mt-1.5 h-[54px] items-center justify-center rounded-2xl border-[1.5px] border-line bg-surface">
          <T className="font-sans-bold text-base">Cancel</T>
        </Pressable>
      </View>
    </View>
  );
}
