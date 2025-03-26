import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api/v1/auth';
//http://127.0.0.1:8000/api/auth/register

export const authApi = {
  register: async (userData) => {
    const response = await axios.post(`${API_URL}/register`, userData);
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (credentials) => {
    try {
      const response = await axios.post(`${API_URL}/login`, credentials, { withCredentials: true });
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error("Login error:", error.response?.data);
      throw error;
    }
  },
  logout: async () => {
    localStorage.removeItem('user');
    return axios.post(`${API_URL}/logout`);
  },

  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  }
}; 