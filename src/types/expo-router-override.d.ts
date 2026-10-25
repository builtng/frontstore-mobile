import 'expo-router';

declare module 'expo-router' {
  export type RelativePathString = string;
  export type ExternalPathString = string;
  // The type parameter must match expo-router's own Href for the override to merge
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type Href<T = any> = any;
}
