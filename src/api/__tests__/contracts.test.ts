import { apiClient } from '../client';
import { buyerStage, getSellerOrders, orderStage, requestWithdrawal } from '../orders';
import { getProducts, imageMime, updateProduct } from '../products';
import { addAddress, getBuyerOrders, getNotificationPreferences, submitOrderReview } from '../buyer';
import { checkSubdomainAvailable, updatePayoutAccount } from '../store';

// Each test pins a request or response shape to what the Laravel API actually uses.

jest.mock('../authStore', () => ({ getToken: jest.fn(async () => 't'), removeToken: jest.fn(), setToken: jest.fn(), setUserMode: jest.fn() }));
jest.mock('@/lib/push', () => ({ registerForPush: jest.fn(), unregisterPush: jest.fn() }));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

const ok = (data: any, extra: Record<string, any> = {}) => ({ status: 200, data: { status: 'success', data, ...extra } }) as any;

afterEach(() => jest.restoreAllMocks());

describe('requestWithdrawal', () => {
  it('sends naira and the code as otp_code (WalletController::withdraw)', async () => {
    const post = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(ok({}));
    await requestWithdrawal(1850000, '123456');
    expect(post).toHaveBeenCalledWith('/store/withdraw', { amount: 18500, otp_code: '123456' }, undefined);
  });
});

describe('updatePayoutAccount', () => {
  it('saves through PUT /store and reports an approval-pending change', async () => {
    const put = jest.spyOn(apiClient, 'put').mockResolvedValueOnce(ok({}, { pending_payout_account_change: true }));
    const res = await updatePayoutAccount({ bank_name: 'GTBank', bank_code: '058', account_number: '0123456789', account_name: 'ADA OBI' });
    expect(put).toHaveBeenCalledWith('/store', {
      bank_name: 'GTBank',
      paystack_bank_code: '058',
      bank_account_number: '0123456789',
      bank_account_name: 'ADA OBI',
    });
    expect(res.pending).toBe(true);
  });
});

describe('paginated lists', () => {
  it('fetches every page of products', async () => {
    const get = jest.spyOn(apiClient, 'get')
      .mockResolvedValueOnce(ok({ data: [{ id: 'a', name: 'A', price: 10 }], current_page: 1, last_page: 2 }))
      .mockResolvedValueOnce(ok({ data: [{ id: 'b', name: 'B', price: 20 }], current_page: 2, last_page: 2 }));
    const products = await getProducts();
    expect(products.map((p) => p.id)).toEqual(['a', 'b']);
    expect(get).toHaveBeenNthCalledWith(2, '/products', { params: { limit: 100, page: 2 } });
  });

  it('fetches every page of orders', async () => {
    jest.spyOn(apiClient, 'get')
      .mockResolvedValueOnce(ok({ data: [{ id: '1', total_amount: '100' }], current_page: 1, last_page: 2 }))
      .mockResolvedValueOnce(ok({ data: [{ id: '2', total_amount: '50' }], current_page: 2, last_page: 2 }));
    const orders = await getSellerOrders();
    expect(orders.map((o) => o.total_kobo)).toEqual([10000, 5000]);
  });
});

describe('order stages', () => {
  it('reads shipped and delivered from delivery_milestone / completed', () => {
    expect(orderStage({ order_status: 'processing', delivery_milestone: 'shipped' })).toBe('shipped');
    expect(orderStage({ order_status: 'completed' })).toBe('delivered');
    expect(orderStage({ order_status: 'processing' })).toBe('packed');
  });

  it('tells buyers an unpaid order apart from a paid one', () => {
    expect(buyerStage({ order_status: 'pending', payment_status: 'pending' })).toBe('awaiting_payment');
    expect(buyerStage({ order_status: 'confirmed', payment_status: 'paid' })).toBe('paid');
    expect(buyerStage({ order_status: 'expired', payment_status: 'pending' })).toBe('cancelled');
    expect(buyerStage({ order_status: 'refunded', payment_status: 'refunded' })).toBe('refunded');
  });
});

describe('addAddress', () => {
  it('uses the backend field names (street, area, state, phone)', async () => {
    const post = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(ok({ id: 1 }));
    await addAddress({ label: 'Home', street: '1 Allen Ave', area: 'Ikeja', state: 'Lagos', phone: '08030000000', landmark: null, is_default: true });
    expect(post.mock.calls[0][1]).toMatchObject({ street: '1 Allen Ave', area: 'Ikeja', state: 'Lagos', phone: '08030000000' });
  });
});

describe('submitOrderReview', () => {
  it('sends a reviews array (ReviewController::submitOrderReviews)', async () => {
    const post = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(ok([]));
    await submitOrderReview('order-1', 5, ' Lovely ');
    expect(post).toHaveBeenCalledWith('/public/orders/order-1/reviews', { reviews: [{ product_id: null, rating: 5, comment: 'Lovely' }] }, undefined);
  });
});

describe('buyer fetchers', () => {
  it('read orders from data.orders', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce(ok({ orders: [{ id: 'o1', store: { store_name: 'Mama V', username: 'mamav' } }], stats: {} }));
    const orders = await getBuyerOrders();
    expect(orders[0].store?.name).toBe('Mama V');
  });

  it('surface errors instead of pretending there is nothing', async () => {
    jest.spyOn(apiClient, 'get').mockRejectedValueOnce({ response: { status: 500, data: { message: 'Server error' } } });
    await expect(getBuyerOrders()).rejects.toThrow('Server error');
  });

  it('never invent all-off notification preferences on failure', async () => {
    jest.spyOn(apiClient, 'get').mockRejectedValueOnce({ response: { status: 500, data: {} }, message: 'boom' });
    await expect(getNotificationPreferences()).rejects.toThrow();
  });
});

describe('checkSubdomainAvailable', () => {
  it('is unknown (not "taken") when the check itself fails', async () => {
    jest.spyOn(apiClient, 'get').mockRejectedValueOnce({ response: { status: 503, data: {} }, message: 'down' });
    await expect(checkSubdomainAvailable('mamav')).resolves.toBeNull();
  });

  it('is free on 404', async () => {
    jest.spyOn(apiClient, 'get').mockRejectedValueOnce({ response: { status: 404, data: {} }, message: 'nope' });
    await expect(checkSubdomainAvailable('mamav')).resolves.toBe(true);
  });
});

describe('product payloads', () => {
  it('moves a product off pre-order when it goes live', async () => {
    const put = jest.spyOn(apiClient, 'put').mockResolvedValueOnce(ok({ id: 'p1', name: 'X', price: 1 }));
    await updateProduct('p1', { status: 'live', stock_count: 4 });
    expect(put.mock.calls[0][1]).toMatchObject({ is_draft: false, stock_status: 'in_stock', inventory_quantity: 4 });
  });

  it('marks sold out when stock hits zero', async () => {
    const put = jest.spyOn(apiClient, 'put').mockResolvedValueOnce(ok({ id: 'p1', name: 'X', price: 1 }));
    await updateProduct('p1', { stock_count: 0 });
    expect(put.mock.calls[0][1]).toMatchObject({ stock_status: 'out_of_stock', inventory_quantity: 0 });
  });

  it('uses image/jpeg for .jpg files', () => {
    expect(imageMime('photo.JPG')).toBe('image/jpeg');
    expect(imageMime('photo.png')).toBe('image/png');
    expect(imageMime('noext')).toBe('image/jpeg');
  });
});
