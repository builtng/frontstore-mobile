import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LayoutGrid, FileText, Package, User } from 'lucide-react-native';
import { FontFamily } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useHaptics } from '@/hooks/useHaptics';

function TabBarIcon({ focused, Icon, label }: {
  focused: boolean;
  Icon: any;
  label: string;
}) {
  return (
    <View style={styles.tabItem}>
      <View
        style={[
          styles.iconContainer,
          focused && styles.iconContainerActive,
        ]}
      >
        <Icon
          size={21}
          color={focused ? '#0F766E' : '#94A3B8'}
          strokeWidth={focused ? 2.4 : 1.8}
        />
      </View>
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? '#0F766E' : '#94A3B8' },
          focused && styles.tabLabelActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export default function MerchantLayout() {
  const haptics = useHaptics();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#EAEFF5',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 86 : 70,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 6,
          elevation: 10,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 16,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        listeners={{
          tabPress: () => haptics.light(),
        }}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} Icon={LayoutGrid} label="Dashboard" />,
        }}
      />
      <Tabs.Screen
        name="orders"
        listeners={{
          tabPress: () => haptics.light(),
        }}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} Icon={FileText} label="Orders" />,
        }}
      />
      <Tabs.Screen
        name="products"
        listeners={{
          tabPress: () => haptics.light(),
        }}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} Icon={Package} label="Products" />,
        }}
      />
      <Tabs.Screen
        name="more"
        listeners={{
          tabPress: () => haptics.light(),
        }}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} Icon={User} label="Profile" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 64,
  },
  iconContainer: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(18, 140, 126, 0.12)',
  },
  tabLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  tabLabelActive: {
    fontFamily: FontFamily.headingBold,
  },
});
