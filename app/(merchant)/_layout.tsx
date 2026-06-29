import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Home, ClipboardList, Package, Megaphone, MoreHorizontal } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

const TAB_ITEMS = [
  { name: 'index', label: 'Home', Icon: Home },
  { name: 'orders/index', label: 'Orders', Icon: ClipboardList },
  { name: 'products/index', label: 'Products', Icon: Package },
  { name: 'marketing', label: 'Marketing', Icon: Megaphone },
  { name: 'more/index', label: 'More', Icon: MoreHorizontal },
] as const;

function TabBarIcon({ focused, Icon, label }: { focused: boolean; Icon: any; label: string }) {
  const { theme } = useTheme();
  const scale = useSharedValue(focused ? 1 : 0.9);
  const dotOpacity = useSharedValue(focused ? 1 : 0);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.9, { damping: 15, stiffness: 300 });
    dotOpacity.value = withSpring(focused ? 1 : 0, { damping: 15 });
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const dotStyle = useAnimatedStyle(() => ({ opacity: dotOpacity.value }));

  return (
    <View style={styles.tabItem}>
      <Animated.View style={iconStyle}>
        <Icon
          size={22}
          color={focused ? Colors.primary : theme.textTertiary}
          strokeWidth={focused ? 2.5 : 1.8}
        />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? Colors.primary : theme.textTertiary },
          focused && styles.tabLabelActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Animated.View style={[styles.activeDot, { backgroundColor: Colors.primary }, dotStyle]} />
    </View>
  );
}

export default function MerchantLayout() {
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
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} Icon={Home} label="Home" />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} Icon={ClipboardList} label="Orders" />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} Icon={Package} label="Products" />,
        }}
      />
      <Tabs.Screen
        name="marketing"
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} Icon={Megaphone} label="Marketing" />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} Icon={MoreHorizontal} label="More" />,
        }}
      />

      {/* Hidden screens — navigated to from More menu */}
      <Tabs.Screen name="customers" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: Spacing[1],
    position: 'relative',
    minWidth: 60,
  },
  tabLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
  },
  tabLabelActive: {
    fontFamily: FontFamily.bodySemiBold,
  },
  activeDot: {
    position: 'absolute',
    top: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
