import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { queryClient } from '@/api/queryClient';
import { getMe } from '@/api/auth';
import { getProducts } from '@/api/products';
import { getSellerOrders, getWalletBalance } from '@/api/orders';
import { getStore } from '@/api/store';
import { Home, Package, ShoppingBag, Store } from 'lucide-react-native';
import { makeTabBar } from '@/components/TabBar';

const TabBar = makeTabBar(
  [
    { name: 'home', label: 'Home', Icon: Home },
    { name: 'products', label: 'Products', Icon: Package },
    { name: 'orders', label: 'Orders', Icon: ShoppingBag },
    { name: 'settings', label: 'Store', Icon: Store },
  ],
  '/add-product',
);

export default function SellerTabs() {
  // Load every tab's data up front, so switching tabs never shows a loading state.
  useEffect(() => {
    queryClient.prefetchQuery({ queryKey: ['me'], queryFn: getMe });
    queryClient.prefetchQuery({ queryKey: ['seller-store'], queryFn: getStore });
    queryClient.prefetchQuery({ queryKey: ['products'], queryFn: () => getProducts() });
    queryClient.prefetchQuery({ queryKey: ['seller-orders'], queryFn: () => getSellerOrders() });
    queryClient.prefetchQuery({ queryKey: ['wallet'], queryFn: getWalletBalance });
    queryClient.prefetchQuery({ queryKey: ['seller-wallet'], queryFn: getWalletBalance });
  }, []);

  return <Tabs tabBar={(p: any) => <TabBar {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#F6F3EC' } }} />;
}
