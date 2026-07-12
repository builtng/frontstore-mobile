import { Redirect } from 'expo-router';

// No separate sign-up — same phone + email OTP flow handles new and existing buyers.
export default function BuyerSignUp() {
  return <Redirect href="/(buyer-auth)/phone" />;
}
