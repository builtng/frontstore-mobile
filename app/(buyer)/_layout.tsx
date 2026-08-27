import { Stack } from 'expo-router';

export default function BuyerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="orders/index" />
      <Stack.Screen name="orders/[id]" />
      <Stack.Screen name="track" />
      <Stack.Screen name="tracking/live" />
      <Stack.Screen name="tracking/call" />
      <Stack.Screen name="tracking/chat" />
    </Stack>
  );
}

