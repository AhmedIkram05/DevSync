const API_URL = 'http://127.0.0.1:8000/api/v1/auth';  // Updated to port 8000 to match backend

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
      
      // Log the actual API response to help debug
      console.log("Login API response:", data);
      
      // Ensure token is available by checking both standard places
      const token = data.token || (data.user && data.user.token);
      
      if (data.user) {
        // Store the enhanced user data including token and GitHub connection status
        const userToStore = {
          ...data.user,
          token: token, // Make sure token is included
          github_connected: data.user.github_connected || false,
          github_username: data.user.github_username || ''
        };
        
        // Log the user object we're storing to help debug
        console.log("Storing user in localStorage:", userToStore);
        
        localStorage.setItem('user', JSON.stringify(userToStore));
        return { ...data, user: userToStore };
      } else {
        console.error("Login response doesn't contain user data:", data);
        return data;
      }
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
    try {
      const userJson = localStorage.getItem('user');
      if (!userJson) {
        console.log("No user data found in localStorage");
        return null;
      }
      
      const user = JSON.parse(userJson);
      
      // Validate the user object has minimum required fields
      if (!user || !user.id || !user.email) {
        console.warn("Incomplete user data in localStorage - missing required fields");
        return null;
      }
      
      // Log user object when retrieving to help debug
      console.log("Retrieved user from localStorage:", user);
      
      return user;
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      // If there's an error parsing, clear the localStorage
      localStorage.removeItem('user');
      return null;
    }
  },
  
  // Improved method to update GitHub connection status in local storage
  updateGitHubStatus: (connected, username = '') => {
    console.log(`Updating GitHub status: connected=${connected}, username=${username}`);
    const user = authApi.getCurrentUser();
    
    if (user) {
      // Create a new user object with updated GitHub status
      const updatedUser = {
        ...user,
        github_connected: connected,
        github_username: username || user.github_username || ''
      };
      
      // Store the updated user in localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log("Updated user with GitHub status:", updatedUser);
      
      return updatedUser;
    } else {
      console.warn("Cannot update GitHub status - no user found in localStorage");
      return null;
    }
  }
};