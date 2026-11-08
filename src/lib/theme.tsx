import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Appearance, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, router } from 'expo-router';
import { vars } from 'nativewind';

/**
 * Light and dark palettes (Nov 2026 designs). Tailwind colour tokens read these
 * through CSS variables, so every class-based colour follows the theme.
 */
export const LIGHT = {
  bg: '#F4F5F2', 'bg-alt': '#F8F9FA', surface: '#FFFFFF', 'surface-2': '#F9FAF8', sand: '#E9ECE7', cream: '#EEF2EF',
  ink: '#0E1A15', panel: '#0E1A15', green: '#1E5E3A', deep: '#1E5E3A', 'green-2': '#164A2D',
  mint: '#E6F2EA', 'mint-2': '#CFE5D7', line: '#E7E9E4', 'line-2': '#D9DED9',
  muted: '#5F6B65', 'muted-2': '#4A524E', faint: '#7A847F', 'faint-2': '#9AA39E', placeholder: '#8A948F',
  'warn-bg': '#FDF1E1', 'warn-fg': '#8A4A06', danger: '#9A2C14', 'danger-bg': '#FDECE8', 'info-bg': '#EEF2FF', 'info-fg': '#3730A3',
  'mint-fg': '#14532D', disabled: '#BFD3C6', rule: '#BFC7C1', body: '#26322D', seg: '#FFFFFF', accent: '#1E5E3A',
};
export type Palette = typeof LIGHT;

export const DARK: Palette = {
  bg: '#0B1210', 'bg-alt': '#0B1210', surface: '#151E1A', 'surface-2': '#1A2420', sand: '#222D29', cream: '#1A2420',
  ink: '#EEF2EF', panel: '#1F2B26', green: '#2F7F53', deep: '#2F7F53', 'green-2': '#1E5E3A',
  mint: '#173A2A', 'mint-2': '#CFE5D7', line: '#26322D', 'line-2': '#34413B',
  muted: '#9DA8A2', 'muted-2': '#B5BFBA', faint: '#7A847F', 'faint-2': '#6F7A74', placeholder: '#6F7A74',
  'warn-bg': '#3A2A12', 'warn-fg': '#F2B866', danger: '#E2604A', 'danger-bg': '#3A1C16', 'info-bg': '#22284A', 'info-fg': '#B4BCFF',
  'mint-fg': '#9FD9B8', disabled: '#24443A', rule: '#3A4741', body: '#D5DDD8', seg: '#2A3631', accent: '#6FD3A4',
};

/** The current palette for colours set in code (icons, placeholders). The app remounts when it changes. */
export const C: Palette = { ...LIGHT };

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};
const toVars = (p: Palette) => vars(Object.fromEntries(Object.entries(p).map(([k, v]) => [`--c-${k}`, rgb(v)])));
const LIGHT_VARS = toVars(LIGHT);
const DARK_VARS = toVars(DARK);

export type ThemePref = 'system' | 'light' | 'dark';
const KEY = 'frontstore_theme';

const Ctx = createContext<{ pref: ThemePref; dark: boolean; setPref: (p: ThemePref) => void }>({ pref: 'system', dark: false, setPref: () => {} });
export const useTheme = () => useContext(Ctx);

/**
 * Applies the theme: CSS variables for classes, `C` for code colours. Colours in
 * code are read when a screen draws, so switching remounts the app and then
 * returns to the screen the person was on.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>('system');
  const [system, setSystem] = useState(Appearance.getColorScheme() === 'dark');
  const pathname = usePathname();
  const returnTo = useRef<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => { if (v === 'light' || v === 'dark' || v === 'system') setPrefState(v); }).catch(() => {});
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystem(colorScheme === 'dark'));
    return () => sub.remove();
  }, []);

  const dark = pref === 'dark' || (pref === 'system' && system);
  const prevDark = useRef(dark);
  if (prevDark.current !== dark) {
    // Remember where we were before the remount below.
    returnTo.current = pathname;
    prevDark.current = dark;
  }
  Object.assign(C, dark ? DARK : LIGHT);

  useEffect(() => {
    const to = returnTo.current;
    if (to && to !== '/') {
      returnTo.current = null;
      // Let the fresh navigator settle, then go back to the same screen.
      setTimeout(() => router.replace(to as any), 0);
    }
  }, [dark]);

  const value = useMemo(() => ({
    pref, dark,
    setPref: (p: ThemePref) => { setPrefState(p); AsyncStorage.setItem(KEY, p).catch(() => {}); },
  }), [pref, dark]);

  return (
    <Ctx.Provider value={value}>
      <View key={dark ? 'dark' : 'light'} style={[{ flex: 1, backgroundColor: C.bg }, dark ? DARK_VARS : LIGHT_VARS]}>
        {children}
      </View>
    </Ctx.Provider>
  );
}
