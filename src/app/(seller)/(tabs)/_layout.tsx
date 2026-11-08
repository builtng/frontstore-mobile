import { useEffect } from 'react';
import { Image } from 'react-native';
import { productPhoto } from '@/features/products/ProductImage';
import { Tabs } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import { getMe } from '@/api/auth';
import { getProducts } from '@/api/products';
import { getDailyVisits, getSellerOrders, getWalletBalance } from '@/api/orders';
import { SALES_ORDER_LIMIT } from '@/features/seller/salesStats';
import { getStore } from '@/api/store';
import { Home, Package, ShoppingBag, Store } from 'lucide-react-native';
import { makeTabBar } from '@/components/TabBar';
import { C } from '@/lib/theme';

/** Paid or packed orders still waiting to go out: the badge on the Orders tab. */
function useToShipCount() {
  const { data } = useQuery({ queryKey: ['seller-orders'], queryFn: () => getSellerOrders() });
  return (data ?? []).filter((o) => o.status === 'paid' || o.status === 'packed').length;
}

const TabBar = makeTabBar(
  [
    { name: 'home', label: 'Home', Icon: Home },
    { name: 'orders', label: 'Orders', Icon: ShoppingBag, useBadge: useToShipCount },
    { name: 'products', label: 'Products', Icon: Package },
    { name: 'settings', label: 'Store', Icon: Store },
  ],
  '/add-product',
);

export default function SellerTabs() {
  // Load every tab's data up front, so switching tabs never shows a loading state.
  useEffect(() => {
    queryClient.prefetchQuery({ queryKey: ['me'], queryFn: getMe });
    queryClient.prefetchQuery({ queryKey: ['seller-store'], queryFn: getStore });
    queryClient
      .fetchQuery({ queryKey: ['products'], queryFn: () => getProducts() })
      // Fetch the photos too, so they're there the moment the list opens.
      .then((products) => products.slice(0, 30).forEach((p) => {
        const uri = productPhoto(p);
        if (uri) Image.prefetch(uri).catch(() => {});
      }))
      .catch(() => {});
    queryClient.prefetchQuery({ queryKey: ['seller-orders'], queryFn: () => getSellerOrders() });
    queryClient.prefetchQuery({ queryKey: ['seller-sales-orders'], queryFn: () => getSellerOrders({ limit: SALES_ORDER_LIMIT }) });
    queryClient.prefetchQuery({ queryKey: ['seller-visits'], queryFn: getDailyVisits });
    queryClient.prefetchQuery({ queryKey: ['wallet'], queryFn: getWalletBalance });
    queryClient.prefetchQuery({ queryKey: ['seller-wallet'], queryFn: getWalletBalance });
  }, []);

  return <Tabs tabBar={(p: any) => <TabBar {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.bg } }} />;
}
