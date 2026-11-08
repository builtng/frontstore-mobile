import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';
import { getStore } from '@/api/store';
import { ContactEditSheet } from '@/features/account/ContactEditSheet';
import { T } from '@/components/ui';
import { WhatsAppIcon } from '@/features/setup/parts';
import { toSlug, useDraft } from '@/features/setup/draft';

/** Confetti pieces from the design (x as a share of screen width), kept clear of the text. */
const BITS: Array<[number, number, number, number, string, number]> = [
  [0.1, 70, 10, 18, '#F3C77A', 20], [0.82, 90, 12, 12, '#6FD3A4', 0], [0.2, 150, 8, 16, '#F7A8C4', -30], [0.72, 165, 10, 20, '#F3C77A', 45],
  [0.46, 40, 12, 8, '#FFFFFF', 10], [0.94, 300, 8, 14, '#F7A8C4', 60], [0.02, 290, 12, 12, '#6FD3A4', 15],
];

export default function Live() {
  const { name } = useDraft();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);
  // Signed up without a phone: ask for the real WhatsApp number straight away.
  const { data: store } = useQuery({ queryKey: ['seller-store'], queryFn: getStore });
  const [askWhatsapp, setAskWhatsapp] = useState(false);
  useEffect(() => {
    if (store && !store.whatsapp_phone) setAskWhatsapp(true);
  }, [store?.id]);
  // The saved username is the real link; the draft name is only a stand-in until the store loads.
  const slug = store?.username || toSlug(name);
  const link = `frontstore.app/${slug}`;
  const fullUrl = `https://${link}`;
  const storeName = store?.store_name || name.trim() || 'my store';

  const copyLink = async () => {
    await Clipboard.setStringAsync(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // WhatsApp Status is posted from the system share sheet (WhatsApp shows "My status" there).
  const shareLink = () => Share.share({ message: `Shop ${storeName} on Frontstore: ${fullUrl}` }).catch(() => {});

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-green">
      <StatusBar style="light" />
      <View pointerEvents="none" className="absolute inset-0" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {BITS.map(([x, top, w, h, c, r], k) => (
          <View key={k} style={{ position: 'absolute', left: x * width, top, width: w, height: h, borderRadius: 3, backgroundColor: c, transform: [{ rotate: `${r}deg` }] }} />
        ))}
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(insets.bottom + 16, 40) }} className="px-6 pt-[30px]">
        <View className="items-center gap-4">
          <View style={{ shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 20 }, elevation: 10 }} className="mt-10 h-[92px] w-[92px] items-center justify-center rounded-[30px] bg-surface">
            <Check size={44} color="#1E5E3A" strokeWidth={2.6} />
          </View>
          <T accessibilityRole="header" className="text-center font-display-x text-[34px] leading-[37px] tracking-[-0.68px] text-white">Your store is live!</T>
          <T className="text-center text-base leading-6 text-mint-2">Share your link and your first customer can pay right away.</T>
          <View className="w-full flex-row items-center gap-2 rounded-full bg-white/15 py-1.5 pl-4 pr-1.5">
            <T numberOfLines={1} className="flex-1 font-sans-bold text-[15px] text-white">{slug ? link : 'Getting your link…'}</T>
            <Pressable accessibilityRole="button" accessibilityLabel="Copy store link" disabled={!slug} onPress={copyLink} className="h-10 items-center justify-center rounded-full bg-surface px-4">
              <T className="font-sans-bold text-sm text-green">{copied ? 'Copied' : 'Copy'}</T>
            </Pressable>
          </View>
          <Pressable accessibilityRole="link" disabled={!slug} onPress={() => router.push({ pathname: '/shop/store/[slug]', params: { slug } })} className="min-h-11 justify-center">
            <T className="font-sans-bold text-sm text-white underline">Preview my store</T>
          </Pressable>
        </View>
        <View className="mt-auto w-full gap-2.5 pt-8">
          <Pressable accessibilityRole="button" disabled={!slug} onPress={shareLink} className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-gold">
            <WhatsAppIcon size={20} color="#2A1B05" />
            <T className="font-sans-bold text-base text-[#2A1B05]">Post on WhatsApp Status</T>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/home')} className="h-14 items-center justify-center rounded-2xl border-[1.5px] border-white/35">
            <T className="font-sans-bold text-base text-white">Go to my dashboard</T>
          </Pressable>
        </View>
      </ScrollView>
      <ContactEditSheet kind={askWhatsapp ? 'whatsapp' : null} onClose={() => setAskWhatsapp(false)} />
    </SafeAreaView>
  );
}
