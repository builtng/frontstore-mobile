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
          DEFAULT: '#25D366',
          50: '#ECFDF3',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#25D366',
          600: '#128C7E',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
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
