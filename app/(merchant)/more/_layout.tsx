import { Stack } from 'expo-router';

export default function MoreLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="wallet" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="discounts" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
