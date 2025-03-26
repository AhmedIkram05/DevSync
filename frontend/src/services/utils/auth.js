const API_URL = 'http://127.0.0.1:8000/api/v1/auth';

export const authApi = {
  register: async (userData) => {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include' 
      });
      
      // Parse the response JSON regardless of success or failure
      const data = await response.json();
      
      if (!response.ok) {
        // Create an error with the message from the server and additional response data
        const error = new Error(data.message || 'Registration failed');
        error.data = data;
        error.status = response.status;
        throw error;
      }
      
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },
  
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include' 
      });
      
      // Parse the response JSON regardless of success or failure
      const data = await response.json();
      
      if (!response.ok) {
        // Create an error with the message from the server and additional response data
        const error = new Error(data.message || 'Login failed');
        error.data = data;
        error.status = response.status;
        throw error;
      }
      
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const response = await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      localStorage.removeItem('user');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Logout failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error("Logout error:", error);
      // Still remove the user from localStorage even if the API call fails
      localStorage.removeItem('user');
      throw error;
    }
  },
  
  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  }
};