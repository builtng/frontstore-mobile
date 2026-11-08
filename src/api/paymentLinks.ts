import { apiDelete, apiGet, apiPost, apiPut } from './client';

/** Public pages for links and invoices live on the main site. */
export const SITE = 'https://frontstore.app';

export type PaymentLink = {
  id: string;
  title: string;
  slug: string;
  /** Naira. For "any amount" links this is the minimum. */
  amount: number;
  amount_received: number;
  allow_custom_amount: boolean;
  type: 'one_time' | 'reusable';
  status: 'active' | 'disabled' | 'paid';
  expires_at?: string | null;
  created_at: string;
  payments_count?: number;
  /** How many payments came in (sent by newer servers). */
  receipts_count?: number;
};

export type LinkPayment = { customer_name: string | null; customer_email?: string | null; amount: number | null; message?: string | null; paid_at: string };

const norm = (l: any): PaymentLink => ({
  ...l,
  amount: Number(l.amount ?? 0),
  amount_received: Number(l.amount_received ?? 0),
  allow_custom_amount: !!l.allow_custom_amount,
});

export const linkUrl = (l: Pick<PaymentLink, 'slug'>) => `${SITE}/pay/${l.slug}`;

/** Payment links are a Pro feature: the server answers 403 for other plans. */
export async function getPaymentLinks(): Promise<PaymentLink[]> {
  const d = await apiGet<any>('/payment-links');
  return (Array.isArray(d) ? d : d?.data ?? []).map(norm);
}

export async function createPaymentLink(p: { title: string; amount: number; allow_custom_amount: boolean; type: 'one_time' | 'reusable' }): Promise<PaymentLink> {
  return norm(await apiPost<any>('/payment-links', p));
}

export async function setPaymentLinkActive(id: string, active: boolean): Promise<PaymentLink> {
  return norm(await apiPut<any>(`/payment-links/${id}`, { status: active ? 'active' : 'disabled' }));
}

/** Only links that haven't been paid can be deleted. */
export async function deletePaymentLink(id: string): Promise<void> {
  await apiDelete(`/payment-links/${id}`);
}

export async function getPaymentLinkStats(id: string): Promise<PaymentLink & { payments: LinkPayment[] }> {
  const d = await apiGet<any>(`/payment-links/${id}/stats`);
  return { ...norm(d), payments: (d?.payments ?? []).map((p: any) => ({ ...p, amount: p.amount == null ? null : Number(p.amount) })) };
}
