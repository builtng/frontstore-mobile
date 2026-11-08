import { useLocalSearchParams } from 'expo-router';
import { CodeEntry } from '@/features/auth/CodeEntry';

/** AppLoginCode = AppVerify with flow=login (defaults to the WhatsApp channel). */
export default function LoginCode() {
  const { channel, to, sent_to } = useLocalSearchParams<{ channel?: string; to?: string; sent_to?: string }>();
  return <CodeEntry flow="login" channel={channel === 'email' ? 'email' : 'whatsapp'} to={to} sentTo={sent_to} />;
}
