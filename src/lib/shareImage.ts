import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system';

/**
 * Share a PNG (base64, no data: prefix) through the system share sheet, where
 * people can save it to their photos or post it to WhatsApp, Instagram and so
 * on. Needs no photo-library permission. Returns false if this build can't
 * share files (older builds on Android), so the caller can fall back to text.
 */
export async function shareImage(base64Png: string, fileName: string, title: string): Promise<boolean> {
  const uri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(uri, base64Png, { encoding: FileSystem.EncodingType.Base64 });

  try {
    // Loaded lazily: builds from before expo-sharing was added don't have it
    const Sharing = require('expo-sharing') as typeof import('expo-sharing');
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: title, UTI: 'public.png' });
      return true;
    }
  } catch {
    // fall through
  }

  // iOS's built-in share sheet takes a file URL too
  if (Platform.OS === 'ios') {
    await Share.share({ url: uri, title });
    return true;
  }
  return false;
}
