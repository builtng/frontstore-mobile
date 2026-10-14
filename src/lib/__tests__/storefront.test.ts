import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { openStore, storeLink, storeUrl } from '../storefront';

jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(async () => ({ type: 'dismiss' })) }));

beforeEach(() => jest.clearAllMocks());

describe('store links', () => {
  it('use the path form, not the old subdomain form', () => {
    expect(storeLink('mamav')).toBe('frontstore.app/mamav');
    expect(storeUrl('mamav', 'bubu-gown')).toBe('https://frontstore.app/mamav/bubu-gown');
    expect(storeUrl('mamav', '/bubu-gown')).toBe('https://frontstore.app/mamav/bubu-gown');
  });
});

describe('openStore', () => {
  it('opens the website in an in-app browser tab', async () => {
    await openStore('mamav');

    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith('https://frontstore.app/mamav', expect.any(Object));
  });

  it('falls back to the system browser on builds without the native module', async () => {
    (WebBrowser.openBrowserAsync as jest.Mock).mockRejectedValueOnce(new Error("Cannot find native module 'ExpoWebBrowser'"));
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValueOnce(true);

    await openStore('mamav');

    expect(open).toHaveBeenCalledWith('https://frontstore.app/mamav');
  });
});
