import { Redirect } from 'expo-router';

// No separate sign-up — same WhatsApp OTP flow handles new and existing buyers.
export default function BuyerSignUp() {
  return <Redirect href="/(buyer-auth)/phone" />;
}
