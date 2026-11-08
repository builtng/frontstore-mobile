import { apiDelete, apiGet, apiPost, apiPut } from './client';
import { SITE } from './paymentLinks';

export type InvoiceItem = { name: string; qty: number; price: number };
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export type Invoice = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_whatsapp: string | null;
  issue_date: string;
  due_date: string;
  /** Naira. */
  subtotal: number;
  tax_rate: number;
  discount_rate: number;
  total_amount: number;
  status: InvoiceStatus;
  items: InvoiceItem[];
  notes: string | null;
  created_at: string;
};

const norm = (v: any): Invoice => ({
  ...v,
  subtotal: Number(v.subtotal ?? 0),
  tax_rate: Number(v.tax_rate ?? 0),
  discount_rate: Number(v.discount_rate ?? 0),
  total_amount: Number(v.total_amount ?? 0),
  items: Array.isArray(v.items) ? v.items.map((i: any) => ({ name: String(i.name ?? ''), qty: Number(i.qty ?? 1), price: Number(i.price ?? 0) })) : [],
});

/** Where the customer opens and pays the invoice. */
export const invoiceUrl = (v: Pick<Invoice, 'id'>) => `${SITE}/track/invoice/${v.id}`;

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
/** The server doesn't move invoices to overdue on its own, so a sent invoice past its due date counts as overdue. */
export function invoiceState(v: Invoice): 'draft' | 'sent' | 'overdue' | 'paid' {
  if (v.status === 'paid') return 'paid';
  if (v.status === 'draft') return 'draft';
  if (v.status === 'overdue') return 'overdue';
  return new Date(v.due_date).getTime() < startOfToday() ? 'overdue' : 'sent';
}

/** Invoices are a Pro feature: the server answers 403 for other plans. */
export async function getInvoices(): Promise<Invoice[]> {
  const d = await apiGet<any>('/invoices');
  return (Array.isArray(d) ? d : d?.data ?? []).map(norm);
}

export async function getInvoice(id: string): Promise<Invoice> {
  return norm(await apiGet<any>(`/invoices/${id}`));
}

export async function createInvoice(p: {
  customer_name: string; customer_email?: string | null; customer_whatsapp?: string | null;
  issue_date: string; due_date: string; items: InvoiceItem[]; notes?: string | null; discount_rate?: number;
}): Promise<Invoice> {
  const subtotal = p.items.reduce((s, i) => s + i.qty * i.price, 0);
  return norm(await apiPost<any>('/invoices', { ...p, subtotal, tax_rate: 0, discount_rate: p.discount_rate ?? 0 }));
}

/** Marks a draft as sent (used when the seller shares the link themselves, e.g. on WhatsApp). */
export async function markInvoiceSent(id: string): Promise<Invoice> {
  return norm(await apiPut<any>(`/invoices/${id}`, { status: 'sent' }));
}

/** Emails the invoice to the customer; needs customer_email. */
export async function emailInvoice(id: string): Promise<void> {
  await apiPost(`/invoices/${id}/send`);
}

/** Paid outside Frontstore (cash, transfer): marks it paid and makes a receipt. */
export async function recordInvoicePayment(id: string): Promise<void> {
  await apiPost(`/invoices/${id}/record-payment`);
}

export async function deleteInvoice(id: string): Promise<void> {
  await apiDelete(`/invoices/${id}`);
}
