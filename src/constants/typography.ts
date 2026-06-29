import { TextStyle } from 'react-native';

export const FontFamily = {
  headingBold: 'Outfit_700Bold',
  headingSemiBold: 'Outfit_600SemiBold',
  headingMedium: 'Outfit_500Medium',
  bodyRegular: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 36,
  '6xl': 40,
  '7xl': 48,
} as const;

export const LineHeight = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
} as const;

export const LetterSpacing = {
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
  widest: 1.6,
} as const;

export const TextStyles: Record<string, TextStyle> = {
  displayXL: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize['7xl'],
    lineHeight: FontSize['7xl'] * LineHeight.tight,
    letterSpacing: LetterSpacing.tighter,
  },
  displayLG: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize['6xl'],
    lineHeight: FontSize['6xl'] * LineHeight.tight,
    letterSpacing: LetterSpacing.tighter,
  },
  displayMD: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize['5xl'],
    lineHeight: FontSize['5xl'] * LineHeight.tight,
    letterSpacing: LetterSpacing.tight,
  },
  h1: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize['4xl'],
    lineHeight: FontSize['4xl'] * LineHeight.snug,
    letterSpacing: LetterSpacing.tight,
  },
  h2: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize['3xl'],
    lineHeight: FontSize['3xl'] * LineHeight.snug,
    letterSpacing: LetterSpacing.tight,
  },
  h3: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize['2xl'],
    lineHeight: FontSize['2xl'] * LineHeight.snug,
    letterSpacing: LetterSpacing.tight,
  },
  h4: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.xl,
    lineHeight: FontSize.xl * LineHeight.normal,
  },
  h5: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.lg,
    lineHeight: FontSize.lg * LineHeight.normal,
  },
  bodyLG: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.lg,
    lineHeight: FontSize.lg * LineHeight.relaxed,
  },
  bodyMD: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * LineHeight.relaxed,
  },
  bodySM: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * LineHeight.normal,
  },
  bodyXS: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * LineHeight.normal,
  },
  labelLG: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    letterSpacing: LetterSpacing.wide,
  },
  labelMD: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    letterSpacing: LetterSpacing.wide,
  },
  labelSM: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    letterSpacing: LetterSpacing.wider,
    textTransform: 'uppercase',
  },
  caption: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
    letterSpacing: LetterSpacing.normal,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: FontSize.sm,
  },
};
