/**
 * Dark mode for the Expo seller app (from the "App dark - Home / Orders" artboards).
 * Use with NativeWind: add these as `dark:` colours in tailwind.config.js, or read them with useColorScheme().
 */
export const dark = {
  bg: '#0B1411',        // screen background
  surface: '#13201B',   // cards, tab bar
  surface2: '#182822',  // inputs, pressed rows
  border: '#22322B',
  text: '#E8EFEB',
  muted: '#9FB3A9',
  green: '#3FB47F',     // primary buttons, active tab, "Paid" text
  greenInk: '#0B1411',  // text on green buttons
  saffron: '#E9A23B',   // "Share store" button
  danger: '#F07A65',
} as const;

export const light = {
  bg: '#F6F3EC', surface: '#FFFFFF', surface2: '#FBFAF7', border: '#E3DED2', text: '#0E1A15', muted: '#5B6660',
  green: '#0B6E4F', greenInk: '#FFFFFF', saffron: '#E9A23B', danger: '#A8321E',
} as const;

/* tailwind.config.js (NativeWind) example:
   theme: { extend: { colors: {
     app: { bg: '#F6F3EC', 'bg-dark': '#0B1411', card: '#FFFFFF', 'card-dark': '#13201B', line: '#E3DED2', 'line-dark': '#22322B' },
   } } },
   darkMode: 'class'   // then: className="bg-app-bg dark:bg-app-bg-dark"
*/
