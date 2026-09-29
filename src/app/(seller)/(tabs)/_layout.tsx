import { Tabs } from 'expo-router';
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
  return <Tabs tabBar={(p: any) => <TabBar {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#F6F3EC' } }} />;
}
