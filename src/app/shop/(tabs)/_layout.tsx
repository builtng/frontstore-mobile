import { Tabs } from 'expo-router';
import { Compass, Search, ShoppingBag, Heart, User } from 'lucide-react-native';
import { makeTabBar } from '@/components/TabBar';

const TabBar = makeTabBar([
  { name: 'index', label: 'Discover', Icon: Compass },
  { name: 'search', label: 'Search', Icon: Search },
  { name: 'orders', label: 'Orders', Icon: ShoppingBag },
  { name: 'saved', label: 'Saved', Icon: Heart },
  { name: 'profile', label: 'Profile', Icon: User },
]);

export default function BuyerTabs() {
  return <Tabs tabBar={(p: any) => <TabBar {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#F6F3EC' } }} />;
}
