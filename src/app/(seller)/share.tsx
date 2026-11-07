import { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Share, View } from 'react-native';
import { Copy, Share2 } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';
import { EmptyState, Screen, Skeleton, T, cx } from '@/components/ui';
import { BackHeader, Chip } from '@/features/seller/parts';
import { getMe } from '@/api/auth';
import { getStore } from '@/api/store';
import { getProducts } from '@/api/products';
import { ProductImage, productPhoto } from '@/features/products/ProductImage';
import { Avatar } from '@/features/buyer/parts';
import { formatNaira } from '@/lib/format';
import { WhatsAppIcon } from '@/features/setup/parts';
import type { Product } from '@/api/types';

type Mode = 'status' | 'qr' | 'product';
const modes: Array<[Mode, string]> = [
  ['status', 'Status card'],
  ['qr', 'QR code'],
  ['product', 'One product'],
];

function Action({ label, onPress, dark, children }: { label: string; onPress: () => void; dark?: boolean; children: React.ReactNode }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} className="flex-1 items-center gap-1.5">
      <View className={cx('h-14 w-14 items-center justify-center rounded-[18px]', dark ? 'bg-[#25D366]' : 'border border-line-2 bg-surface')}>
        {children}
      </View>
      <T className="text-center font-sans-semibold text-xs">{label}</T>
    </Pressable>
  );
}

