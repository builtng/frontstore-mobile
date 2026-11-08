import { useState } from 'react';
import { Linking, Pressable, ScrollView, Share, View } from 'react-native';
import { router } from 'expo-router';
import { Share2 } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';
import { Screen, Skeleton, T } from '@/components/ui';
import { BackHeader } from '@/features/seller/parts';
import { FacebookIcon, InstagramLogo, TikTokLogo, WhatsAppIcon } from '@/features/setup/parts';
import { getMe } from '@/api/auth';
import { getStore } from '@/api/store';

function Action({ label, bg, onPress, border, children }: { label: string; bg: string; onPress: () => void; border?: boolean; children: React.ReactNode }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} className="w-1/5 items-center gap-1.5">
      <View style={{ backgroundColor: bg }} className={border ? 'h-12 w-12 items-center justify-center rounded-2xl border border-line-2' : 'h-12 w-12 items-center justify-center rounded-2xl'}>
        {children}
      </View>
      <T numberOfLines={2} className="text-center font-sans-semibold text-[11px]">{label}</T>
    </Pressable>
  );
}

/** Open an app, or its website if the app isn't installed. */
async function openApp(appUrl: string, webUrl: string) {
  try {
    await Linking.openURL(appUrl);
  } catch {
    await Linking.openURL(webUrl).catch(() => {});
  }
}

export default function ShareStore() {
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const { data: me, isLoading } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const { data: sellerStore } = useQuery({ queryKey: ['seller-store'], queryFn: getStore });

  const store: any = sellerStore ?? me?.store;
  const storeName = store?.store_name || store?.name || '';
  const username = store?.username || store?.slug || '';
  const url = `https://frontstore.app/${username}`;
  const message = `Shop ${storeName}. Now taking orders: ${url}`;

  const copy = async () => {
    await Clipboard.setStringAsync(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // The link is already in the message, so it isn't passed again (iPhone would show it twice).
  const shareAnywhere = () => Share.share({ message, title: storeName }).catch(() => {});
  const whatsapp = () => openApp(`whatsapp://send?text=${encodeURIComponent(message)}`, `https://wa.me/?text=${encodeURIComponent(message)}`);
  const facebook = () => Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`).catch(() => {});
  // Instagram and TikTok can't take a link from another app: copy it, then open the app to paste.
  const pasteInto = async (app: string, appUrl: string, webUrl: string) => {
    await Clipboard.setStringAsync(url);
    setNote(`Link copied. Paste it in your ${app} bio, post or story.`);
    setTimeout(() => setNote(null), 5000);
    openApp(appUrl, webUrl);
  };

  return (
    <Screen>
      <BackHeader title="Share your store" fallback="/home" />
      <ScrollView contentContainerClassName="gap-5 px-5 pb-8 pt-2">
        {isLoading && !store ? (
          <>
            <Skeleton className="h-[230px] w-[230px] self-center rounded-3xl" />
            <Skeleton className="h-[52px] rounded-[14px]" />
          </>
        ) : (
          <>
            <View className="items-center gap-2 pt-2">
              <View className="rounded-3xl border border-line bg-white p-4">
                <QRCode value={url} size={196} color="#0E1A15" />
              </View>
              <T className="text-center text-[13px] text-muted">Customers scan this to open your store. Print it or take a screenshot.</T>
            </View>

            <View className="h-[52px] flex-row items-center justify-between rounded-[14px] border border-line bg-surface pl-4 pr-1.5">
              <T numberOfLines={1} className="mr-2 flex-1 font-sans-semibold">frontstore.app/{username}</T>
              <Pressable accessibilityRole="button" accessibilityLabel="Copy store link" onPress={copy} className="h-10 justify-center rounded-[10px] bg-ink px-4">
                <T className="font-sans-bold text-sm text-bg">{copied ? 'Copied' : 'Copy'}</T>
              </Pressable>
            </View>

            <View className="flex-row">
              <Action label="WhatsApp" bg="#25D366" onPress={whatsapp}>
                <WhatsAppIcon size={24} color="#FFFFFF" />
              </Action>
              <Action label="Instagram" bg="#E1306C" onPress={() => pasteInto('Instagram', 'instagram://app', 'https://www.instagram.com')}>
                <InstagramLogo size={22} />
              </Action>
              <Action label="Facebook" bg="#1877F2" onPress={facebook}>
                <FacebookIcon size={22} />
              </Action>
              <Action label="TikTok" bg="#000000" onPress={() => pasteInto('TikTok', 'snssdk1233://', 'https://www.tiktok.com')}>
                <TikTokLogo size={20} />
              </Action>
              <Action label="Share to any app" bg="#FFFFFF" border onPress={shareAnywhere}>
                <Share2 size={20} color="#0E1A15" strokeWidth={2} />
              </Action>
            </View>
            {note ? <T accessibilityLiveRegion="polite" className="text-center text-[13px] text-green">{note}</T> : null}

            {username ? (
              <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/shop/store/[slug]', params: { slug: username } })} className="self-center py-2">
                <T className="font-sans-bold text-sm text-green">View your store</T>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
