# FrontStore Mobile App

Premium React Native (Expo) merchant app for FrontStore.ng.

## Quick Start

```bash
cd mobile
npm install
npx expo start
```

## Required Assets

Place these in `/assets/`:
- `icon.png` — 1024×1024 app icon
- `splash.png` — 1284×2778 splash screen
- `adaptive-icon.png` — 1024×1024 Android adaptive icon
- `favicon.png` — 196×196 web favicon

## Stack

| Layer | Library |
|---|---|
| Framework | Expo SDK 52 + Expo Router v4 |
| Styling | NativeWind v4 (Tailwind) |
| Animations | React Native Reanimated v3 |
| Gestures | React Native Gesture Handler |
| Lists | Shopify FlashList |
| Data fetching | TanStack Query v5 |
| State | Zustand v5 |
| Forms | React Hook Form + Zod |
| Fonts | Outfit + Plus Jakarta Sans (Google Fonts) |
| Icons | Lucide React Native |
| Images | Expo Image |

## Architecture

```
mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/             # Onboarding flow (8 steps)
│   └── (merchant)/         # Merchant dashboard
│       ├── orders/
│       ├── products/
│       ├── marketing.tsx
│       └── more/
├── src/
│   ├── components/
│   │   ├── ui/             # Reusable design system components
│   │   └── merchant/       # Domain-specific components
│   ├── constants/          # Colors, typography, spacing (8pt system)
│   ├── hooks/              # useTheme, useHaptics
│   ├── services/           # API clients (Axios)
│   ├── stores/             # Zustand global state
│   └── types/              # TypeScript interfaces
```

## Brand

- **Primary**: `#62109F` (Frontstore Purple)
- **Navy**: `#0A192F` (Deep Navy)
- **Teal**: `#64FFDA` (Cyber Teal)  
- **Amber**: `#FF9F43` (Vibrant Amber)
- **Headings**: Outfit Bold
- **Body**: Plus Jakarta Sans

## API

Configured to `https://api.frontstore.ng/v1`. Change `API_BASE_URL` in `src/constants/index.ts` for local development.
