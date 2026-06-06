const API_BASE = '/api';


const getToken = () => localStorage.getItem('token');

const request = (path, options = {}) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  const url = `${API_BASE}${normalizedPath}`;

  console.log('REQUEST URL:', url);

  return fetch(url, options);
};

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    if (isJson) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || error.message);
    }
    const text = await response.text().catch(() => '');
    throw new Error(`Request failed with status ${response.status}: ${text.slice(0, 200)}`);
  }

  if (isJson) {
    return response.json();
  }
  return response.text();
};

export const api = {
  async getItems(itemType = null, category = null, search = null, page = 1, limit = 20) {
    const params = new URLSearchParams();
    if (itemType) params.append('item_type', itemType);
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    params.append('page', page);
    params.append('limit', limit);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await request(`/items${query}`);
    const data = await handleResponse(response);
    if (typeof data === 'string' && /^\s*<!doctype|^\s*<html/i.test(data)) {
      const snippet = data.trim().slice(0, 240);
      console.error('api.getItems: received non-JSON HTML response from API:', snippet);
      throw new Error('API returned HTML error page instead of JSON. Is the backend reachable?');
    }
    if (!data || typeof data !== 'object' || !Array.isArray(data.items)) {
      console.warn('api.getItems: unexpected response shape:', typeof data, data);
      return { items: [], total: 0, page, limit };
    }
    return data;
  },

  async getItem(slug) {
    const response = await request(`/items/${slug}`);
    return handleResponse(response);
  },

  async register(email, password) {
    const response = await request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  async login(email, password) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    const response = await request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });
    return handleResponse(response);
  },

  async verifyOtp(email, otp) {
    const response = await request('/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    return handleResponse(response);
  },

  async resendOtp(email) {
    const response = await request('/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  async searchValidate(query) {
    const response = await request('/search/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    return handleResponse(response);
  },

  async getBanners() {
    const response = await request('/banners');
    const data = await handleResponse(response);
    if (typeof data === 'string' && /^\s*<!doctype|^\s*<html/i.test(data)) {
      const snippet = data.trim().slice(0, 240);
      console.error('api.getBanners: received non-JSON HTML response from API:', snippet);
      throw new Error('API returned HTML error page instead of JSON. Is the backend reachable?');
    }
    if (!Array.isArray(data)) {
      console.warn('api.getBanners: expected array, got', typeof data, data);
      return [];
    }
    return data;
  },

  async validatePromoCode(code, orderAmount) {
    const response = await request('/promo-codes/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, order_amount: orderAmount }),
    });
    return handleResponse(response);
  },

  async applyPromoCode(code) {
    const response = await request('/promo-codes/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ code }),
    });
    return handleResponse(response);
  },

  async createOrder(items, promoCode = null) {
    const response = await request('/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ items, promo_code: promoCode }),
    });
    return handleResponse(response);
  },

  async getOrders() {
    const response = await request('/orders', {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(response);
  },

  async getOrder(orderId) {
    const response = await request(`/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(response);
  },

  async initiatePayment(orderId, returnUrl = '/payment/success?reference=') {
    const response = await request('/payments/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ order_id: orderId, return_url: returnUrl }),
    });
    return handleResponse(response);
  },

  async verifyPayment(reference) {
    const response = await request('/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference }),
    });
    return handleResponse(response);
  },

  async getPaymentVerify(reference) {
    const response = await request(`/payments/verify/${reference}`);
    return handleResponse(response);
  },

  async getWalletMe() {
    const response = await request('/wallet/me', {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(response);
  },

  async topUpWallet(amount, reference = null, proofNote = null) {
    const body = { amount };
    if (reference) body.reference = reference;
    if (proofNote) body.proof_note = proofNote;
    const response = await request('/wallet/top-up', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  async getWalletTransactions() {
    const response = await request('/wallet/transactions', {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(response);
  },

  async payWithWallet(orderId) {
    const response = await request('/wallet/pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ order_id: orderId }),
    });
    return handleResponse(response);
  },

  async requestTechnician(data) {
    const response = await request('/technician/technicians/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getHealth() {
    const response = await request('/health');
    return handleResponse(response);
  },

  async forgotPassword(email) {
    const response = await request('/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  async resetPassword(token, newPassword) {
    const response = await request('/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    return handleResponse(response);
  },
};
