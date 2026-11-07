/** Format a number as Naira, e.g. 18500 -> "₦18,500". */
export const naira = (n?: number | null) => {
  if (n == null || isNaN(n)) return '₦0';
  return (n < 0 ? '−' : '') + '₦' + Math.abs(n).toLocaleString('en-NG');
};

export const formatNaira = naira;

/** Short money for small tiles: ₦43.5k, ₦1.2m. Exact amounts belong on detail screens. */
export const compactNaira = (n?: number | null) => {
  const v = Number(n ?? 0);
  // Round down, so a balance is never shown as more than it is.
  const short = (x: number, unit: string) => `₦${(Math.floor(x * 10) / 10).toString()}${unit}`;
  if (Math.abs(v) >= 1_000_000) return short(v / 1_000_000, 'm');
  if (Math.abs(v) >= 10_000) return short(v / 1_000, 'k');
  return naira(v);
};
