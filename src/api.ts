import { useAuthStore } from './store';

const API_URL = '/api';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_URL}${url}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(error.error || 'An error occurred');
  }
  return response.json();
}

export const api = {
  login: (data: any) => fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => fetchWithAuth('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getVendors: () => fetchWithAuth('/vendors'),
  getVendor: (id: number) => fetchWithAuth(`/vendors/${id}`),
  getProducts: (vendorId: number) => fetchWithAuth(`/vendors/${vendorId}/products`),
  createProduct: (data: any) => fetchWithAuth('/products', { method: 'POST', body: JSON.stringify(data) }),
  createOrder: (data: any) => fetchWithAuth('/orders', { method: 'POST', body: JSON.stringify(data) }),
  getOrders: () => fetchWithAuth('/orders'),
  updateOrderStatus: (id: number, data: any) => fetchWithAuth(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  updateVendorProfile: (data: any) => fetchWithAuth('/vendors/profile', { method: 'PUT', body: JSON.stringify(data) }),
  updateUserProfile: (data: any) => fetchWithAuth('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
  quoteAction: (id: number, action: 'approve' | 'decline') => fetchWithAuth(`/orders/${id}/quote-action`, { method: 'PUT', body: JSON.stringify({ action }) }),
  updateStock: (id: number, stock_quantity: number) => fetchWithAuth(`/products/${id}/stock`, { method: 'PUT', body: JSON.stringify({ stock_quantity }) }),
  updateProduct: (id: number, data: any) => fetchWithAuth(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: number) => fetchWithAuth(`/products/${id}`, { method: 'DELETE' }),
  getConversations: () => fetchWithAuth('/messages/conversations'),
  getUnreadCount: () => fetchWithAuth('/messages/unread-count'),
  getMessagesWithUser: (otherUserId: number) => fetchWithAuth(`/messages/user/${otherUserId}`),
  sendMessage: (data: { receiver_id: number; message: string; order_id?: number }) => fetchWithAuth('/messages', { method: 'POST', body: JSON.stringify(data) }),
  getVendorLoyalty: (vendorId: number) => fetchWithAuth(`/loyalty/vendor/${vendorId}`),
  getCustomerLoyalty: () => fetchWithAuth('/loyalty/my-points'),
};
