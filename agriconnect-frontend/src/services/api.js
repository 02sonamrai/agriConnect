import axios from 'axios';

/**
 * Pulls a human readable message out of a failed request. The backend's
 * GlobalExceptionHandler answers with { message } or { errors: { field: message } }.
 */
export const getErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  const data = err?.response?.data;
  if (data?.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors)[0];
    if (first) return first;
  }
  return data?.message || err?.message || fallback;
};

const api = axios.create({
  baseURL: '', // Empty because we proxy /api via Vite configuration
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token to all requests if it exists in local storage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('agriconnect_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth Service Endpoints
export const authService = {
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    if (response.data && response.data.token) {
      localStorage.setItem('agriconnect_token', response.data.token);
      localStorage.setItem('agriconnect_user', JSON.stringify(response.data));
    }
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    if (response.data && response.data.token) {
      localStorage.setItem('agriconnect_token', response.data.token);
      localStorage.setItem('agriconnect_user', JSON.stringify(response.data));
    }
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },
  // Updates the signed-in user's own delivery address. The server resolves the account from
  // the JWT, so no user id is sent.
  updateProfile: async (profileData) => {
    const response = await api.put('/api/auth/profile', profileData);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('agriconnect_token');
    localStorage.removeItem('agriconnect_user');
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem('agriconnect_user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

// Farmer Crops Service Endpoints
export const cropService = {
  createCrop: async (cropData) => {
    const response = await api.post('/api/farmer/crops', cropData);
    return response.data;
  },
  getMyCrops: async () => {
    const response = await api.get('/api/farmer/crops');
    return response.data;
  },
  getCropById: async (id) => {
    const response = await api.get(`/api/farmer/crops/${id}`);
    return response.data;
  },
  updateCrop: async (id, cropData) => {
    const response = await api.put(`/api/farmer/crops/${id}`, cropData);
    return response.data;
  },
  deleteCrop: async (id) => {
    const response = await api.delete(`/api/farmer/crops/${id}`);
    return response.data;
  }
};

// Marketplace Service Endpoints
export const marketplaceService = {
  getAvailableCrops: async () => {
    const response = await api.get('/api/marketplace/crops');
    return response.data;
  },
  getCropDetails: async (id) => {
    const response = await api.get(`/api/marketplace/crops/${id}`);
    return response.data;
  }
};

// Market / Mandi Price Endpoints (read-only for Farmer + Buyer, managed by Admin)
export const marketPriceService = {
  getPrices: async (search) =>
    (await api.get('/api/marketplace/market-prices', { params: { search } })).data,
};

export const adminService = {
  getDashboard: async () => (await api.get('/api/admin/dashboard')).data,
  getUsers: async () => (await api.get('/api/admin/users')).data,
  getCrops: async () => (await api.get('/api/admin/crops')).data,
  createMarketPrice: async (price) =>
    (await api.post('/api/admin/market-prices', price)).data,
  updateMarketPrice: async (id, price) =>
    (await api.put(`/api/admin/market-prices/${id}`, price)).data,
  deleteMarketPrice: async (id) => api.delete(`/api/admin/market-prices/${id}`),
};

// Farmer Sales & Earnings (read-only, scoped to the signed-in farmer)
export const farmerDashboardService = {
  getSales: async () => (await api.get('/api/farmer/dashboard/sales')).data,
};

// Cart Service Endpoints (Buyer)
export const cartService = {
  getCart: async () => (await api.get('/api/cart')).data,
  addItem: async (cropId, quantity) =>
    (await api.post('/api/cart/items', { cropId, quantity })).data,
  updateItem: async (itemId, quantity) =>
    (await api.put(`/api/cart/items/${itemId}`, { quantity })).data,
  removeItem: async (itemId) => api.delete(`/api/cart/items/${itemId}`),
  clearCart: async () => api.delete('/api/cart'),
};

// Order Service Endpoints (Buyer + Farmer)
export const orderService = {
  placeOrder: async (note) => (await api.post('/api/orders', { note })).data,
  getMyOrders: async () => (await api.get('/api/orders')).data,
  getOrderById: async (id) => (await api.get(`/api/orders/${id}`)).data,
  getReceivedOrders: async () => (await api.get('/api/orders/received')).data,
  getCoordinatorOrders: async () => (await api.get('/api/orders/coordinator')).data,
  updateOrderStatus: async (id, status) =>
    (await api.put(`/api/orders/${id}/status`, null, { params: { status } })).data,
};

// Seller Contact Endpoint (Buyer / Farmer)
export const contactService = {
  getCropContact: async (cropId) => (await api.get(`/api/contact/crop/${cropId}`)).data,
};

// Notifications. Everything is scoped to the signed-in account by the server, so no user id is
// ever sent from here. There is no create endpoint - alerts are only raised by the order flow.
export const notificationService = {
  getAll: async () => (await api.get('/api/notifications')).data,
  getUnreadCount: async () => (await api.get('/api/notifications/unread-count')).data.unreadCount,
  markRead: async (id) => (await api.put(`/api/notifications/${id}/read`)).data,
  markAllRead: async () => (await api.put('/api/notifications/read-all')).data.markedRead,
};

// Buyer reviews of sellers on delivered orders.
export const reviewService = {
  // Sellers in one of the caller's orders, and which still need a review.
  getOrderTargets: async (orderId) => (await api.get(`/api/reviews/order/${orderId}/targets`)).data,
  create: async (review) => (await api.post('/api/reviews', review)).data,
  update: async (reviewId, review) => (await api.put(`/api/reviews/${reviewId}`, review)).data,
  getMine: async () => (await api.get('/api/reviews/mine')).data,
  // The signed-in farmer's own scorecard - there is no way to ask for another farmer's.
  getMyScorecard: async () => (await api.get('/api/reviews/received/farmer')).data,
  // A coordinator's own collected farmer. Rejected server-side if they did not collect them.
  getCollectedFarmerScorecard: async (collectedFarmerId) =>
    (await api.get(`/api/reviews/received/collected-farmer/${collectedFarmerId}`)).data,
};

// Middleman / Field Coordinator Service Endpoints
export const middlemanService = {
  createFarmer: async (farmerData) => {
    const response = await api.post('/api/middleman/farmers', farmerData);
    return response.data;
  },
  getCollectedFarmers: async () => {
    const response = await api.get('/api/middleman/farmers');
    return response.data;
  },
  getFarmerById: async (id) => {
    const response = await api.get(`/api/middleman/farmers/${id}`);
    return response.data;
  },
  updateFarmer: async (id, farmerData) => {
    const response = await api.put(`/api/middleman/farmers/${id}`, farmerData);
    return response.data;
  },
  deleteFarmer: async (id) => {
    const response = await api.delete(`/api/middleman/farmers/${id}`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/api/middleman/farmers/stats');
    return response.data;
  },
  searchFarmers: async (query = '') => {
    const response = await api.get('/api/middleman/farmers/search', { params: { query } });
    return response.data;
  },
  linkFarmer: async (collectedFarmerId, farmerUserId) => {
    const response = await api.put(`/api/middleman/farmers/${collectedFarmerId}/link/${farmerUserId}`);
    return response.data;
  },
  unlinkFarmer: async (collectedFarmerId) => {
    const response = await api.put(`/api/middleman/farmers/${collectedFarmerId}/unlink`);
    return response.data;
  },
  createCropForFarmer: async (collectedFarmerId, cropData) => {
    const response = await api.post(`/api/middleman/farmers/${collectedFarmerId}/crops`, cropData);
    return response.data;
  },
  getCropsForFarmer: async (collectedFarmerId) => {
    const response = await api.get(`/api/middleman/farmers/${collectedFarmerId}/crops`);
    return response.data;
  },
  updateCrop: async (cropId, cropData) => {
    const response = await api.put(`/api/middleman/crops/${cropId}`, cropData);
    return response.data;
  },
  deleteCrop: async (cropId) => {
    const response = await api.delete(`/api/middleman/crops/${cropId}`);
    return response.data;
  },
  uploadCropImage: async (formData) => {
    const response = await api.post('/api/middleman/crops/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
};

export default api;
