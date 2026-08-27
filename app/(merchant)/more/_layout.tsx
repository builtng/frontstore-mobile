import { Stack } from 'expo-router';

export default function MoreLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />

      {/* Finance & Sales */}
      <Stack.Screen name="wallet" />
      <Stack.Screen name="discounts" />
      <Stack.Screen name="qr-code" />

      {/* Business & Growth */}
      <Stack.Screen name="analytics" />
      <Stack.Screen name="customers" />
      <Stack.Screen name="whatsapp-inbox" />

      {/* Account & Settings */}
      <Stack.Screen name="settings" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
