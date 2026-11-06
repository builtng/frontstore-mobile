import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { T, cx } from '@/components/ui';

/** The photo to show for a product in a list: the small version when there is one. */
export function productPhoto(p?: { thumbnail_url?: string | null; image_url?: string | null; images?: string[] } | null) {
  return p?.thumbnail_url || p?.image_url || p?.images?.[0] || null;
}

/** A product's photo, or its first letter when it has none or the photo won't load. */
export function ProductImage({ uri, name, className, textClassName = 'text-lg' }: {
  uri?: string | null;
  name?: string;
  /** Size and corner radius. */
  className: string;
  textClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);

  return (
    // A neutral background while the photo loads, so a letter never flashes first.
    <View className={cx('items-center justify-center overflow-hidden', uri && !failed ? 'bg-[#E9E4D9]' : 'bg-[#E9A23B]', className)}>
      {uri && !failed ? (
        <Image source={{ uri }} fadeDuration={0} onError={() => setFailed(true)} accessibilityIgnoresInvertColors className="h-full w-full" resizeMode="cover" />
      ) : (
        <T className={cx('font-sans-bold text-white', textClassName)}>{name?.[0] || 'P'}</T>
      )}
    </View>
  );
}
