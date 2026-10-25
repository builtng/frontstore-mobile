import { apiGet, apiGetAllPages, apiPatch, apiPost, apiPostRaw } from './client';
import { format } from 'date-fns';
import { Order, OrderStatus, WalletBalance, PayoutRecord } from './types';

/**
 * The backend keeps order_status / payment_status / delivery_milestone and
 * amounts in naira; the screens use one fulfilment stage and kobo.
 */
export function orderStage(o: any): OrderStatus {
  if (!o) return 'paid';
  if (o.payment_status === 'refunded' || o.order_status === 'refunded') return 'refunded';
  if (o.order_status === 'cancelled' || o.order_status === 'expired') return 'cancelled';
  if (o.order_status === 'completed' || o.delivery_milestone === 'delivered') return 'delivered';
  if (o.delivery_milestone === 'shipped') return 'shipped';
  if (o.order_status === 'processing') return 'packed';
  return 'paid';
}

function normalizeOrder(o: any): Order {
  const amount = Number(o.display_amount ?? o.total_amount ?? 0);
  return { ...o, status: orderStage(o), total_kobo: Math.round(amount * 100) };
}

/** Where a buyer's order is, including unpaid and closed ones (the seller app only sees paid orders). */
export type BuyerStage = 'awaiting_payment' | OrderStatus;

export function buyerStage(o: any): BuyerStage {
  if (!o) return 'awaiting_payment';
  if (o.order_status === 'expired') return 'cancelled';
  if (o.payment_status !== 'paid' && o.payment_status !== 'refunded' && o.order_status === 'pending') return 'awaiting_payment';
  return orderStage(o);
}

export const BUYER_STAGE_LABEL: Record<BuyerStage, string> = {
  awaiting_payment: 'Awaiting payment',
  paid: 'Paid',
  packed: 'Packed',
  shipped: 'Out for delivery',
  delivered: 'Delivered',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

/** Fetch every seller order (the endpoint pages at 50) */
export async function getSellerOrders(params?: { status?: string }): Promise<Order[]> {
  const list = await apiGetAllPages<any>('/orders', params);
  return list.map(normalizeOrder);
}

/** Fetch order detail by ID */
export async function getOrder(id: string | number): Promise<Order> {
  return normalizeOrder(await apiGet<any>(`/orders/${id}`));
}

/** Move an order to the next stage (paid -> packed -> shipped -> delivered) */
export async function updateOrderStatus(
  id: string | number,
  status: OrderStatus,
  courierInfo?: { courier_name?: string; tracking_number?: string }
): Promise<Order> {
  if (status === 'shipped') {
    return normalizeOrder(await apiPatch<any>(`/orders/${id}/shipment`, courierInfo));
  }
  const orderStatus = status === 'packed' ? 'processing' : status === 'delivered' ? 'completed' : null;
  if (!orderStatus) throw new Error(`Can't move an order to "${status}" from the app.`);
  return normalizeOrder(await apiPatch<any>(`/orders/${id}/status`, { order_status: orderStatus }));
}

/**
 * Merchant refunds the whole order. `pendingReview` means the store's balance
 * didn't cover it, so the Frontstore team will decide; the buyer isn't refunded yet.
 */
export async function refundOrder(id: string | number, reason: string): Promise<{ order: Order; pendingReview: boolean; message: string }> {
  const res = await apiPostRaw<any>(`/orders/${id}/refund`, { reason });
  return { order: normalizeOrder(res.data), pendingReview: res.status === 'pending_review', message: res.message ?? '' };
}

/** Fetch seller wallet balance (the backend sends naira and bank_* names) */
export async function getWalletBalance(): Promise<WalletBalance> {
  const w = await apiGet<any>('/store/wallet');
  return {
    available_balance_kobo: Math.round(Number(w?.withdrawable_balance ?? 0) * 100),
    pending_balance_kobo: Math.round(Number(w?.pending_balance ?? 0) * 100),
    bank_name: w?.bank_name ?? null,
    account_number: w?.bank_account_number ?? null,
    account_name: w?.bank_account_name ?? null,
    payout_state: w?.payout_status?.state ?? null,
    next_payout_at: w?.payout_status?.next_payout_at ?? null,
  };
}

/** Fetch seller payout history (the wallet endpoint lists the store's withdrawals, amounts in naira) */
export async function getPayoutHistory(): Promise<PayoutRecord[]> {
  const wallet = await apiGet<any>('/store/wallet');
  const rows: any[] = Array.isArray(wallet?.withdrawals) ? wallet.withdrawals : [];
  return rows.map((w) => ({
    id: w.id,
    amount_kobo: Math.round(Number(w.amount || 0) * 100),
    status: w.status === 'completed' ? 'paid' : w.status === 'failed' || w.status === 'rejected' ? 'failed' : 'processing',
    date: w.requested_at || w.created_at ? format(new Date(w.requested_at || w.created_at), 'd MMM yyyy') : '',
    bank_name: w.bank_name || '',
    account_number: w.account_number || '',
  }));
}

/** Request a payout. The backend works in naira and checks the emailed code as `otp_code`. */
export async function requestWithdrawal(amountKobo: number, otpCode: string): Promise<any> {
  return apiPost('/store/withdraw', {
    amount: amountKobo / 100,
    otp_code: otpCode,
  });
}

/** Send OTP for withdrawal/payout account change */
export async function sendWithdrawalOtp(): Promise<any> {
  return apiPost('/store/withdraw/send-otp');
}
