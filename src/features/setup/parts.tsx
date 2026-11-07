import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, router, type Href } from 'expo-router';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { ChevronLeft } from 'lucide-react-native';
import { T, cx } from '@/components/ui';

/** router.back() with a fallback when there is no history (deep link / reload). */
export function goBack(fallback: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

/** Back chevron + centred step label + optional right action (Skip / Later). */
export function StepHeader({
  fallback, label, right, hideBack, onBack,
}: { fallback?: Href; label?: string; right?: { title: string; href?: Href; onPress?: () => void }; hideBack?: boolean; onBack?: () => void }) {
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (fallback) goBack(fallback);
  };

  return (
    <View className="flex-row items-center justify-between px-3 pt-1">
      {!hideBack && (fallback || onBack) ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={handleBack}
          className="h-11 w-11 items-center justify-center"
        >
          <ChevronLeft size={22} color="#0E1A15" strokeWidth={2} />
        </Pressable>
      ) : (
        <View className="h-11 w-11" />
      )}
      {label ? <T className="font-sans-bold text-[13px] text-muted">{label}</T> : null}
      {right ? (
        right.onPress ? (
          <Pressable accessibilityRole="button" onPress={right.onPress} className="h-11 justify-center px-2.5">
            <T className="font-sans-semibold text-[15px] text-muted-2">{right.title}</T>
          </Pressable>
        ) : (
          <Link href={right.href!} asChild>
            <Pressable accessibilityRole="link" className="h-11 justify-center px-2.5">
              <T className="font-sans-semibold text-[15px] text-muted-2">{right.title}</T>
            </Pressable>
          </Link>
        )
      ) : (
        <View className="w-11" />
      )}
    </View>
  );
}

/** Thin green progress bar under the step header. */
export function Progress({ pct }: { pct: number }) {
  return (
    <View className="px-5 pt-2.5">
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: pct }}
        className="h-1.5 rounded-full bg-line"
      >
        <View style={{ width: `${pct}%` }} className="h-1.5 rounded-full bg-green" />
      </View>
    </View>
  );
}

/** Screen title + optional sub copy (30px Jakarta 800). */
export function Heading({ title, sub, size = 30 }: { title: string; sub?: React.ReactNode; size?: number }) {
  return (
    <View className="gap-2">
      <T
        accessibilityRole="header"
        style={{ fontSize: size, lineHeight: size * 1.1, letterSpacing: -size * 0.03 }}
        className="font-display-x"
      >
        {title}
      </T>
      {typeof sub === 'string' ? <T className="text-[15px] leading-[22px] text-muted-2">{sub}</T> : sub ?? null}
    </View>
  );
}

/** Pinned bottom area (replaces the design's absolute bottom CTA block). */
export function BottomBar({ children, className }: { children: React.ReactNode; className?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingBottom: Math.max(insets.bottom + 8, 24) }} className={cx('gap-3 px-5 pt-3', className)}>
      {children}
    </View>
  );
}

/**
 * Text input box that shows the design's focus ring (green border + mint outline) while focused.
 * `left` renders an icon or prefix inside the box.
 */
export const RingInput = forwardRef<TextInput, TextInputProps & { left?: React.ReactNode; boxClassName?: string; inputClassName?: string }>(
  function RingInput({ left, boxClassName, inputClassName, onFocus, onBlur, ...rest }, ref) {
    const [focused, setFocused] = useState(false);
    const innerRef = useRef<TextInput>(null);
    useImperativeHandle(ref, () => innerRef.current!);

    return (
      <View className={cx('rounded-[17px] border-[3px]', focused ? 'border-mint-2' : 'border-transparent')} style={{ margin: -3 }}>
        <Pressable
          onPress={() => innerRef.current?.focus()}
          className={cx(
            'h-[54px] flex-row items-center gap-2.5 rounded-[14px] bg-surface px-4',
            focused ? 'border-[1.5px] border-green' : 'border border-line-2',
            left ? 'pl-3.5' : null,
            boxClassName,
          )}
        >
          {left}
          <TextInput
            ref={innerRef}
            placeholderTextColor="#8A928E"
            onFocus={(e) => { setFocused(true); onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); onBlur?.(e); }}
            className={cx('h-full flex-1 text-ink', inputClassName ?? 'font-sans text-base')}
            {...rest}
          />
        </Pressable>
      </View>
    );
  },
);

/** Bold 14px field label + control, matching the designs' <label> blocks. */
export function Labelled({ label, children, className }: { label: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <View className={cx('gap-1.5', className)}>
      {typeof label === 'string' ? <T className="font-sans-bold text-sm">{label}</T> : label}
      {children}
    </View>
  );
}

type IconProps ={ size?: number; color?: string; strokeWidth?: number };

/** Chat bubble used for WhatsApp in the designs. */
/** The WhatsApp logo. Brand green by default. */
export function WhatsAppIcon({ size = 20, color = '#25D366' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      <Path fill={color} d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </Svg>
  );
}

export function InstagramIcon({ size = 22, color = '#0E1A15', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={3} width={18} height={18} rx={5} />
      <Circle cx={12} cy={12} r={4} />
    </Svg>
  );
}

export function TikTokIcon({ size = 22, color = '#0E1A15', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 3v11a4 4 0 1 1-4-4M14 3c0 3 2 5 5 5" />
    </Svg>
  );
}

/** Four-point sparkle used for Nina AI. */
export function SparkleIcon({ size = 16, color = '#6FD3A4' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l2.2 6.5L21 11l-6.8 2.5L12 20l-2.2-6.5L3 11l6.8-2.5z" />
    </Svg>
  );
}
