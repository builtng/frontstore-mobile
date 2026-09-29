/** Format a number as Naira, e.g. 18500 -> "₦18,500". */
export const naira = (n?: number | null) => {
  if (n == null || isNaN(n)) return '₦0';
  return (n < 0 ? '−' : '') + '₦' + Math.abs(n).toLocaleString('en-NG');
};

export const formatNaira = naira;
