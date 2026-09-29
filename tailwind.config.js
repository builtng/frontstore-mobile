/**
 * Frontstore tokens (same as the web app).
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
        bg: '#F8F9FA',
        'bg-alt': '#F6F3EC',
        surface: '#FFFFFF',
        'surface-2': '#FBFAF7',
        sand: '#ECE8DF',
        cream: '#F3F0E9',
        ink: '#0A192F',
        green: '#128C7E',
        'green-light': '#25D366',
        deep: '#0A192F',
        dark: '#020C1B',
        mint: '#E7F1EC',
        'mint-2': '#CFE8DC',
        leaf: '#25D366',
        saffron: '#FF9F43',
        amber: '#FF9F43',
        teal: '#64FFDA',
        gold: '#F3C77A',
        peach: '#F3E3C7',
        line: '#E3DED2',
        'line-2': '#D8D2C4',
        muted: '#5B6660',
        'muted-2': '#4A524E',
        'on-dark': '#C9D6CF',
        'on-dark-2': '#9FB3A9',
        danger: '#E74C3C',
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
