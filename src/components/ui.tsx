import { forwardRef } from 'react';
import { Image, Pressable, Text, TextInput, View, type PressableProps, type TextInputProps, type TextProps, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { Link, type Href } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { C } from '@/lib/theme';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/**
 * Text with the Frontstore defaults (Instrument Sans, ink colour).
 * Weights: font-sans-medium / font-sans-semibold / font-sans-bold, headings: font-display / font-display-x.
 */
// Any text colour class passed in. NativeWind does not guarantee that a later colour class wins
// over an earlier one, so the default ink colour is only added when no colour is given.
const TEXT_COLOR = /(^|\s)text-(accent|seg|bg|surface|surface-2|sand|cream|ink|panel|body|mint-fg|rule|disabled|green|green-2|deep|night|mint|mint-2|leaf|saffron|gold|peach|line|line-2|muted|muted-2|faint|faint-2|placeholder|terra|warn-fg|info-fg|on-dark|on-dark-2|danger|white|black|transparent|\[#)/;
const FONT_FAMILY = /(^|\s)font-(sans|display)/;

export function T({ className = '', ...rest }: TextProps & { className?: string }) {
  return (
    <Text
      className={cx(!FONT_FAMILY.test(className) && 'font-sans', !TEXT_COLOR.test(className) && 'text-ink', className)}
      {...rest}
    />
  );
}

/** Full-screen page with safe areas and the app background. */
export function Screen({ className, edges = ['top'], children, ...rest }: ViewProps & { className?: string; edges?: Edge[] }) {
  return (
    <SafeAreaView edges={edges} className={cx('flex-1 bg-bg', className)} {...rest}>
      {children}
    </SafeAreaView>
  );
}

type BtnKind = 'primary' | 'dark' | 'outline' | 'gold' | 'ghost' | 'danger';
const BTN: Record<BtnKind, [string, string]> = {
  primary: ['bg-deep', 'text-white'],
  dark: ['bg-panel', 'text-white'],
  outline: ['border-[1.5px] border-line bg-surface', 'text-ink'],
  gold: ['bg-gold', 'text-[#2A1B05]'],
  ghost: ['bg-transparent', 'text-deep'],
  danger: ['bg-danger', 'text-white'],
};

/** Main button: 54px tall, 16px corners. Pass `href` to navigate, or `onPress`. */
export function Button({
  title, kind = 'primary', href, className, textClassName, disabled, left, right, ...rest
}: PressableProps & { title: string; kind?: BtnKind; href?: Href; className?: string; textClassName?: string; left?: React.ReactNode; right?: React.ReactNode }) {
  const [box, txt] = BTN[kind];
  const inner = (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={cx('h-[54px] flex-row items-center justify-center gap-2 rounded-2xl px-6', box, disabled && 'opacity-40', className)}
      {...rest}
    >
      {left}
      <T className={cx('font-sans-bold text-base', txt, textClassName)}>{title}</T>
      {right}
    </Pressable>
  );
  return href && !disabled ? <Link href={href} asChild>{inner}</Link> : inner;
}

/** Labelled text field matching the designs. */
export const Field = forwardRef<TextInput, TextInputProps & { label?: string; className?: string; hint?: string }>(function Field(
  { label, className, hint, ...rest }, ref,
) {
  return (
    <View className="gap-1.5">
      {label ? <T className="font-sans-bold text-[13px] text-muted">{label}</T> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={C.placeholder}
        className={cx('h-14 rounded-2xl border-[1.5px] border-line bg-surface px-4 font-sans-semibold text-[17px] text-ink', className)}
        {...rest}
      />
      {hint ? <T className="text-[13px] text-muted">{hint}</T> : null}
    </View>
  );
});

/** Rounded white card. */
export function Card({ className, ...rest }: ViewProps & { className?: string }) {
  return <View className={cx('rounded-[22px] border border-line bg-surface', className)} {...rest} />;
}

/** Frontstore main logo mark. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/logo.png')}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.22) }}
      resizeMode="contain"
    />
  );
}

/** Coloured square used in place of product photos until real images exist. */
export function Swatch({ color, className, children }: { color: string; className?: string; children?: React.ReactNode }) {
  return <View style={{ backgroundColor: color }} className={cx('rounded-2xl', className)}>{children}</View>;
}

/** Small status pill. */
export function Pill({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <View style={{ backgroundColor: bg }} className="self-start rounded-full px-2.5 py-1">
      <T style={{ color: fg }} className="font-sans-bold text-xs">{label}</T>
    </View>
  );
}

export { cx };

/** A calm grey shape where text will appear. It doesn't pulse, so nothing flickers. */
export function Skeleton({ className }: { className?: string }) {
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className={cx('rounded-lg bg-sand', className)} />;
}

/** Placeholder list rows, shaped like the real ones so the page doesn't jump. */
export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <View className="gap-2.5">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} className="flex-row items-center gap-3 rounded-[22px] border border-line bg-surface p-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </View>
        </View>
      ))}
    </View>
  );
}

/** What a section shows when it truly has nothing: what's missing and what to do next. */
export function EmptyState({ icon, title, sub, action, onAction, href }: {
  icon?: React.ReactNode;
  title: string;
  sub?: string;
  action?: string;
  onAction?: () => void;
  href?: Href;
}) {
  return (
    <View className="items-center gap-3 rounded-[22px] border border-line bg-surface px-5 py-6">
      {icon ? <View className="h-12 w-12 items-center justify-center rounded-2xl bg-bg">{icon}</View> : null}
      <View className="items-center gap-1">
        <T className="text-center font-sans-bold text-[15px]">{title}</T>
        {sub ? <T className="text-center text-[13px] text-muted">{sub}</T> : null}
      </View>
      {action ? <Button title={action} kind="dark" href={href} onPress={onAction} className="h-11 rounded-xl px-5" textClassName="text-sm" /> : null}
    </View>
  );
}

/** A section that couldn't load: not the same as having nothing. */
export function LoadError({ what, onRetry }: { what: string; onRetry?: () => void }) {
  return <EmptyState title={`Couldn’t load ${what}`} sub="Check your connection and try again." action={onRetry ? 'Try again' : undefined} onAction={onRetry} />;
}
