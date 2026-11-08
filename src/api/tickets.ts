import { ApiError, apiGet, apiPost } from './client';

export type Attendee = { code: string; name: string; order: string | null; admits: number; ticket: string; checkedInAt: string | null };
export type TicketEvent = {
  id: string | number; name: string; price: number; eventDate: string | null; location: string | null; isDraft: boolean;
  sold: number; checkedIn: number; attendees: Attendee[];
};

/** The seller's ticketed events with who bought and who's in. */
export async function getTicketEvents(): Promise<TicketEvent[]> {
  const d = await apiGet<any>('/tickets');
  return Array.isArray(d) ? d : d?.data ?? [];
}

export type CheckInResult =
  | { kind: 'ok'; attendee: Attendee }
  | { kind: 'already'; attendee: Attendee | null; message: string }
  | { kind: 'unknown'; message: string };

/** Check a ticket in by its code (with or without the TKT- prefix). */
export async function checkInTicket(code: string): Promise<CheckInResult> {
  try {
    const a = await apiPost<any>('/tickets/check-in', { code });
    return { kind: 'ok', attendee: a?.data ?? a };
  } catch (e) {
    const err = e as ApiError;
    if (err.status === 409) return { kind: 'already', attendee: err.data?.data ?? null, message: err.message };
    if (err.status === 404) return { kind: 'unknown', message: err.message || 'No paid ticket in your store has this code.' };
    throw e;
  }
}
