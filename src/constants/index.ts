export { Colors } from './colors';
export { FontFamily, FontSize, LineHeight, TextStyles } from './typography';
export { Spacing, Radius, Shadow, Layout } from './spacing';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.frontstore.ng/v1';
export const STORE_URL_BASE = process.env.EXPO_PUBLIC_STORE_DOMAIN ?? 'frontstore.ng';

export const ANIMATION_DURATION = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: 500,
} as const;
