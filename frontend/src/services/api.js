import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000/api/v1'; // adjust this to match your backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const dashboardApi = {
  getUserDashboard: () => api.get('/dashboard'),
  getNotifications: async () => {
    try {
      const response = await axios.get('/api/notifications', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  getGitHubActivity: async () => {
    try {
      const response = await axios.get('/api/github/activity', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default api; 