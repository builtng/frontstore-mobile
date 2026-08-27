import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LayoutGrid, FileText, Package, User } from 'lucide-react-native';
import { FontFamily } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';

function TabBarIcon({ focused, Icon, label }: {
  focused: boolean;
  Icon: any;
  label: string;
}) {
  return (
    <View style={styles.tabItem}>
      <Icon
        size={22}
        color={focused ? '#128C7E' : '#94A3B8'}
        strokeWidth={focused ? 2.4 : 1.8}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? '#128C7E' : '#94A3B8' },
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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F1F5F9',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: Spacing[2],
          elevation: 8,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} Icon={LayoutGrid} label="Dashboard" />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} Icon={FileText} label="Orders" />,
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
    gap: 4,
    paddingTop: Spacing[1],
    minWidth: 64,
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
