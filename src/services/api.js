const API_BASE = 'http://localhost:8000';

const getToken = () => localStorage.getItem('token');

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || error.message);
  }
  return response.json();
};

export const api = {
  async getItems(itemType = null, category = null) {
    const params = new URLSearchParams();
    if (itemType) params.append('item_type', itemType);
    if (category) params.append('category', category);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE}/items${query}`);
    return handleResponse(response);
  },

  async getItem(slug) {
    const response = await fetch(`${API_BASE}/items/${slug}`);
    return handleResponse(response);
  },

  async register(email, password) {
    const response = await fetch(`${API_BASE}/auth/register`, {
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
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });
    return handleResponse(response);
  },

  async createOrder(items) {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ items }),
    });
    return handleResponse(response);
  },

  async getOrders() {
    const response = await fetch(`${API_BASE}/orders`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    return handleResponse(response);
  },

  async getOrder(orderId) {
    const response = await fetch(`${API_BASE}/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    return handleResponse(response);
  },

  async initiatePayment(orderId) {
    const response = await fetch(`${API_BASE}/payments/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ order_id: orderId }),
    });
    return handleResponse(response);
  },
};
