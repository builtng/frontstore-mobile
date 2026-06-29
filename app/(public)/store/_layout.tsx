import { Stack } from 'expo-router';

export default function StoreLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="[username]/index" />
      <Stack.Screen name="[username]/[slug]" />
      <Stack.Screen name="[username]/checkout" />
    </Stack>
  );
}
