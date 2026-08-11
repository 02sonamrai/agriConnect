import axios from 'axios';

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

export default api;
