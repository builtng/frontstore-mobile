import { apiGet, apiPatch, apiPost } from './client';
import { Order, OrderStatus, WalletBalance, PayoutRecord } from './types';

/** Fetch seller orders */
export async function getSellerOrders(params?: { status?: string }): Promise<Order[]> {
  const data = await apiGet<any>('/orders', params);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

/** Fetch order detail by ID */
export async function getOrder(id: string | number): Promise<Order> {
  return apiGet<Order>(`/orders/${id}`);
}

/** Update order status (paid -> packed -> shipped -> delivered) */
export async function updateOrderStatus(
  id: string | number,
  status: OrderStatus,
  courierInfo?: { courier_name?: string; tracking_number?: string }
): Promise<Order> {
  return apiPatch<Order>(`/orders/${id}/status`, {
    status,
    ...courierInfo,
  });
}

/** Direct merchant order refund */
export async function refundOrder(id: string | number, amountKobo: number, reason?: string): Promise<Order> {
  return apiPost<Order>(`/orders/${id}/refund`, {
    amount: amountKobo,
    reason,
  });
}

/** Fetch seller wallet balance */
export async function getWalletBalance(): Promise<WalletBalance> {
  return apiGet<WalletBalance>('/store/wallet');
}

/** Fetch seller payout history */
export async function getPayoutHistory(): Promise<PayoutRecord[]> {
  const data = await apiGet<any>('/withdrawals');
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
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
