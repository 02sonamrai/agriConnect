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
