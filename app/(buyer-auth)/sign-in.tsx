import { Redirect } from 'expo-router';

// Buyer auth uses the same WhatsApp OTP flow.
// Phone entry → OTP verification → buyer account created automatically.
export default function BuyerSignIn() {
  return <Redirect href="/(buyer-auth)/phone" />;
}
