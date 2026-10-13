import { useLocalSearchParams } from 'expo-router';
import { CodeEntry } from '@/features/auth/CodeEntry';

/** /login-code?channel=email|phone&to=...&sent_to=...&email=... (defaults to the phone channel). */
export default function LoginCode() {
  const { channel, to, sent_to, email } = useLocalSearchParams<{ channel?: string; to?: string; sent_to?: string; email?: string }>();
  return (
    <CodeEntry
      flow="login"
      channel={channel === 'email' ? 'email' : 'phone'}
      to={to}
      sentTo={sent_to || undefined}
      email={email || undefined}
    />
  );
}
