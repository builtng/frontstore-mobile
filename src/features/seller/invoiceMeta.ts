import { invoiceState, type Invoice } from '@/api/invoices';

/** Pill colours per invoice state (design: sent indigo, overdue red, paid green). */
export const INVOICE_PILL = {
  draft: { label: 'Draft', bg: '#F1F2F4', fg: '#374151' },
  sent: { label: 'Sent', bg: '#EEF2FF', fg: '#3730A3' },
  overdue: { label: 'Overdue', bg: '#FDECE8', fg: '#9A2C14' },
  paid: { label: 'Paid', bg: '#E6F2EA', fg: '#1E5E3A' },
} as const;

export const shortDay = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const daysLate = (iso: string) => Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 86400000));

/** "Due 20 Nov", "6 days late", "Not sent yet". */
export function dueLine(v: Invoice) {
  const st = invoiceState(v);
  if (st === 'paid') return `Issued ${shortDay(v.issue_date)}`;
  if (st === 'draft') return 'Not sent yet';
  if (st === 'overdue') { const n = daysLate(v.due_date); return `${n} day${n === 1 ? '' : 's'} late`; }
  return `Due ${shortDay(v.due_date)}`;
}
