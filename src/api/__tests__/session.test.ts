import axios, { AxiosError, AxiosHeaders } from 'axios';
import { router } from 'expo-router';
import { apiClient, apiGet } from '../client';
import * as authStore from '../authStore';
import { checkSession } from '../auth';

jest.mock('../authStore', () => ({
  getToken: jest.fn(async () => 'tok-1'),
  setToken: jest.fn(async () => {}),
  removeToken: jest.fn(async () => {}),
  setUserMode: jest.fn(async () => {}),
}));
jest.mock('@/lib/push', () => ({ registerForPush: jest.fn(), unregisterPush: jest.fn() }));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

const store = authStore as jest.Mocked<typeof authStore>;

function httpError(status: number, config: any = { headers: new AxiosHeaders() }) {
  const err = new AxiosError('fail', String(status), config);
  err.response = { status, data: { status: 'error', message: 'x' }, config } as any;
  return err;
}

/** Every apiClient request answers 401, as a real one would after the interceptors run. */
function everyRequest401() {
  apiClient.defaults.adapter = async (config) => {
    throw httpError(401, config);
  };
}

let n = 0;
beforeEach(() => {
  jest.clearAllMocks();
  // A fresh token per test so the shared once-per-token check doesn't carry over
  const tok = `tok-${++n}`;
  store.getToken.mockImplementation(async () => tok);
  everyRequest401();
});

describe('a 401 from a screen', () => {
  it('keeps the user signed in when /auth/me still accepts the token', async () => {
    jest.spyOn(axios, 'get').mockResolvedValueOnce({ status: 200, data: {} });

    await expect(apiGet('/orders')).rejects.toBeTruthy();

    expect(store.removeToken).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('keeps the user signed in when the check cannot reach the server', async () => {
    jest.spyOn(axios, 'get').mockRejectedValueOnce(new Error('Network Error'));

    await expect(apiGet('/orders')).rejects.toBeTruthy();

    expect(store.removeToken).not.toHaveBeenCalled();
  });

  it('signs out only when /auth/me rejects the token too', async () => {
    jest.spyOn(axios, 'get').mockRejectedValueOnce(httpError(401));

    await expect(apiGet('/orders')).rejects.toBeTruthy();

    expect(store.removeToken).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/login');
  });

  it('checks once when several screens fail together', async () => {
    const me = jest.spyOn(axios, 'get').mockRejectedValue(httpError(401));

    await Promise.allSettled([apiGet('/orders'), apiGet('/products'), apiGet('/store')]);

    expect(me).toHaveBeenCalledTimes(1);
    me.mockRestore();
  });
});

describe('checkSession at launch', () => {
  it('keeps the token on a 403', async () => {
    apiClient.defaults.adapter = async (config) => {
      throw httpError(403, config);
    };

    await expect(checkSession()).resolves.toBe('offline');
    expect(store.removeToken).not.toHaveBeenCalled();
  });
});
