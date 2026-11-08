/**
 * Frontstore app tokens (Nov 2026 redesign: cool grey background, forest green, terracotta accent).
 * Fonts: React Native needs one family per weight, so use
 *   font-sans / font-sans-medium / font-sans-semibold / font-sans-bold  (Instrument Sans)
 *   font-display / font-display-x                                     (Plus Jakarta Sans 700 / 800)
 * instead of font-bold etc.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#F4F5F2',
        'bg-alt': '#F8F9FA',
        surface: '#FFFFFF',
        'surface-2': '#F9FAF8',
        sand: '#E9ECE7',
        cream: '#EEF2EF',
        ink: '#0E1A15',
        green: '#1E5E3A',
        'green-light': '#25D366',
        deep: '#1E5E3A',
        dark: '#020C1B',
        mint: '#E6F2EA',
        'mint-2': '#CFE5D7',
        leaf: '#6FD3A4',
        saffron: '#E9A23B',
        amber: '#FF9F43',
        teal: '#64FFDA',
        gold: '#F3C77A',
        peach: '#F3E3C7',
        line: '#E7E9E4',
        'line-2': '#D9DED9',
        muted: '#5F6B65',
        'muted-2': '#4A524E',
        'on-dark': '#C9D6CF',
        'on-dark-2': '#9FB3A9',
        danger: '#9A2C14',
        // Redesign (Nov 2026) additions
        'green-2': '#164A2D',
        night: '#151E1A',
        terra: '#C8553D',
        faint: '#7A847F',
        'faint-2': '#9AA39E',
        placeholder: '#8A948F',
        'warn-bg': '#FDF1E1',
        'warn-fg': '#8A4A06',
        'danger-bg': '#FDECE8',
        'info-bg': '#EEF2FF',
        'info-fg': '#3730A3',
      },
      fontFamily: {
        sans: ['InstrumentSans_400Regular'],
        'sans-medium': ['InstrumentSans_500Medium'],
        'sans-semibold': ['InstrumentSans_600SemiBold'],
        'sans-bold': ['InstrumentSans_700Bold'],
        display: ['PlusJakartaSans_700Bold'],
        'display-x': ['PlusJakartaSans_800ExtraBold'],
      },
    },
  },
  plugins: [],
};
