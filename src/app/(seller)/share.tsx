import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Share, View } from 'react-native';
import { Copy, Image as ImageIcon, Link2 } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';
import { Screen, T, cx } from '@/components/ui';
import { BackHeader, Chip } from '@/features/seller/parts';
import { getMe } from '@/api/auth';
import { getProducts } from '@/api/products';
import type { Product } from '@/api/types';
import { formatNaira } from '@/lib/format';
import { shareImage } from '@/lib/shareImage';
import { storeLink, storeUrl } from '@/lib/storefront';

type Mode = 'qr' | 'product';
const modes: [Mode, string][] = [
  ['qr', 'QR code'],
  ['product', 'One product'],
];

function Action({ label, onPress, busy, children }: { label: string; onPress: () => void; busy?: boolean; children: React.ReactNode }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={busy} onPress={onPress} className="flex-1 items-center gap-1.5">
      <View className="h-14 w-14 items-center justify-center rounded-[18px] border border-line bg-surface">
        {busy ? <ActivityIndicator color="#0B6E4F" /> : children}
      </View>
      <T className="text-center font-sans-semibold text-xs">{label}</T>
    </Pressable>
  );
}

export default function ShareStore() {
  const [mode, setMode] = useState<Mode>('qr');
  const [copied, setCopied] = useState(false);
  const [sharingImage, setSharingImage] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [productId, setProductId] = useState<Product['id'] | null>(null);
  const qrRef = useRef<any>(null);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => getProducts() });

  const store = me?.store;
  const storeName = store?.store_name || store?.name || '';
  const username = store?.username || store?.slug || '';
  const product = products.find((p) => p.id === productId) ?? null;

  // What the link buttons share: the store, or the chosen product's page
  const url = username ? (mode === 'product' && product?.slug ? storeUrl(username, product.slug) : storeUrl(username)) : '';
  const shown = username ? (mode === 'product' && product?.slug ? storeLink(username, product.slug) : storeLink(username)) : '';
  const message =
    mode === 'product' && product
      ? `${product.name} – ${formatNaira(product.price_kobo / 100)} at ${storeName}: ${url}`
      : `Shop ${storeName}, now taking orders: ${url}`;

  const shareLink = () => {
    if (!url) return;
    Share.share({ message, url, title: storeName }).catch(() => {});
  };

  const copy = async () => {
    if (!url) return;
    await Clipboard.setStringAsync(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const shareQr = () => {
    if (!qrRef.current || sharingImage) return;
    setNotice(null);
    setSharingImage(true);
    qrRef.current.toDataURL(async (png: string) => {
      try {
        const ok = await shareImage(png, `frontstore-${username}-qr.png`, `${storeName} QR code`);
        if (!ok) {
          setNotice('Image sharing needs the latest app version, so we shared your link instead.');
          shareLink();
        }
      } catch {
        setNotice('Couldn’t share the image. Try again, or share your link.');
      } finally {
        setSharingImage(false);
      }
    });
  };

  return (
    <Screen>
      <BackHeader title="Share your store" fallback="/home" />
      <ScrollView contentContainerClassName="gap-[18px] px-5 pb-8 pt-2">
        <View className="flex-row gap-2">
          {modes.map(([id, label]) => (
            <Chip key={id} label={label} on={mode === id} onPress={() => setMode(id)} />
          ))}
        </View>

        {mode === 'qr' ? (
          <View
            style={{ shadowColor: '#0E1A15', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 16 }, elevation: 10 }}
            className="items-center gap-3.5 self-center rounded-[26px] bg-surface p-[22px]"
          >
            <T className="font-sans-bold text-[11px] uppercase tracking-[1.3px] text-green">Scan to shop</T>
            <T className="font-display text-[24px] tracking-[-0.4px]">{storeName}</T>
            {url ? (
              <QRCode value={url} size={200} color="#0E1A15" backgroundColor="#FFFFFF" quietZone={12} getRef={(c) => (qrRef.current = c)} />
            ) : (
              <View className="h-[224px] w-[224px] items-center justify-center">
                <ActivityIndicator color="#0B6E4F" />
              </View>
            )}
            <T className="font-sans-bold text-xs text-muted-2">{shown}</T>
          </View>
        ) : (
          <View className="gap-2.5">
            <T className="font-sans-bold text-sm">Pick a product to share</T>
            {products.length === 0 ? (
              <T className="text-sm text-muted">Add a product first, then you can share it from here.</T>
            ) : (
              products.slice(0, 30).map((p) => {
                const on = p.id === productId;
                const img = p.image_url || p.images?.[0];
                return (
                  <Pressable
                    key={String(p.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    onPress={() => setProductId(p.id)}
                    className={cx('flex-row items-center gap-3 rounded-[16px] bg-surface p-3', on ? 'border-2 border-green' : 'border border-line')}
                  >
                    <View className="h-12 w-12 overflow-hidden rounded-xl bg-sand">
                      {img ? <Image source={{ uri: img }} className="h-full w-full" resizeMode="cover" /> : null}
                    </View>
                    <View className="flex-1">
                      <T numberOfLines={1} className="font-sans-bold text-[15px]">{p.name}</T>
                      <T className="text-[13px] text-muted">{formatNaira(p.price_kobo / 100)}</T>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        )}

        {notice ? <T className="text-sm text-muted-2">{notice}</T> : null}

        <View className="flex-row gap-2.5">
          {mode === 'qr' ? (
            <Action label="Share QR image" busy={sharingImage} onPress={shareQr}>
              <ImageIcon size={24} color="#0E1A15" strokeWidth={2} />
            </Action>
          ) : null}
          <Action label={mode === 'product' ? 'Share product' : 'Share link'} onPress={shareLink}>
            <Link2 size={24} color="#0E1A15" strokeWidth={2} />
          </Action>
          <Action label={copied ? 'Copied' : 'Copy link'} onPress={copy}>
            <Copy size={22} color="#0E1A15" strokeWidth={2} />
          </Action>
        </View>
        {mode === 'qr' ? (
          <T className="text-center text-xs text-muted">Share the image, then choose “Save image”, WhatsApp Status or Instagram from the list.</T>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
