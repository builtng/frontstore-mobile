/**
 * Frontstore app tokens (Nov 2026 redesign). Themed colours are CSS variables set by
 * src/lib/theme.tsx (light and dark palettes); the rest are fixed brand colours.
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
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        'bg-alt': 'rgb(var(--c-bg-alt) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--c-surface-2) / <alpha-value>)',
        sand: 'rgb(var(--c-sand) / <alpha-value>)',
        cream: 'rgb(var(--c-cream) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        green: 'rgb(var(--c-green) / <alpha-value>)',
        'green-light': '#25D366',
        deep: 'rgb(var(--c-deep) / <alpha-value>)',
        dark: '#020C1B',
        mint: 'rgb(var(--c-mint) / <alpha-value>)',
        'mint-2': 'rgb(var(--c-mint-2) / <alpha-value>)',
        leaf: '#6FD3A4',
        saffron: '#E9A23B',
        amber: '#FF9F43',
        teal: '#64FFDA',
        gold: '#F3C77A',
        peach: '#F3E3C7',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        'line-2': 'rgb(var(--c-line-2) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        'muted-2': 'rgb(var(--c-muted-2) / <alpha-value>)',
        'on-dark': '#C9D6CF',
        'on-dark-2': '#9FB3A9',
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
        // Redesign (Nov 2026) additions
        body: 'rgb(var(--c-body) / <alpha-value>)',
        rule: 'rgb(var(--c-rule) / <alpha-value>)',
        seg: 'rgb(var(--c-seg) / <alpha-value>)',
        // Green for text and icons (brighter in dark mode); `green` stays for fills.
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        disabled: 'rgb(var(--c-disabled) / <alpha-value>)',
        'mint-fg': 'rgb(var(--c-mint-fg) / <alpha-value>)',
        panel: 'rgb(var(--c-panel) / <alpha-value>)',
        'green-2': 'rgb(var(--c-green-2) / <alpha-value>)',
        night: '#151E1A',
        terra: '#C8553D',
        faint: 'rgb(var(--c-faint) / <alpha-value>)',
        'faint-2': 'rgb(var(--c-faint-2) / <alpha-value>)',
        placeholder: 'rgb(var(--c-placeholder) / <alpha-value>)',
        'warn-bg': 'rgb(var(--c-warn-bg) / <alpha-value>)',
        'warn-fg': 'rgb(var(--c-warn-fg) / <alpha-value>)',
        'danger-bg': 'rgb(var(--c-danger-bg) / <alpha-value>)',
        'info-bg': 'rgb(var(--c-info-bg) / <alpha-value>)',
        'info-fg': 'rgb(var(--c-info-fg) / <alpha-value>)',
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
