/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#62109F',
          50: '#F3E8FF',
          100: '#E9D5FF',
          200: '#D8B4FE',
          300: '#C084FC',
          400: '#A855F7',
          500: '#62109F',
          600: '#4D0D7D',
          700: '#3B0A5E',
          800: '#2A073F',
          900: '#1A0426',
        },
        navy: {
          DEFAULT: '#0A192F',
          light: '#112240',
          lighter: '#1d3461',
        },
        teal: {
          DEFAULT: '#64FFDA',
          dark: '#00B4D8',
        },
        amber: {
          DEFAULT: '#FF9F43',
          dark: '#E08A2F',
        },
      },
      fontFamily: {
        heading: ['Outfit_700Bold', 'Outfit_600SemiBold'],
        body: ['PlusJakartaSans_400Regular', 'PlusJakartaSans_500Medium'],
        'body-semibold': ['PlusJakartaSans_600SemiBold'],
        'body-bold': ['PlusJakartaSans_700Bold'],
      },
    },
  },
  plugins: [],
};
