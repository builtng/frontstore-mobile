import { Linking } from 'react-native';

/**
 * Stores are browsed and bought from on the website, never inside the app:
 * no checkout or payments in the app keeps App Store payment rules out of it.
 * The app opens a store in an in-app browser tab (Chrome Custom Tab /
 * Safari view) instead.
 */
const DOMAIN = process.env.EXPO_PUBLIC_STORE_DOMAIN || 'frontstore.app';

/** frontstore.app/{username}[/path] (subdomain links are an old style that redirects here) */
export function storeLink(username: string, path = ''): string {
  return `${DOMAIN}/${username}${path ? `/${path.replace(/^\/+/, '')}` : ''}`;
}

export function storeUrl(username: string, path = ''): string {
  return `https://${storeLink(username, path)}`;
}

/** Open a store (or one of its pages) on the website in an in-app browser tab. */
export async function openStore(username: string, path = ''): Promise<void> {
  return openInBrowser(storeUrl(username, path));
}

/** Open a Frontstore page such as /privacy or /terms in an in-app browser tab. */
export function openSitePage(path: string): Promise<void> {
  return openInBrowser(`https://${DOMAIN}/${path.replace(/^\/+/, '')}`);
}

async function openInBrowser(url: string): Promise<void> {
  try {
    // Loaded lazily: app builds from before expo-web-browser was added have no
    // native module for it, and an update must not crash them
    const WebBrowser = require('expo-web-browser') as typeof import('expo-web-browser');
    await WebBrowser.openBrowserAsync(url, { toolbarColor: '#F6F3EC', controlsColor: '#0B6E4F', showTitle: true });
  } catch {
    await Linking.openURL(url).catch(() => {});
  }
}
