import type { Order } from '@/api/types';

export type Period = 'today' | 'week' | 'month';
export const PERIODS: ReadonlyArray<readonly [Period, string]> = [['today', 'Today'], ['week', '7 days'], ['month', '30 days']];
export const PERIOD_LABEL: Record<Period, string> = { today: 'today', week: 'last 7 days', month: 'last 30 days' };
const VS: Record<Period, string> = { today: 'vs yesterday', week: 'vs last week', month: 'vs last month' };

/** How many recent orders the home screen loads to work out sales (enough for 60 days at most stores). */
export const SALES_ORDER_LIMIT = 300;

const DAY = 24 * 60 * 60 * 1000;
const startOfToday = (now: Date) => new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

/** Orders that brought money in: paid and not cancelled or refunded. */
const counts = (o: Order) => o.payment_status === 'paid' && o.status !== 'refunded' && o.status !== 'cancelled';
const when = (o: Order) => new Date(o.paid_at || o.created_at).getTime();

export type SalesSummary = {
  salesKobo: number;
  orders: number;
  /** "+18% vs yesterday", or null when there's nothing fair to compare with. */
  delta: string | null;
  /** 7 bar heights from 0 to 1, oldest first; the last bar is the current day / slice. */
  bars: number[];
};

/**
 * Sales for a period, its change against the period before, and 7 bars.
 * `orders` is the newest-first list from /orders; `complete` says whether it
 * reaches back far enough to cover the previous period too.
 */
export function summarise(orders: Order[], period: Period, now = new Date()): SalesSummary {
  const today = startOfToday(now);
  const days = period === 'today' ? 1 : period === 'week' ? 7 : 30;
  const from = today - (days - 1) * DAY;
  const prevFrom = from - days * DAY;
  const paid = orders.filter(counts);

  let sales = 0, n = 0, prev = 0;
  for (const o of paid) {
    const t = when(o);
    if (t >= from) { sales += o.total_kobo; n += 1; }
    else if (t >= prevFrom) prev += o.total_kobo;
  }

  // The list is newest first and capped; if it's full and doesn't reach back to the
  // previous period, part of that period is missing, so don't compare.
  const oldest = orders.length ? Math.min(...orders.map(when)) : Infinity;
  const covered = orders.length < SALES_ORDER_LIMIT || oldest <= prevFrom;
  let delta: string | null = null;
  if (covered && prev > 0) {
    const pct = Math.round(((sales - prev) / prev) * 100);
    delta = `${pct >= 0 ? '+' : '−'}${Math.abs(pct)}% ${VS[period]}`;
  } else if (covered && prev === 0 && sales > 0) {
    delta = `Up from ₦0 ${period === 'today' ? 'yesterday' : period === 'week' ? 'last week' : 'last month'}`;
  }

  // Bars: daily for today / 7 days, seven slices of the 30 days for the month.
  const span = period === 'month' ? 30 : 7;
  const slice = span / 7;
  const barFrom = today - (span - 1) * DAY;
  const totals = Array.from({ length: 7 }, () => 0);
  for (const o of paid) {
    const t = when(o);
    if (t < barFrom) continue;
    const dayIndex = Math.floor((t - barFrom) / DAY);
    totals[Math.min(6, Math.floor(dayIndex / slice))] += o.total_kobo;
  }
  const max = Math.max(...totals);
  const bars = totals.map((v) => (max > 0 ? Math.max(0.08, v / max) : 0.08));

  return { salesKobo: sales, orders: n, delta, bars };
}

/** Visits for the period from the 7-day breakdown; the month falls back to the 7-day total. */
export function visitsFor(daily: number[] | undefined, period: Period): { label: string; value: number } | null {
  if (!daily?.length) return null;
  if (period === 'today') return { label: 'Visits', value: daily[daily.length - 1] };
  const week = daily.reduce((a, b) => a + b, 0);
  return { label: period === 'week' ? 'Visits' : 'Visits · 7d', value: week };
}
