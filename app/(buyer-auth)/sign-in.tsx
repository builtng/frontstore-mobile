import { Redirect } from 'expo-router';

// Buyer auth uses phone entry + email OTP verification.
// Phone entry → OTP verification → buyer account created automatically.
export default function BuyerSignIn() {
  return <Redirect href="/(buyer-auth)/phone" />;
}
