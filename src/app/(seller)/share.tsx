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

  const brand = store?.primary_color || '#0B6E4F';
  const tiles = live.slice(0, 4);
  const place = store?.location || '';

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
          // A small copy of the store page: its colour, logo, name and real products.
          <View
            style={{ shadowColor: '#0E1A15', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 18 }, elevation: 12 }}
            className="w-[268px] self-center overflow-hidden rounded-[26px] bg-[#F6F3EC]"
          >
            <View style={{ backgroundColor: brand }} className="h-[54px]" />
            <View className="-mt-8 gap-1 px-4">
              <View className="self-start rounded-[18px] border-[3px] border-[#F6F3EC]">
                <Avatar initial={storeName[0] || ''} color={brand} uri={store?.logo_url} size={56} radius={15} fontSize={22} />
              </View>
              <T numberOfLines={1} className="font-display text-[19px] tracking-[-0.3px] text-ink">{storeName}</T>
              <T numberOfLines={1} className="text-[12px] text-muted">
                {mode === 'qr' ? 'Scan to shop' : place ? `${place} · Now taking orders` : 'Now taking orders'}
              </T>
            </View>

            <View className="h-[232px] px-4 pt-3">
              {mode === 'qr' ? (
                <View className="flex-1 items-center justify-center">
                  <View className="rounded-2xl bg-white p-3">
                    <QRCode value={storeUrl} size={168} color="#0E1A15" />
                  </View>
                </View>
              ) : mode === 'product' && product ? (
                <View className="flex-1 overflow-hidden rounded-2xl bg-white">
                  <ProductImage uri={productPhoto(product)} name={product.name} className="flex-1" textClassName="text-5xl" />
                  <View className="gap-0.5 p-3">
                    <T numberOfLines={1} className="font-sans-bold text-[14px] text-ink">{product.name}</T>
                    <T className="font-sans-bold text-[14px]" style={{ color: brand }}>{formatNaira(product.price_kobo / 100)}</T>
                  </View>
                </View>
              ) : tiles.length ? (
                <View className="flex-1 flex-row flex-wrap content-start gap-2">
                  {tiles.map((p) => (
                    <View key={p.id} className="w-[114px] overflow-hidden rounded-xl bg-white">
                      <ProductImage uri={productPhoto(p)} name={p.name} className="h-[70px] w-full" />
                      <View className="px-2 py-1.5">
                        <T numberOfLines={1} className="font-sans-bold text-[11px] text-ink">{p.name}</T>
                        <T className="font-sans-bold text-[11px]" style={{ color: brand }}>{formatNaira(p.price_kobo / 100)}</T>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="flex-1 items-center justify-center gap-2 rounded-2xl bg-white">
                  <Avatar initial={storeName[0] || ''} color={brand} uri={store?.logo_url} size={84} radius={22} fontSize={34} />
                  <T className="text-[12px] text-muted">New products coming soon</T>
                </View>
              )}
            </View>

            <View className="p-4">
              <View style={{ backgroundColor: brand }} className="rounded-full px-3 py-2.5">
                <T numberOfLines={1} className="text-center font-sans-bold text-xs text-white">Shop at frontstore.app/{username}</T>
              </View>
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
