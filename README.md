# FrontStore Mobile

Expo (React Native) app for FrontStore. One account, two modes:

- **Selling**: store setup, products (photo-first with Nina AI), orders, payouts, sharing.
- **Shopping**: discover stores, track orders, saved items, addresses, reviews.

**No payments happen in the app.** Stores are opened on the website in an in-app
browser tab (Chrome Custom Tab / Safari view) and buyers pay there. The app never
shows plan prices or upgrade links. Merchants withdrawing their own earnings is
not a purchase.

## Quick start

```bash
npm install
npx expo start
```

Checks: `npm run type-check`, `npm run lint`, `npm test`.

## API

Talks to the Laravel API in `../web` (`routes/api.php`). The base URL comes from
`EXPO_PUBLIC_API_BASE_URL` (set per build profile in `eas.json`) and defaults to
`https://frontstore.app/api/v1`. The storefront domain is `EXPO_PUBLIC_STORE_DOMAIN`
(default `frontstore.app`).

Things the backend does that the app has to match:

- Money: the API mostly works in **naira**; the app works in **kobo** internally
  and converts at the edge (`src/api/orders.ts`, `src/api/products.ts`).
- `/products` and `/orders` are paginated; use `apiGetAllPages`.
- Order progress is `order_status` (`pending`, `confirmed`, `processing`, `completed`,
  `refunded`, `expired`) plus `delivery_milestone` (`shipped`). Use `orderStage` /
  `buyerStage`; don't compare `order_status` to "shipped" or "delivered".
- `/auth/complete-setup` **updates the existing store** for a signed-in user who has
  one. Only new stores may go through `(setup)`; payout changes use
  `/payout?mode=edit`, which saves through `PUT /store`.

`src/api/__tests__/contracts.test.ts` pins these request and response shapes.

## Layout

```
src/
  app/            Expo Router screens
    (auth)/       welcome, login, signup, code entry, choose mode
    (setup)/      new-store setup (name, style, payout, first product, live)
    (seller)/     seller tabs, order, product, payouts, share, store edit
    shop/         buyer tabs, track, addresses, reviews, settings
    index.tsx     start-up routing (session check, launch notification)
    switch.tsx    shopping/selling switcher
  api/            API client and typed calls
  components/     shared UI (ui.tsx, TabBar, SearchableSelectModal, …)
  features/       screen parts grouped by area
  lib/            push, storefront links, formatting, image sharing
```

## Stack

Expo SDK 52, Expo Router 4, NativeWind 4, TanStack Query 5, expo-notifications
(Android push needs `google-services.json`; see `app.config.js`).

## Brand

Colours live in `tailwind.config.js`: cream background `#F6F3EC`, ink `#0E1A15`,
green `#0B6E4F`, deep `#07261C`. Fonts: Instrument Sans (body) and Plus Jakarta
Sans (headings).

## Store submissions

See `../docs/store_submission/`.
