import 'expo-router';

declare module 'expo-router' {
  export type RelativePathString = string;
  export type ExternalPathString = string;
  export type Href<T = any> = any;
}
