import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Home, Search, ShoppingCart, User } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useCartStore } from '@/stores/cartStore';

function TabIcon({ focused, Icon, label, badgeCount }: { focused: boolean; Icon: any; label: string; badgeCount?: number }) {
  const { theme } = useTheme();
  const scale = useSharedValue(focused ? 1 : 0.9);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.9, { damping: 15, stiffness: 300 });
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={styles.tabItem}>
      <Animated.View style={[animStyle, styles.iconWrap]}>
        <Icon
          size={22}
          color={focused ? Colors.primary : theme.textTertiary}
          strokeWidth={focused ? 2.5 : 1.8}
        />
        {(badgeCount ?? 0) > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount! > 9 ? '9+' : badgeCount}</Text>
          </View>
        )}
      </Animated.View>
      <Text
        style={[styles.label, { color: focused ? Colors.primary : theme.textTertiary }, focused && styles.labelActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function CartTabIcon({ focused }: { focused: boolean }) {
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  return <TabIcon focused={focused} Icon={ShoppingCart} label="Cart" badgeCount={itemCount} />;
}

export default function PublicLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: Spacing[2],
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={Home} label="Home" /> }}
      />
      <Tabs.Screen
        name="search"
        options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={Search} label="Search" /> }}
      />
      <Tabs.Screen
        name="cart"
        options={{ tabBarIcon: ({ focused }) => <CartTabIcon focused={focused} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={User} label="Account" /> }}
      />
      {/* Store + product drill-down within public group */}
      <Tabs.Screen name="store" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: { alignItems: 'center', gap: 3, paddingTop: Spacing[1], minWidth: 60 },
  iconWrap: { position: 'relative' },
  label: { fontFamily: FontFamily.bodyRegular, fontSize: 10, lineHeight: 13, textAlign: 'center' },
  labelActive: { fontFamily: FontFamily.bodySemiBold },
  badge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: Colors.danger,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: Colors.white, fontSize: 9, fontFamily: FontFamily.headingBold },
});
