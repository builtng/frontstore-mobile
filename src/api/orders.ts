import { apiGet, apiPatch, apiPost } from './client';
import { format } from 'date-fns';
import { Order, OrderStatus, WalletBalance, PayoutRecord } from './types';

/**
 * The backend keeps order_status / payment_status / delivery_milestone and
 * amounts in naira; the screens use one fulfilment stage and kobo.
 */
export function orderStage(o: any): OrderStatus {
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

/** Fetch seller orders */
export async function getSellerOrders(params?: { status?: string }): Promise<Order[]> {
  const data = await apiGet<any>('/orders', params);
  const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
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

/** Merchant refunds the whole order */
export async function refundOrder(id: string | number, reason: string): Promise<Order> {
  return normalizeOrder(await apiPost<any>(`/orders/${id}/refund`, { reason }));
}

/** Fetch seller wallet balance */
export async function getWalletBalance(): Promise<WalletBalance> {
  return apiGet<WalletBalance>('/store/wallet');
}

/** Fetch seller payout history (the wallet endpoint lists the store's withdrawals, amounts in naira) */
export async function getPayoutHistory(): Promise<PayoutRecord[]> {
  const wallet = await apiGet<any>('/store/wallet');
  const rows: any[] = Array.isArray(wallet?.withdrawals) ? wallet.withdrawals : [];
  return rows.map((w) => ({
    id: w.id,
    amount_kobo: Math.round(Number(w.amount || 0) * 100),
    status: w.status === 'completed' ? 'paid' : w.status === 'failed' || w.status === 'rejected' ? 'failed' : 'processing',
    date: format(new Date(w.requested_at || w.created_at), 'd MMM yyyy'),
    bank_name: w.bank_name || '',
    account_number: w.account_number || '',
  }));
}

/** Request withdrawal payout */
export async function requestWithdrawal(amountKobo: number, otpCode?: string): Promise<any> {
  return apiPost('/store/withdraw', {
    amount: amountKobo,
    otp: otpCode,
  });
}

/** Send OTP for withdrawal/payout account change */
export async function sendWithdrawalOtp(): Promise<any> {
  return apiPost('/store/withdraw/send-otp');
}
