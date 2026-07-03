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
          DEFAULT: '#128C7E',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#128C7E',
          600: '#0F766E',
          700: '#115E59',
          800: '#134E4A',
          900: '#042F2A',
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
