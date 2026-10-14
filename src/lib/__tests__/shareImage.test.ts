import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { shareImage } from '../shareImage';

jest.mock('expo-file-system', () => ({
  cacheDirectory: 'file:///cache/',
  EncodingType: { Base64: 'base64' },
  writeAsStringAsync: jest.fn(async () => {}),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => {}),
}));

beforeEach(() => jest.clearAllMocks());

it('writes the PNG and opens the share sheet with it', async () => {
  await expect(shareImage('iVBOR', 'qr.png', 'Mama V QR code')).resolves.toBe(true);

  expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith('file:///cache/qr.png', 'iVBOR', { encoding: 'base64' });
  expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///cache/qr.png', expect.objectContaining({ mimeType: 'image/png' }));
});

it('uses the built-in share sheet on iOS when expo-sharing is missing', async () => {
  (Sharing.isAvailableAsync as jest.Mock).mockRejectedValueOnce(new Error('no native module'));
  Platform.OS = 'ios';
  const share = jest.spyOn(Share, 'share').mockResolvedValueOnce({ action: 'sharedAction' } as any);

  await expect(shareImage('iVBOR', 'qr.png', 'QR')).resolves.toBe(true);
  expect(share).toHaveBeenCalledWith({ url: 'file:///cache/qr.png', title: 'QR' });
});

it('reports it could not share on Android builds without expo-sharing', async () => {
  (Sharing.isAvailableAsync as jest.Mock).mockRejectedValueOnce(new Error('no native module'));
  Platform.OS = 'android';

  await expect(shareImage('iVBOR', 'qr.png', 'QR')).resolves.toBe(false);
});
