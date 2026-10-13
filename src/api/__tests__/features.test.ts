import { apiClient } from '../client';
import { getNotifications } from '../store';
import { ninaState } from '@/features/seller/NinaSheet';
import type { Store } from '../types';

jest.mock('../authStore', () => ({ getToken: jest.fn(async () => 't'), removeToken: jest.fn(), setToken: jest.fn(), setUserMode: jest.fn() }));
jest.mock('@/lib/push', () => ({ registerForPush: jest.fn(), unregisterPush: jest.fn() }));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

describe('getNotifications', () => {
  it('reads items and the unread count', async () => {
    const item = { id: 'order-1', type: 'order', title: 'New order #FS-1', body: 'Chidi paid ₦18,500', url: '/order/1', created_at: '2026-10-13T10:00:00Z' };
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({ status: 200, data: { status: 'success', data: { items: [item], unread: 1 } } } as any);

    await expect(getNotifications()).resolves.toEqual({ items: [item], unread: 1 });
  });

  it('copes with an empty body', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({ status: 200, data: { status: 'success', data: {} } } as any);

    await expect(getNotifications()).resolves.toEqual({ items: [], unread: 0 });
  });
});

describe('ninaState', () => {
  const store = (s: Partial<Store>) => s as Store;

  it('needs a plan when the account is not Pro, whatever the switch says', () => {
    expect(ninaState(store({ nina_available: false, nina_enabled: true }))).toBe('needs_plan');
  });

  it('follows the switch on Pro', () => {
    expect(ninaState(store({ nina_available: true, nina_enabled: true }))).toBe('on');
    expect(ninaState(store({ nina_available: true, nina_enabled: false }))).toBe('off');
  });

  it('is unknown until the store loads', () => {
    expect(ninaState(undefined)).toBeNull();
  });
});
