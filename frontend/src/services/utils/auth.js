const API_URL = 'http://127.0.0.1:8000/api/v1/auth';  // Updated to port 8000 to match backend
const GITHUB_OAUTH_URL = 'http://127.0.0.1:8000/api/v1/github/auth'; // GitHub OAuth URL

// Helper function to handle fetch with proper error handling
const fetchWrapper = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Always include cookies
  });
  
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    const error = new Error(data.message || 'API request failed');
    error.data = data;
    error.status = response.status;
    throw error;
  }
  
  return data;
};

export const authApi = {
  register: async (userData) => {
    try {
      const data = await fetchWrapper(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
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
      const data = await fetchWrapper(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
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

        // Redirect to GitHub OAuth if not connected
        if (!userToStore.github_connected) {
          console.log("Redirecting to GitHub OAuth...");
          window.location.href = GITHUB_OAUTH_URL;
          return; // Stop further execution
        }

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
      await fetchWrapper(`${API_URL}/logout`, {
        method: 'POST',
      });
      
      localStorage.removeItem('user');
      return { success: true };
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
  
  // New method to refresh the authentication token
  refreshToken: async () => {
    try {
      console.log("Attempting to refresh auth token...");
      
      const data = await fetchWrapper(`${API_URL}/refresh-token`, {
        method: 'POST',
      });
      
      if (data.token) {
        const currentUser = authApi.getCurrentUser();
        if (currentUser) {
          // Update the user data with the new token
          const updatedUser = {
            ...currentUser,
            token: data.token
          };
          
          console.log("Token refreshed successfully, updating user data");
          localStorage.setItem('user', JSON.stringify(updatedUser));
          return updatedUser;
        }
      }
      
      throw new Error("Failed to refresh token - no token in response");
    } catch (error) {
      console.error("Token refresh error:", error);
      
      // If refresh fails with unauthorized, the session is likely completely expired
      if (error.status === 401) {
        console.warn("Session expired, clearing user data");
        localStorage.removeItem('user');
      }
      
      throw error;
    }
  },
  
  // Check if token needs refresh (simple expiration check)
  isTokenExpired: () => {
    try {
      const user = authApi.getCurrentUser();
      if (!user || !user.token) return true;
      
      // If we have token expiration time in user object
      if (user.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        // If token expires in less than 5 minutes, consider it expired
        return currentTime > (user.exp - 300);
      }
      
      // Without expiration info, we can't determine - return false to avoid unnecessary refreshes
      return false;
    } catch (error) {
      console.error("Error checking token expiration:", error);
      return true;
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