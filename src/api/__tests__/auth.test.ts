import { AxiosError, AxiosHeaders } from 'axios';
import { apiClient } from '../client';
import { checkSession, completeBuyerSetup, loginWithPassword, verifyOtp } from '../auth';
import { completeStoreSetup } from '../store';
import { getPayoutHistory } from '../orders';
import * as authStore from '../authStore';

jest.mock('../authStore', () => ({
  getToken: jest.fn(async () => 'saved-token'),
  setToken: jest.fn(async () => {}),
  removeToken: jest.fn(async () => {}),
  setUserMode: jest.fn(async () => {}),
}));
jest.mock('@/lib/push', () => ({ registerForPush: jest.fn(), unregisterPush: jest.fn() }));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

const store = authStore as jest.Mocked<typeof authStore>;

/** Make the next request answer with this Laravel body. */
function respond(method: 'post' | 'get', body: any) {
  jest.spyOn(apiClient, method).mockResolvedValueOnce({ status: 200, data: body } as any);
}

function httpError(status: number) {
  const err = new AxiosError('fail', String(status), { headers: new AxiosHeaders() } as any);
  err.response = { status, data: { status: 'error', message: 'Unauthenticated.' } } as any;
  return err;
}

beforeEach(() => jest.clearAllMocks());

describe('token-issuing responses (token sits beside data)', () => {
  it('saves the token from an email-code login and picks seller mode for a store owner', async () => {
    respond('post', { status: 'success', is_new_user: false, token: 'T1', data: { user: { id: 1 }, store: { id: 9 } } });

    const res = await verifyOtp({ email: 'ada@example.com', otp: '123456' });

    expect(store.setToken).toHaveBeenCalledWith('T1');
    expect(store.setUserMode).toHaveBeenCalledWith('seller');
    expect(res.store).toEqual({ id: 9 });
    expect(res.is_new_user).toBe(false);
  });

  it('picks buyer mode for an account with no store', async () => {
    respond('post', { status: 'success', is_new_user: false, token: 'T2', data: { user: { id: 2 }, store: null } });

    await verifyOtp({ phone_number: '08031234567', otp: '123456' });

    expect(store.setToken).toHaveBeenCalledWith('T2');
    expect(store.setUserMode).toHaveBeenCalledWith('buyer');
  });

  it('returns the setup token for a new user without saving anything', async () => {
    respond('post', { status: 'success', is_new_user: true, setup_token: 'S1', email: 'new@example.com' });

    const res = await verifyOtp({ email: 'new@example.com', otp: '123456' });

    expect(res.setup_token).toBe('S1');
    expect(store.setToken).not.toHaveBeenCalled();
  });

  it('still reads a token nested inside data (password login)', async () => {
    respond('post', { status: 'success', data: { user: { id: 3 }, store: { id: 4 }, token: 'T3' } });

    await loginWithPassword('ada@example.com', 'secret');

    expect(store.setToken).toHaveBeenCalledWith('T3');
  });

  it('saves the token from buyer setup', async () => {
    respond('post', { status: 'success', token: 'T4', data: { user: { id: 5 }, store: null } });

    await completeBuyerSetup({ setup_token: 'S1', name: 'Chidi' });

    expect(store.setToken).toHaveBeenCalledWith('T4');
    expect(store.setUserMode).toHaveBeenCalledWith('buyer');
  });

  it('saves the token from seller setup', async () => {
    respond('post', { status: 'success', token: 'T5', data: { user: { id: 6 }, store: { id: 7, username: 'mamav' } } });

    const res = await completeStoreSetup({ setup_token: 'S2', store_name: 'Mama V', username: 'mamav' });

    expect(store.setToken).toHaveBeenCalledWith('T5');
    expect(store.setUserMode).toHaveBeenCalledWith('seller');
    expect(res.store.username).toBe('mamav');
  });
});

describe('checkSession', () => {
  it('drops a token the server rejects', async () => {
    jest.spyOn(apiClient, 'get').mockRejectedValueOnce(httpError(401));

    await expect(checkSession()).resolves.toBe('invalid');
    expect(store.removeToken).toHaveBeenCalled();
  });

  it('keeps the token when the server cannot be reached', async () => {
    jest.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Network Error'));

    await expect(checkSession()).resolves.toBe('offline');
    expect(store.removeToken).not.toHaveBeenCalled();
  });

  it('accepts a token the server knows', async () => {
    respond('get', { status: 'success', data: { user: { id: 1 }, store: null } });

    await expect(checkSession()).resolves.toBe('valid');
  });
});

describe('getPayoutHistory', () => {
  it('maps the wallet withdrawals (naira) to payout rows (kobo)', async () => {
    respond('get', {
      status: 'success',
      data: {
        withdrawals: [
          { id: 'a', amount: '1500.50', status: 'completed', requested_at: '2026-10-01T10:00:00Z', bank_name: 'GTBank', account_number: '0123' },
          { id: 'b', amount: '200.00', status: 'rejected', created_at: '2026-10-02T10:00:00Z' },
          { id: 'c', amount: '50', status: 'pending', created_at: '2026-10-03T10:00:00Z' },
        ],
      },
    });

    const rows = await getPayoutHistory();

    expect(rows.map((r) => [r.amount_kobo, r.status])).toEqual([
      [150050, 'paid'],
      [20000, 'failed'],
      [5000, 'processing'],
    ]);
    expect(rows[0].date).toBe('1 Oct 2026');
    expect(rows[0].bank_name).toBe('GTBank');
  });
});