export default function ShareStore() {
  const [mode, setMode] = useState<Mode>('status');
  const [copied, setCopied] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  const { data: me, isLoading: meLoading } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const { data: sellerStore } = useQuery({ queryKey: ['seller-store'], queryFn: getStore });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => getProducts() });

  const store: any = sellerStore ?? me?.store;
  const storeName = store?.store_name || store?.name || '';
  const username = store?.username || store?.slug || '';
  const storeUrl = `https://frontstore.app/${username}`;
  const live = products.filter((p) => p.status !== 'hidden');
  const product: Product | undefined = live.find((p) => String(p.id) === picked) ?? live[0];
  const productUrl = product ? (product as any).public_url || `${storeUrl}/${product.slug || product.id}` : storeUrl;

  const url = mode === 'product' && product ? productUrl : storeUrl;
  const message = mode === 'product' && product
    ? `${product.name}, ${formatNaira(product.price_kobo / 100)} at ${storeName}. Order here: ${url}`
    : `Shop ${storeName}. Now taking orders: ${url}`;

  // The link is already in the message, so it isn't passed again (iPhone would show it twice).
  const shareAnywhere = () => Share.share({ message, title: storeName }).catch(() => {});
  const shareWhatsApp = async () => {
    const wa = `whatsapp://send?text=${encodeURIComponent(message)}`;
    try {
      if (Platform.OS !== 'web' && (await Linking.canOpenURL(wa))) return void (await Linking.openURL(wa));
    } catch {}
    shareAnywhere();
  };
  const copy = async () => {
    await Clipboard.setStringAsync(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (meLoading && !store) {
    return (
      <Screen>
        <BackHeader title="Share your store" fallback="/home" />
        <View className="gap-[18px] px-5 pt-2">
          <Skeleton className="h-10 w-3/4 rounded-full" />
          <Skeleton className="h-[400px] w-[230px] self-center rounded-[26px]" />
          <Skeleton className="h-[52px] rounded-[14px]" />
        </View>
      </Screen>
    );
  }

  const photos = live.map((p) => productPhoto(p)).filter(Boolean).slice(0, 4) as string[];

  return (
    <Screen>
      <BackHeader title="Share your store" fallback="/home" />
      <ScrollView contentContainerClassName="gap-[18px] px-5 pb-8 pt-2">
        <View className="flex-row gap-2">
          {modes.map(([id, label]) => (
            <Chip key={id} label={label} on={mode === id} onPress={() => setMode(id)} />
          ))}
        </View>

        {mode === 'product' && !product ? (
          <EmptyState title="No products to share yet" sub="Add a product and you can share its own link here." action="Add a product" href="/add-product" />
        ) : (
          <View
            style={{ shadowColor: '#0E1A15', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 24 }, elevation: 12 }}
            className="h-[400px] w-[230px] gap-3.5 self-center rounded-[26px] bg-deep p-[22px]"
          >
            <T className="font-sans-bold text-[11px] uppercase tracking-[1.3px] text-saffron">
              {mode === 'qr' ? 'Scan to shop' : 'Now taking orders'}
            </T>
            <T numberOfLines={2} className="font-display text-[26px] leading-[28px] tracking-[-0.6px] text-bg">
              {mode === 'product' && product ? product.name : storeName}
            </T>

            {mode === 'qr' ? (
              <View className="flex-1 items-center justify-center">
                <View className="rounded-2xl bg-white p-3">
                  <QRCode value={storeUrl} size={150} />
                </View>
              </View>
            ) : mode === 'product' && product ? (
              <View className="flex-1 gap-2">
                <ProductImage uri={productPhoto(product)} name={product.name} className="flex-1 rounded-xl" textClassName="text-5xl" />
                <T className="font-sans-bold text-[17px] text-saffron">{formatNaira(product.price_kobo / 100)}</T>
              </View>
            ) : photos.length ? (
              <View className="flex-1 gap-2">
                {[0, 2].map((row) => (
                  <View key={row} className="flex-1 flex-row gap-2">
                    {[row, row + 1].map((i) =>
                      photos[i] ? (
                        <ProductImage key={i} uri={photos[i]} className="flex-1 rounded-xl" />
                      ) : (
                        <View key={i} className="flex-1 rounded-xl bg-white/10" />
                      ),
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View className="flex-1 items-center justify-center">
                <Avatar initial={storeName[0] || ''} color={store?.primary_color || '#0B6E4F'} uri={store?.logo_url} size={110} radius={28} fontSize={44} />
              </View>
            )}

            <View className="rounded-xl bg-bg px-3 py-2.5">
              <T numberOfLines={1} className="text-center font-sans-bold text-xs">frontstore.app/{username}</T>
            </View>
          </View>
        )}

        {mode === 'product' && live.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {live.slice(0, 20).map((p) => {
              const on = String(p.id) === String(product?.id);
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Share ${p.name}`}
                  accessibilityState={{ selected: on }}
                  onPress={() => setPicked(String(p.id))}
                  className={cx('rounded-[14px] p-1', on ? 'border-2 border-ink' : 'border border-line')}
                >
                  <ProductImage uri={productPhoto(p)} name={p.name} className="h-14 w-14 rounded-[10px]" />
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {mode !== 'product' || product ? (
          <>
            <View className="h-[52px] flex-row items-center justify-between rounded-[14px] border border-line bg-surface pl-4 pr-1.5">
              <T numberOfLines={1} className="mr-2 flex-1 font-sans-semibold">{url.replace('https://', '')}</T>
              <Pressable accessibilityRole="button" accessibilityLabel="Copy link" onPress={copy} className="h-10 justify-center rounded-[10px] bg-ink px-4">
                <T className="font-sans-bold text-sm text-bg">{copied ? 'Copied' : 'Copy'}</T>
              </Pressable>
            </View>

            <View className="flex-row gap-2.5">
              <Action label="WhatsApp" dark onPress={shareWhatsApp}>
                <WhatsAppIcon size={26} color="#FFFFFF" />
              </Action>
              <Action label="Share to any app" onPress={shareAnywhere}>
                <Share2 size={22} color="#0E1A15" strokeWidth={2} />
              </Action>
              <Action label={copied ? 'Copied' : 'Copy link'} onPress={copy}>
                <Copy size={22} color="#0E1A15" strokeWidth={2} />
              </Action>
            </View>
            {mode === 'qr' ? (
              <T className="text-center text-[13px] text-muted">Print it for your stall or packaging. Take a screenshot to save it.</T>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
