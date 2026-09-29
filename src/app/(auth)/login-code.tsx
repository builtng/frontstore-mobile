import { useLocalSearchParams } from 'expo-router';
import { CodeEntry } from '@/features/auth/CodeEntry';

/** AppLoginCode = AppVerify with flow=login (defaults to the WhatsApp channel). */
export default function LoginCode() {
  const { channel, to } = useLocalSearchParams<{ channel?: string; to?: string }>();
  return <CodeEntry flow="login" channel={channel === 'email' ? 'email' : 'whatsapp'} to={to} />;
}
