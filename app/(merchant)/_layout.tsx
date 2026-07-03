import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Home, ClipboardList, Package, Bot, MoreHorizontal } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

function TabBarIcon({ focused, Icon, label, isNina = false }: {
  focused: boolean;
  Icon: any;
  label: string;
  isNina?: boolean;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(focused ? 1 : 0.9);
  const dotOpacity = useSharedValue(focused ? 1 : 0);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.9, { damping: 15, stiffness: 300 });
    dotOpacity.value = withSpring(focused ? 1 : 0, { damping: 15 });
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const dotStyle = useAnimatedStyle(() => ({ opacity: dotOpacity.value }));

  if (isNina) {
    return (
      <View style={styles.ninaTabItem}>
        <Animated.View style={[styles.ninaTabGlow, iconStyle]}>
          <LinearGradient
            colors={focused ? ['#128C7E', '#25D366'] : ['#1a4a45', '#1a6b4a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ninaTabPill}
          >
            <Bot size={22} color={Colors.white} strokeWidth={focused ? 2.5 : 2} />
            <Text style={styles.ninaTabLabel}>Nina</Text>
          </LinearGradient>
        </Animated.View>
      </View>
    );
  }

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
        name="nina"
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} Icon={Bot} label="Nina" isNina />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} Icon={Package} label="Products" />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} Icon={MoreHorizontal} label="More" />,
        }}
      />

      {/* Hidden screens — navigated to from dashboard or More menu */}
      <Tabs.Screen name="marketing" options={{ href: null }} />
      <Tabs.Screen name="customers" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="qr-code" options={{ href: null }} />
      <Tabs.Screen name="whatsapp-inbox" options={{ href: null }} />
      <Tabs.Screen name="whatsapp-order-alerts" options={{ href: null }} />
      <Tabs.Screen name="whatsapp-order" options={{ href: null }} />
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

  // Nina center tab pill style
  ninaTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10,
  },
  ninaTabGlow: {
    borderRadius: 28,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  ninaTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 28,
  },
  ninaTabLabel: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13,
    color: Colors.white,
    letterSpacing: -0.2,
  },
});
