import { useEffect } from 'react';
import { Pressable, ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { LogoMark, T } from '@/components/ui';
import { SparkleIcon } from '@/features/setup/parts';
import { setHasSeenOnboarding, setUserMode } from '@/api/authStore';

const lift: ViewStyle = { shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 24, shadowOffset: { width: 0, height: 24 }, elevation: 12 };

/** The two floating cards from the design: a product a buyer sees and the order the seller gets. */
function Art() {
  return (
    <View className="relative mt-[18px] h-[380px]" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[{ position: 'absolute', left: 22, top: 40, width: 200, transform: [{ rotate: '-7deg' }] }, lift]} className="gap-2 rounded-3xl bg-surface p-3.5">
        <View className="h-[120px] rounded-2xl bg-saffron" />
        <T className="font-sans-bold text-sm">Àdìrẹ two-piece</T>
        <T className="font-sans-bold text-[15px] text-green">₦18,500</T>
        <View className="h-9 items-center justify-center rounded-xl bg-ink">
          <T className="font-sans-bold text-[13px] text-white">Add to cart</T>
        </View>
      </View>
      <View style={[{ position: 'absolute', right: 8, top: 150, width: 190, transform: [{ rotate: '6deg' }] }, lift]} className="gap-1.5 rounded-[22px] bg-surface p-3.5">
        <View className="flex-row justify-between">
          <T className="text-xs text-muted">New order</T>
          <T className="font-sans-bold text-xs text-green">Paid</T>
        </View>
        <T className="font-sans-bold text-[15px]">Chioma A.</T>
        <T className="text-xs text-muted">Two-piece · M x2</T>
        <T className="font-display text-[22px]">₦40,000</T>
      </View>
      <View style={{ position: 'absolute', left: 70, bottom: 6, transform: [{ rotate: '-3deg' }] }} className="flex-row items-center gap-1.5 rounded-full bg-gold px-3.5 py-2.5">
        <SparkleIcon size={14} color="#2A1B05" />
        <T className="font-sans-bold text-[13px] text-[#2A1B05]">Nina wrote your product details</T>
      </View>
    </View>
  );
}

export default function Welcome() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setHasSeenOnboarding(true);
  }, []);

  const open = async (to: '/signup' | '/login') => {
    await setHasSeenOnboarding(true);
    router.replace(to);
  };

  // Shoppers can look around before making an account.
  const browse = async () => {
    await setHasSeenOnboarding(true);
    await setUserMode('buyer');
    router.replace('/shop');
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-green">
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(insets.bottom + 16, 40) }} className="px-6 pt-2" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center gap-2">
          <LogoMark size={32} />
          <T className="font-display text-xl text-white">frontstore</T>
        </View>

        <Art />

        <T accessibilityRole="header" className="mt-[22px] font-display-x text-[38px] leading-10 tracking-[-1.1px] text-white">
          Your shop,{'\n'}in your pocket.
        </T>
        <T className="mt-3 text-base leading-6 text-mint-2">Snap a photo, set a price and share one link. Customers pay online, you just deliver.</T>

        <View className="mt-auto gap-2.5 pt-8">
          <Pressable accessibilityRole="button" onPress={() => open('/signup')} className="h-14 items-center justify-center rounded-2xl bg-surface">
            <T className="font-sans-bold text-base text-green">Create my free store</T>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => open('/login')} className="h-14 items-center justify-center rounded-2xl border-[1.5px] border-white/35">
            <T className="font-sans-bold text-base text-white">I already have a store</T>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={browse} className="min-h-11 items-center justify-center pt-1">
            <T className="text-center font-sans-semibold text-sm text-mint-2">
              Just here to shop? <T className="font-sans-semibold text-sm text-white underline">Browse stores</T>
            </T>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
